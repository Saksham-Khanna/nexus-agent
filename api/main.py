import os
import json
import asyncio
from dotenv import load_dotenv
load_dotenv()

import time
from collections import defaultdict
from groq import AsyncGroq
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import Literal
from pydantic import BaseModel, Field, field_validator

from agent.graph import agent
from agent.state import AgentState
from agent.utils import extract_domain, MODEL_POWERFUL

groq_client = AsyncGroq()

app = FastAPI(title="ResearchAgent API")

# ── In-memory rate limit + cache (no Redis needed for MVP) ──
RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MIN", "10"))
RATE_WINDOW = 60
CACHE_TTL = int(os.getenv("CACHE_TTL_SEC", "3600"))
_rate_store: dict[str, list[float]] = defaultdict(list)
_cache_store: dict[str, tuple[float, dict]] = {}  # key -> (ts, payload)


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def check_rate_limit(request: Request):
    ip = _get_client_ip(request)
    now = time.time()
    window_start = now - RATE_WINDOW
    # prune old
    _rate_store[ip] = [t for t in _rate_store[ip] if t > window_start]
    if len(_rate_store[ip]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail=f"Rate limit exceeded: {RATE_LIMIT}/min")
    _rate_store[ip].append(now)


def _cache_key(query: str, mode: str) -> str:
    return f"{query.strip().lower()}::{mode}"


def _get_cached(query: str, mode: str):
    key = _cache_key(query, mode)
    entry = _cache_store.get(key)
    if not entry:
        return None
    ts, payload = entry
    if time.time() - ts > CACHE_TTL:
        _cache_store.pop(key, None)
        return None
    return payload


def _set_cached(query: str, mode: str, payload: dict):
    _cache_store[_cache_key(query, mode)] = (time.time(), payload)

# Restrict CORS — set ALLOWED_ORIGINS env var as comma-separated list in production
_allowed = os.getenv("ALLOWED_ORIGINS", "https://nexus-agent-pearl.vercel.app,http://localhost:5173,http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in _allowed.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    query: str = Field(..., min_length=5, max_length=500, description="Research query")
    mode: Literal["quick", "deep", "academic", "news"] = "quick"

    @field_validator("query", mode="before")
    @classmethod
    def strip_and_validate(cls, v):
        if not isinstance(v, str):
            return v
        cleaned = v.strip()
        if len(cleaned) < 5:
            raise ValueError("Query too short — minimum 5 characters")
        if len(cleaned) > 500:
            raise ValueError("Query too long — maximum 500 characters")
        return cleaned


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


# Mode-specific writer prompts
MODE_WRITER_PROMPTS = {
    "quick": (
        "You are an expert researcher writing a concise executive briefing.\n"
        "User Query: {query}\n\n"
        "Here are the summaries of the sources we found:\n{sum_text}\n\n"
        "Write a focused, concise markdown report with:\n"
        "- A clear executive summary (2-3 sentences)\n"
        "- Key findings organized by topic\n"
        "- Key Takeaways as bullet points\n"
        "- References section with [N] Title — URL format\n"
        "Keep it brief and actionable. Use inline citations [1], [2] etc."
    ),
    "deep": (
        "You are an expert researcher writing a comprehensive, exhaustive research report.\n"
        "User Query: {query}\n\n"
        "Here are the summaries of the sources we found:\n{sum_text}\n\n"
        "Write a detailed, multi-section markdown report with:\n"
        "- Executive Summary\n"
        "- Multiple detailed topic sections (each 3-4 paragraphs)\n"
        "- Comparative analysis where applicable\n"
        "- Future outlook / implications\n"
        "- Key Takeaways\n"
        "- References section with [N] Title — URL format\n"
        "Be thorough and analytical. Cite every claim using [1], [2] etc."
    ),
    "academic": (
        "You are an academic researcher writing a formal research paper.\n"
        "User Query: {query}\n\n"
        "Here are the summaries of the sources we found:\n{sum_text}\n\n"
        "Write a formal academic-style markdown report with:\n"
        "- Abstract (150-200 words)\n"
        "- Introduction with background context\n"
        "- Literature Review\n"
        "- Methodology discussion (if applicable)\n"
        "- Findings and Analysis\n"
        "- Discussion\n"
        "- Conclusion\n"
        "- References in academic format: [N] Author/Title, Source, Year — URL\n"
        "Use formal academic tone. Cite using [1], [2] etc."
    ),
    "news": (
        "You are a senior news analyst writing an intelligence briefing.\n"
        "User Query: {query}\n\n"
        "Here are the summaries of the sources we found:\n{sum_text}\n\n"
        "Write a chronological news intelligence briefing in markdown with:\n"
        "- Situation Overview (2-3 sentences)\n"
        "- Timeline of Key Developments (most recent first)\n"
        "- Expert Reactions & Analysis\n"
        "- Impact Assessment\n"
        "- What to Watch Next\n"
        "- Sources with [N] Title — URL format\n"
        "Focus on recency and factual reporting. Cite using [1], [2] etc."
    ),
}


async def stream_agent(query: str, mode: str = "quick"):
    """Run the agent and yield SSE events for each node transition."""

    initial_state: AgentState = {
        "query": query,
        "mode": mode,
        "plan": [],
        "search_results": [],
        "scraped_docs": [],
        "summaries": [],
        "report": "",
        "iterations": 0,
        "status": "starting",
        "reflection": "",
    }

    yield sse_event({"type": "start", "query": query, "mode": mode})

    current_node = None
    total_tokens = 0

    try:
        # Accumulate node deltas into a full merged state (lists extend,
        # token counts add, scalars overwrite) so the writer sees ALL summaries.
        merged_state: dict = {}
        current_node = None

        async for event in agent.astream(initial_state, stream_mode="updates"):
            for node_name, state_update in event.items():
                if node_name == "__end__":
                    continue

                for key, value in state_update.items():
                    if isinstance(value, list):
                        merged_state[key] = merged_state.get(key, []) + value
                    elif key == "tokens":
                        merged_state[key] = merged_state.get(key, 0) + value
                    else:
                        merged_state[key] = value

                if "tokens" in state_update:
                    total_tokens += state_update["tokens"]
                    yield sse_event({"type": "rate_limit", "info": {"tokens": total_tokens}})

                if node_name != current_node:
                    if current_node:
                        yield sse_event({"type": "node_done", "node": current_node})
                    current_node = node_name
                    yield sse_event({"type": "node_start", "node": node_name})

                # Send meaningful partial output per node
                output = {}
                if node_name == "planner" and "plan" in state_update:
                    output = {"plan": state_update["plan"]}
                elif node_name == "researcher" and "search_results" in state_update:
                    results = state_update["search_results"]
                    output = {
                        "count": len(results),
                        "titles": [r["title"] for r in results[:5]],
                        "sources": [
                            {
                                "index": i + 1,
                                "title": r["title"],
                                "url": r["url"],
                                "domain": r.get("domain", extract_domain(r["url"])),
                                "snippet": r.get("snippet", "")[:200],
                                "score": r.get("score", 0),
                            }
                            for i, r in enumerate(results)
                        ],
                    }
                elif node_name == "scraper" and "scraped_docs" in state_update:
                    docs = state_update["scraped_docs"]
                    output = {"count": len(docs), "success": sum(1 for d in docs if d["success"])}
                elif node_name == "summarizer" and "summaries" in state_update:
                    sums = state_update["summaries"]
                    output = {
                        "count": len(sums),
                        "sources": [
                            {
                                "index": i + 1,
                                "title": s["title"],
                                "url": s["url"],
                                "domain": s.get("domain", extract_domain(s["url"])),
                                "summary": s["summary"],
                            }
                            for i, s in enumerate(sums)
                        ],
                    }
                elif node_name == "reflector":
                    output = {
                        "verdict": state_update.get("status", ""),
                        "reflection": state_update.get("reflection", ""),
                    }

                if output:
                    yield sse_event({"type": "node_output", "node": node_name, "output": output})

        if current_node:
            yield sse_event({"type": "node_done", "node": current_node})

        # --- LIVE STREAMING WRITER PHASE ---
        yield sse_event({"type": "node_start", "node": "writer"})

        # Build prompt from accumulated final state
        summaries = merged_state.get("summaries", [])
        sum_text = "\n\n".join([f"[{i+1}] Source: {s['url']}\nTitle: {s['title']}\nSummary: {s['summary']}" for i, s in enumerate(summaries)])
        
        # Use mode-specific writer prompt
        prompt_template = MODE_WRITER_PROMPTS.get(mode, MODE_WRITER_PROMPTS["quick"])
        prompt = prompt_template.format(query=query, sum_text=sum_text)

        # Mode-specific token limits
        max_tokens = {"quick": 2000, "deep": 4000, "academic": 3500, "news": 2500}.get(mode, 3000)
        
        report_chunks = []
        stream = await groq_client.chat.completions.create(
            model=MODEL_POWERFUL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            max_tokens=max_tokens,
        )
        
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                report_chunks.append(content)
                yield sse_event({"type": "writer_token", "content": content})
                
        final_report = "".join(report_chunks)
        yield sse_event({"type": "node_output", "node": "writer", "output": {"report": final_report}})
        yield sse_event({"type": "node_done", "node": "writer"})

        # Emit final sources list for source drawer
        final_sources = []
        if summaries:
            final_sources = [
                    {
                        "index": i + 1,
                        "title": s["title"],
                        "url": s["url"],
                        "domain": s.get("domain", extract_domain(s["url"])),
                        "summary": s["summary"],
                    }
                    for i, s in enumerate(summaries)
                ]
            yield sse_event({
                "type": "sources_complete",
                "sources": final_sources,
            })

        # Save to cache for next hit
        if final_report:
            _set_cached(query, mode, {"report": final_report, "sources": final_sources})

        yield sse_event({"type": "done"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        yield sse_event({"type": "error", "message": str(e)})


@app.post("/run")
async def run_agent(req: RunRequest, request: Request):
    check_rate_limit(request)

    cached = _get_cached(req.query, req.mode)
    if cached:
        async def cached_stream():
            yield sse_event({"type": "start", "query": req.query, "mode": req.mode, "cached": True})
            for n in ["planner", "researcher", "scraper", "summarizer", "reflector"]:
                yield sse_event({"type": "node_start", "node": n})
                yield sse_event({"type": "node_done", "node": n})
            yield sse_event({"type": "node_start", "node": "writer"})
            report = cached["report"]
            for i in range(0, len(report), 80):
                yield sse_event({"type": "writer_token", "content": report[i:i+80]})
                await asyncio.sleep(0.015)
            yield sse_event({"type": "node_output", "node": "writer", "output": {"report": report}})
            yield sse_event({"type": "node_done", "node": "writer"})
            yield sse_event({"type": "sources_complete", "sources": cached["sources"]})
            yield sse_event({"type": "done", "cached": True})
        return StreamingResponse(
            cached_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "X-Cache": "HIT",
            },
        )

    return StreamingResponse(
        stream_agent(req.query, req.mode),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "X-Cache": "MISS",
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok", "cache_size": len(_cache_store), "rate_limit_per_min": RATE_LIMIT}


@app.post("/cache/clear")
async def clear_cache():
    _cache_store.clear()
    return {"status": "cleared"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)

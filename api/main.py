import json
import asyncio
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agent.graph import agent
from agent.state import AgentState

app = FastAPI(title="ResearchAgent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for production (or specify your Render frontend URL here)
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    query: str


def sse_event(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"


async def stream_agent(query: str):
    """Run the agent and yield SSE events for each node transition."""

    initial_state: AgentState = {
        "query": query,
        "plan": [],
        "search_results": [],
        "scraped_docs": [],
        "summaries": [],
        "report": "",
        "iterations": 0,
        "status": "starting",
        "reflection": "",
    }

    yield sse_event({"type": "start", "query": query})

    node_order = ["planner", "researcher", "scraper", "summarizer", "reflector", "writer"]
    current_node = None
    total_tokens = 0

    try:
        final_state = None
        async for event in agent.astream(initial_state, stream_mode="updates"):
            for node_name, state_update in event.items():
                if node_name == "__end__":
                    continue
                
                final_state = state_update
                
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
                    output = {"count": len(results), "titles": [r["title"] for r in results[:3]]}
                elif node_name == "scraper" and "scraped_docs" in state_update:
                    docs = state_update["scraped_docs"]
                    output = {"count": len(docs), "success": sum(1 for d in docs if d["success"])}
                elif node_name == "summarizer" and "summaries" in state_update:
                    sums = state_update["summaries"]
                    output = {"count": len(sums)}
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
        
        from groq import AsyncGroq
        client = AsyncGroq()
        
        # Build prompt from final state
        summaries = final_state.get("summaries", []) if final_state else []
        sum_text = "\n\n".join([f"Source: {s['url']}\nTitle: {s['title']}\nSummary: {s['summary']}" for s in summaries])
        
        prompt = (
            f"You are an expert researcher writing a comprehensive report.\n"
            f"User Query: {query}\n\n"
            f"Here are the summaries of the sources we found:\n{sum_text}\n\n"
            f"Write a detailed markdown report. Use headings, bullet points, and cite your sources using inline brackets like [1], matching the source list you provide at the end."
        )
        
        report_chunks = []
        stream = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            max_tokens=3000
        )
        
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                report_chunks.append(content)
                yield sse_event({"type": "writer_token", "content": content})
                
        final_report = "".join(report_chunks)
        yield sse_event({"type": "node_output", "node": "writer", "output": {"report": final_report}})
        yield sse_event({"type": "node_done", "node": "writer"})

        yield sse_event({"type": "done"})

    except Exception as e:
        import traceback
        traceback.print_exc()
        yield sse_event({"type": "error", "message": str(e)})


@app.post("/run")
async def run_agent(req: RunRequest):
    return StreamingResponse(
        stream_agent(req.query),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)

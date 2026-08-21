import asyncio
from groq import AsyncGroq
from agent.state import AgentState, Summary
from agent.utils import MODEL_POWERFUL

client = AsyncGroq()

SYSTEM = """You are a research assistant. Summarize the provided document in 4-5 concise sentences.
Focus on: key findings, important statistics, main arguments, and anything directly relevant to the research query.
Be factual and precise. Do not add opinions."""

MAX_CONCURRENT = 5


async def _summarize_doc(doc: dict, query: str, sem: asyncio.Semaphore) -> dict | None:
    content = doc.get("content", "")
    if not content or len(content) < 50:
        return None

    prompt = f"Research query: {query}\n\nDocument from {doc['url']}:\n{content}"

    try:
        async with sem:
            response = await client.chat.completions.create(
                model=MODEL_POWERFUL,
                messages=[
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
            )
        return {
            "summary": Summary(
                url=doc["url"],
                title=doc["title"],
                summary=response.choices[0].message.content.strip(),
            ),
            "tokens": response.usage.total_tokens if response.usage else 0
        }
    except Exception as e:
        print(f"[Summarizer] Failed to summarize {doc['url']}: {e}")
        return None


async def summarizer_node(state: AgentState) -> dict:
    docs = state.get("scraped_docs", [])
    query = state.get("query", "")
    summaries: list[Summary] = []
    total_tokens = 0

    # Skip docs already summarized in previous loop iterations
    done_urls = {s["url"] for s in state.get("summaries", [])}
    pending = [d for d in docs if d.get("success") and d["url"] not in done_urls]
    skipped = sum(1 for d in docs if d.get("success")) - len(pending)
    if skipped > 0:
        print(f"[Summarizer] Skipping {skipped} already-summarized docs")

    print(f"[Summarizer] Summarizing {len(pending)} documents in parallel...")

    sem = asyncio.Semaphore(MAX_CONCURRENT)
    tasks = [_summarize_doc(doc, query, sem) for doc in pending]
    results = await asyncio.gather(*tasks)

    for res in results:
        if res:
            summaries.append(res["summary"])
            total_tokens += res["tokens"]

    print(f"[Summarizer] Created {len(summaries)} new summaries")
    return {"summaries": summaries, "status": "summarized", "tokens": total_tokens}

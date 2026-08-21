from groq import AsyncGroq
from agent.state import AgentState
from agent.utils import MODEL_FAST

client = AsyncGroq()

SYSTEM = """You are a research quality evaluator. Given a research question and a set of summaries,
decide if the research is complete enough to write a comprehensive report.

Answer with EXACTLY:
COMPLETE - if the summaries provide sufficient coverage to answer the query well
INCOMPLETE: [reason] - if important aspects are missing and more searching is needed

Be concise. One line only."""


async def reflector_node(state: AgentState) -> dict:
    query = state.get("query", "")
    mode = state.get("mode", "quick")
    summaries = state.get("summaries", [])
    iterations = state.get("iterations", 0)

    print(f"[Reflector] Evaluating research completeness (iteration {iterations}, mode={mode})...")

    # Quick mode: never loop — speed is priority
    if mode == "quick":
        print("[Reflector] Quick mode — skipping reflection, proceeding to write")
        return {"status": "reflect_done", "reflection": "Quick mode: proceeding immediately."}

    # Hard cap on loops
    max_iters = 3 if mode == "deep" else 2
    if iterations >= max_iters:
        print(f"[Reflector] Max iterations ({max_iters}) reached — proceeding to write")
        return {"status": "reflect_done", "reflection": f"Max iterations ({max_iters}) reached. Proceeding with available research."}

    if not summaries:
        return {"status": "reflect_loop", "reflection": "No summaries yet — need more research."}

    # Slim preview: titles + short excerpt is enough for a coverage verdict
    summary_text = "\n".join(
        f"[{i+1}] {s['title']}: {s['summary'][:150]}"
        for i, s in enumerate(summaries)
    )

    prompt = f"Research query: {query}\n\nSummaries collected:\n{summary_text}"

    response = await client.chat.completions.create(
        model=MODEL_FAST,
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt}
        ],
        # Reasoning models spend internal thinking tokens first — give headroom
        reasoning_effort="low",
        max_tokens=2000,
    )

    verdict = response.choices[0].message.content.strip()
    print(f"[Reflector] Verdict: {verdict}")

    tokens = response.usage.total_tokens if response.usage else 0
    if verdict.startswith("COMPLETE"):
        return {"status": "reflect_done", "reflection": verdict, "tokens": tokens}
    else:
        return {"status": "reflect_loop", "reflection": verdict, "tokens": tokens}


def should_continue(state: AgentState) -> str:
    mode = state.get("mode", "quick")
    iterations = state.get("iterations", 0)

    # Quick mode: always finish after 1 pass
    if mode == "quick":
        return "__end__"

    # Deep mode: allow up to 3 iterations
    max_iters = 3 if mode == "deep" else 2
    if iterations >= max_iters:
        return "__end__"

    status = state.get("status", "")
    if status == "reflect_done":
        return "__end__"

    return "researcher"

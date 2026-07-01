from groq import Groq
from agent.state import AgentState

client = Groq()

SYSTEM = """You are a research quality evaluator. Given a research question and a set of summaries,
decide if the research is complete enough to write a comprehensive report.

Answer with EXACTLY:
COMPLETE - if the summaries provide sufficient coverage to answer the query well
INCOMPLETE: [reason] - if important aspects are missing and more searching is needed

Be concise. One line only."""


def reflector_node(state: AgentState) -> dict:
    query = state.get("query", "")
    summaries = state.get("summaries", [])
    iterations = state.get("iterations", 0)

    print(f"[Reflector] Evaluating research completeness (iteration {iterations})...")

    # Hard cap on loops
    if iterations >= 3:
        print("[Reflector] Max iterations reached — proceeding to write")
        return {"status": "reflect_done", "reflection": "Max iterations reached. Proceeding with available research."}

    if not summaries:
        return {"status": "reflect_loop", "reflection": "No summaries yet — need more research."}

    summary_text = "\n\n".join(
        f"[{i+1}] {s['title']} ({s['url']})\n{s['summary']}"
        for i, s in enumerate(summaries)
    )

    prompt = f"Research query: {query}\n\nSummaries collected:\n{summary_text}"

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt}
        ],
        max_tokens=200,
    )

    verdict = response.choices[0].message.content.strip()
    print(f"[Reflector] Verdict: {verdict}")

    tokens = response.usage.total_tokens if response.usage else 0
    if verdict.startswith("COMPLETE"):
        return {"status": "reflect_done", "reflection": verdict, "tokens": tokens}
    else:
        return {"status": "reflect_loop", "reflection": verdict, "tokens": tokens}


def should_continue(state: AgentState) -> str:
    iterations = state.get("iterations", 0)
    if iterations >= 2:
        return "__end__"
    
    status = state.get("status", "")
    if status == "reflect_done":
        return "__end__"
    
    return "researcher"

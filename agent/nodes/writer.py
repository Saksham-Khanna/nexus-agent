from groq import Groq
from agent.state import AgentState

client = Groq()

SYSTEM = """You are an expert research writer. Using the provided summaries, write a comprehensive, 
well-structured research report in Markdown format.

Structure:
# [Title based on research query]

## Executive Summary
(2-3 sentences capturing the key answer)

## [Topic Section 1]
(Content with inline citations like [1], [2])

## [Topic Section 2]
...

## [Topic Section 3]
...

## Key Takeaways
(Bullet points of the most important findings)

## References
[1] Title — URL
[2] Title — URL
...

Rules:
- Use inline citations [N] throughout the text
- Be factual, cite specific data/stats when available
- Write in clear, professional prose
- Each section should be 2-4 paragraphs
- Do not make up information not in the summaries"""


def writer_node(state: AgentState) -> dict:
    query = state.get("query", "")
    summaries = state.get("summaries", [])

    print(f"[Writer] Writing report from {len(summaries)} summaries...")

    if not summaries:
        return {
            "report": "# Research Report\n\nInsufficient data collected to generate a report.",
            "status": "done",
        }

    # Build numbered source list for the prompt
    sources = "\n\n".join(
        f"[{i+1}] Title: {s['title']}\nURL: {s['url']}\nSummary: {s['summary']}"
        for i, s in enumerate(summaries)
    )

    prompt = f"Research query: {query}\n\nSources:\n{sources}\n\nWrite the research report now."

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt}
        ],
        max_tokens=4000,
    )

    report = response.choices[0].message.content.strip()
    print(f"[Writer] Report written ({len(report)} chars)")

    tokens = response.usage.total_tokens if response.usage else 0
    return {"report": report, "status": "done", "tokens": tokens}

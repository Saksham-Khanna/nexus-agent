import json
import re
from groq import AsyncGroq
from agent.state import AgentState
from agent.utils import MODEL_FAST

client = AsyncGroq()

MODE_PROMPTS = {
    "quick": """You are a research planning assistant. Given a research question,
decompose it into 2 focused, high-yield search queries that will quickly answer the question.
Return ONLY a JSON array of strings, no other text. Example:
["search query 1", "search query 2"]""",

    "deep": """You are a research planning assistant. Given a research question,
decompose it into 5 specific, multi-angle search sub-tasks that together will answer the question
comprehensively from different perspectives (technical, historical, comparative, expert opinions, future outlook).
Return ONLY a JSON array of strings, no other text. Example:
["search query 1", "search query 2", "search query 3", "search query 4", "search query 5"]""",

    "academic": """You are an academic research planning assistant. Given a research question,
decompose it into 4 scholarly search queries focusing on: peer-reviewed papers, methodology,
literature reviews, and empirical findings. Target academic sources like arxiv, nature, ieee, nih.
Return ONLY a JSON array of strings, no other text. Example:
["academic search query 1", "academic search query 2", "academic search query 3", "academic search query 4"]""",

    "news": """You are a news research planning assistant. Given a research question,
decompose it into 3 news-focused search queries targeting: breaking developments,
expert reactions/analysis, and timeline of events.
Return ONLY a JSON array of strings, no other text. Example:
["news search query 1", "news search query 2", "news search query 3"]""",
}


def _parse_plan(text: str) -> list[str]:
    """Parse planner output into a list of query strings, tolerating fences/prose."""
    text = text.strip()

    # Strip markdown code fences if present
    if "```" in text:
        parts = text.split("```")
        text = parts[1] if len(parts) > 1 else parts[0]
        if text.startswith("json"):
            text = text[4:]

    try:
        plan = json.loads(text.strip())
    except json.JSONDecodeError:
        # Fallback: extract the first JSON array embedded in the text
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if not match:
            raise ValueError(f"Planner returned non-JSON output: {text[:200]}")
        plan = json.loads(match.group())

    return [str(t).strip() for t in plan if str(t).strip()]


async def planner_node(state: AgentState) -> dict:
    mode = state.get("mode", "quick")
    system_prompt = MODE_PROMPTS.get(mode, MODE_PROMPTS["quick"])

    print(f"[Planner] Planning research for: {state['query']} (mode={mode})")

    response = await client.chat.completions.create(
        model=MODEL_FAST,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Research question: {state['query']}"}
        ],
        # Reasoning models spend internal thinking tokens first — give headroom
        reasoning_effort="low",
        max_tokens=2000,
    )

    text = response.choices[0].message.content
    plan = _parse_plan(text)
    print(f"[Planner] Created {len(plan)} sub-tasks: {plan}")

    return {
        "plan": plan,
        "status": "planned",
        "iterations": 0,
        "tokens": response.usage.total_tokens if response.usage else 0,
    }

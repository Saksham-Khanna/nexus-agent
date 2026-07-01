import json
from groq import Groq
from agent.state import AgentState

client = Groq()

SYSTEM = """You are a research planning assistant. Given a research question, 
decompose it into 3-5 specific search sub-tasks that together will answer the question comprehensively.
Return ONLY a JSON array of strings, no other text. Example:
["search query 1", "search query 2", "search query 3"]"""


def planner_node(state: AgentState) -> dict:
    print(f"[Planner] Planning research for: {state['query']}")
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": f"Research question: {state['query']}"}
        ],
        max_tokens=1000,
    )
    
    text = response.choices[0].message.content.strip()
    # Strip markdown fences if present
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    
    plan = json.loads(text)
    print(f"[Planner] Created {len(plan)} sub-tasks: {plan}")
    
    return {
        "plan": plan,
        "status": "planned",
        "iterations": 0,
        "tokens": response.usage.total_tokens if response.usage else 0,
    }

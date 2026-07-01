import os
from tavily import TavilyClient
from agent.state import AgentState, SearchResult

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))


def researcher_node(state: AgentState) -> dict:
    plan = state.get("plan", [])
    print(f"[Researcher] Running {len(plan)} searches...")
    
    all_results: list[SearchResult] = []
    
    for task in plan:
        try:
            response = tavily.search(
                query=task,
                max_results=3,
                search_depth="basic",
                include_answer=False,
            )
            for r in response.get("results", []):
                all_results.append(
                    SearchResult(
                        task=task,
                        title=r.get("title", ""),
                        url=r.get("url", ""),
                        snippet=r.get("content", ""),
                        score=r.get("score", 0.0),
                    )
                )
        except Exception as e:
            print(f"[Researcher] Search failed for '{task}': {e}")
    
    # Sort by score descending, cap at 12 total
    all_results.sort(key=lambda x: x["score"], reverse=True)
    all_results = all_results[:12]
    
    print(f"[Researcher] Found {len(all_results)} results")
    return {
        "search_results": all_results,
        "status": "researched",
        "iterations": state.get("iterations", 0) + 1,
    }

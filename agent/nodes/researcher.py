import asyncio
import os

from tavily import AsyncTavilyClient
from agent.state import AgentState, SearchResult
from agent.utils import extract_domain

tavily = AsyncTavilyClient(api_key=os.getenv("TAVILY_API_KEY"))

# Academic domain filters
ACADEMIC_DOMAINS = [
    "arxiv.org", "nature.com", "ieee.org", "nih.gov",
    "pubmed.ncbi.nlm.nih.gov", "scholar.google.com",
    "sciencedirect.com", "springer.com", "wiley.com",
    "acm.org", "researchgate.net",
]

# Mode-specific search config: (search_depth, max_results, result_cap)
MODE_SEARCH_CONFIG = {
    "quick": ("basic", 3, 8),
    "deep": ("advanced", 5, 18),
    "academic": ("advanced", 4, 14),
    "news": ("basic", 4, 12),
}
DEFAULT_CONFIG = ("basic", 3, 12)


async def _search_task(task: str, mode: str, search_depth: str, max_results: int) -> list[SearchResult]:
    search_kwargs = {
        "query": task,
        "max_results": max_results,
        "search_depth": search_depth,
        "include_answer": False,
    }

    # Academic: add domain filter hints to query
    if mode == "academic":
        search_kwargs["query"] = (
            f"{task} site:arxiv.org OR site:nature.com OR site:ieee.org "
            f"OR site:nih.gov OR site:pubmed.ncbi.nlm.nih.gov"
        )

    # News: add topic filter
    if mode == "news":
        search_kwargs["topic"] = "news"
        search_kwargs["days"] = 7

    try:
        response = await tavily.search(**search_kwargs)
    except Exception as e:
        print(f"[Researcher] Search failed for '{task}': {e}")
        return []

    results = []
    for r in response.get("results", []):
        url = r.get("url", "")
        results.append(
            SearchResult(
                task=task,
                title=r.get("title", ""),
                url=url,
                snippet=r.get("content", ""),
                score=r.get("score", 0.0),
                domain=extract_domain(url),
            )
        )
    return results


async def researcher_node(state: AgentState) -> dict:
    plan = state.get("plan", [])
    mode = state.get("mode", "quick")
    print(f"[Researcher] Running {len(plan)} searches in parallel (mode={mode})...")

    search_depth, max_results, result_cap = MODE_SEARCH_CONFIG.get(mode, DEFAULT_CONFIG)

    batches = await asyncio.gather(
        *[_search_task(task, mode, search_depth, max_results) for task in plan]
    )
    all_results: list[SearchResult] = [r for batch in batches for r in batch]

    # Sort by score descending and cap per mode
    all_results.sort(key=lambda x: x["score"], reverse=True)
    all_results = all_results[:result_cap]

    print(f"[Researcher] Found {len(all_results)} results")
    return {
        "search_results": all_results,
        "status": "researched",
        "iterations": state.get("iterations", 0) + 1,
    }

from typing import TypedDict, Annotated
import operator


class SearchResult(TypedDict):
    task: str
    title: str
    url: str
    snippet: str
    score: float


class ScrapedDoc(TypedDict):
    url: str
    title: str
    content: str
    success: bool


class Summary(TypedDict):
    url: str
    title: str
    summary: str


class AgentState(TypedDict):
    query: str
    plan: list[str]
    search_results: Annotated[list[SearchResult], operator.add]
    scraped_docs: Annotated[list[ScrapedDoc], operator.add]
    summaries: Annotated[list[Summary], operator.add]
    report: str
    iterations: int
    status: str
    reflection: str
    tokens: Annotated[int, operator.add]

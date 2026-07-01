import asyncio
import httpx
from bs4 import BeautifulSoup
from agent.state import AgentState, ScrapedDoc
from rank_bm25 import BM25Okapi

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; ResearchAgent/1.0)",
    "Accept": "text/html,application/xhtml+xml",
}
MAX_CHARS = 4000
TIMEOUT = 8.0

def _extract_text(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
        tag.decompose()
    main = soup.find("main") or soup.find("article") or soup.body
    if not main:
        return ""
    text = main.get_text(separator="\n", strip=True)
    return text

def _bm25_retrieve(query: str, text: str, top_k: int = 5) -> str:
    # Split text into chunks (e.g. paragraphs)
    paragraphs = [p.strip() for p in text.split("\n") if len(p.strip()) > 30]
    if not paragraphs:
        return ""
    
    tokenized_corpus = [p.lower().split() for p in paragraphs]
    tokenized_query = query.lower().split()
    
    try:
        bm25 = BM25Okapi(tokenized_corpus)
        top_chunks = bm25.get_top_n(tokenized_query, paragraphs, n=top_k)
        return "\n\n".join(top_chunks)[:MAX_CHARS]
    except Exception as e:
        print(f"[Scraper] BM25 error: {e}")
        return "\n\n".join(paragraphs)[:MAX_CHARS]

async def _scrape_url(client, url: str, r: dict, query: str) -> ScrapedDoc:
    try:
        resp = await client.get(url)
        resp.raise_for_status()
        raw_content = _extract_text(resp.text)
        if len(raw_content) < 100:
            raise ValueError("Too little content extracted")
        
        # Apply BM25 RAG
        content = _bm25_retrieve(query, raw_content, top_k=7)
        
        return ScrapedDoc(url=url, title=r["title"], content=content, success=True)
    except Exception as e:
        print(f"[Scraper] Failed {url}: {e} — using snippet fallback")
        return ScrapedDoc(
            url=url,
            title=r["title"],
            content=r["snippet"],
            success=False,
        )

async def scraper_node(state: AgentState) -> dict:
    results = state.get("search_results", [])
    query = state.get("query", "")
    seen_urls: set[str] = set()
    unique_results = []
    
    for r in results:
        if r["url"] not in seen_urls:
            seen_urls.add(r["url"])
            unique_results.append(r)

    print(f"[Scraper] Scraping {len(unique_results)} URLs in parallel...")

    async with httpx.AsyncClient(timeout=TIMEOUT, headers=HEADERS, follow_redirects=True) as client:
        tasks = [_scrape_url(client, r["url"], r, query) for r in unique_results]
        docs = await asyncio.gather(*tasks)

    docs = list(docs)
    print(f"[Scraper] Scraped {len(docs)} docs ({sum(1 for d in docs if d['success'])} successful)")
    return {"scraped_docs": docs, "status": "scraped"}

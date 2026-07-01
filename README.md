# ResearchAgent

A multi-agent AI research assistant built with **LangGraph** and **Claude**. 
Give it a research question — it autonomously plans, searches, scrapes, summarizes, 
reflects, and writes a comprehensive report.

## Architecture

```
User query → Planner → Researcher → Scraper → Summarizer → Reflector ⟲ → Writer → Report
                                                                ↑____________| (if incomplete, max 3×)
```

**Nodes:**
- **Planner** — Claude breaks the query into 3–5 search sub-tasks
- **Researcher** — Tavily API searches for each sub-task (top 3 results each)
- **Scraper** — httpx + BeautifulSoup extracts full text from each URL
- **Summarizer** — Claude summarizes each document into key findings
- **Reflector** — Claude evaluates whether research is complete; loops back if not
- **Writer** — Claude synthesizes all summaries into a structured markdown report

## Setup

### 1. Get API keys
- **Anthropic**: https://console.anthropic.com → API Keys
- **Tavily**: https://tavily.com → free tier (1000 searches/month)

### 2. Install Python dependencies
```bash
cd research-agent
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Set environment variables
```bash
cp .env.example .env
# Edit .env and add your keys
```

`.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
TAVILY_API_KEY=tvly-...
```

### 4. Run the backend
```bash
python -m api.main
# → FastAPI running at http://localhost:8000
```

### 5. Run the frontend
```bash
cd frontend
npm install
npm run dev
# → React app at http://localhost:5173
```

### 6. Use it
Open http://localhost:5173, type a research question, click "Run research agent →".
Watch each agent node activate in real time. The final report appears on the right.

## Running from terminal (no UI)
```python
from dotenv import load_dotenv
load_dotenv()

from agent.graph import agent
from agent.state import AgentState

state = AgentState(
    query="What are the latest breakthroughs in protein folding AI?",
    plan=[], search_results=[], scraped_docs=[],
    summaries=[], report="", iterations=0,
    status="starting", reflection="",
)

result = agent.invoke(state)
print(result["report"])
```

## Deployment

**Backend (Railway)**:
1. Push to GitHub
2. New project on railway.app → Deploy from GitHub
3. Set env vars: `ANTHROPIC_API_KEY`, `TAVILY_API_KEY`
4. Start command: `python -m api.main`

**Frontend (Vercel)**:
1. Set `VITE_API_URL` env var to your Railway backend URL
2. Deploy frontend folder to Vercel

## File Structure

```
research-agent/
├── agent/
│   ├── nodes/
│   │   ├── planner.py      # Claude decomposes query
│   │   ├── researcher.py   # Tavily search
│   │   ├── scraper.py      # Web scraping
│   │   ├── summarizer.py   # Claude per-doc summary
│   │   ├── reflector.py    # Loop or proceed?
│   │   └── writer.py       # Final report
│   ├── graph.py            # LangGraph StateGraph
│   └── state.py            # AgentState TypedDict
├── api/
│   └── main.py             # FastAPI + SSE streaming
├── frontend/
│   └── src/
│       ├── App.jsx         # Main UI
│       └── main.jsx        # Entry point
├── requirements.txt
└── README.md
```

## Extending this project
- **Add memory**: Use LangGraph's `MemorySaver` checkpointer + thread IDs for persistent sessions
- **Add parallel search**: Use `Send()` API in LangGraph to fan-out researcher nodes per sub-task
- **Add PDF support**: Use `pypdf` to scrape and summarize PDFs from search results  
- **Add citations**: Track source URLs per claim in the writer prompt
- **Add evaluation**: Score the final report quality with a separate evaluator node

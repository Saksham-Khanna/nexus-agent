import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Menu, Clock, Download, Share2, Search, X } from "lucide-react";
import html2pdf from "html2pdf.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── Node metadata ── */
const NODE_META = {
  planner:    { icon: "🗂️", label: "Planner",    desc: "Breaking down the research query" },
  researcher: { icon: "🔍", label: "Researcher", desc: "Searching the web for sources" },
  scraper:    { icon: "📄", label: "Scraper",    desc: "Extracting content from pages" },
  summarizer: { icon: "✍️", label: "Summarizer", desc: "Distilling key information" },
  reflector:  { icon: "🤔", label: "Reflector",  desc: "Evaluating research quality" },
  writer:     { icon: "📝", label: "Writer",     desc: "Composing the final report" },
};

const NODE_ORDER = ["planner", "researcher", "scraper", "summarizer", "reflector", "writer"];
const EXAMPLE_QUERIES = [
  "Latest breakthroughs in quantum computing",
  "How does CRISPR gene editing work?",
  "Impact of AI on healthcare in 2025",
  "History of space exploration milestones",
];

/* ── Web Audio Synth Sounds ── */
const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === "pop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "success") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.1); // C#
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.2); // E
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    }
  } catch(e) {}
};

/* ══════════════════════════════════════════════
   Components
   ══════════════════════════════════════════════ */
function BackgroundOrbs() {
  return (
    <>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </>
  );
}

function Navbar({ running, toggleSidebar, toggleTheme, isDark }) {
  const [scrolled, setScrolled] = useState(false);
  const [themeKey, setThemeKey] = useState(0);

  useEffect(() => {
    const container = document.querySelector('.main-content');
    if (!container) return;
    const onScroll = () => setScrolled(container.scrollTop > 12);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  const handleThemeToggle = () => {
    setThemeKey(k => k + 1);
    toggleTheme();
  };

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-brand">
        <button className="navbar-icon-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu size={18} />
        </button>
        <div className="navbar-logo" style={{ marginLeft: 4 }}>🔬</div>
        <div>
          <div className="navbar-title">NEXUS Research</div>
          <div className="navbar-tagline">AI-Powered Research</div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className={`navbar-status-pill${running ? ' running' : ''}`}>
          <div className="navbar-status-dot" />
          {running ? "Agent running…" : "Ready"}
        </div>
        <button className="navbar-icon-btn" onClick={handleThemeToggle} aria-label="Toggle theme">
          <span className="theme-icon rotate-in" key={themeKey}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </span>
        </button>
      </div>
    </nav>
  );
}

function Hero({ query, setQuery, onSubmit, running }) {
  return (
    <motion.div 
      className="hero"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="hero-badge">
        <span className="hero-badge-dot" />
        Multi-agent AI Research Assistant
      </div>
      <h1 className="hero-title">Research anything,<br />instantly.</h1>
      <p className="hero-desc">
        Ask a question and our AI agents will search the web, analyze sources,
        and generate a comprehensive research report — all in real time.
      </p>
      <SearchBox query={query} setQuery={setQuery} onSubmit={onSubmit} running={running} />
      <div className="chips-container">
        {EXAMPLE_QUERIES.map((q) => (
          <button key={q} className="chip" onClick={() => { setQuery(q); }}>{q}</button>
        ))}
      </div>
    </motion.div>
  );
}

function SearchBox({ query, setQuery, onSubmit, running, compact }) {
  return (
    <div className="search-container" style={compact ? { maxWidth: '100%' } : {}}>
      <div className="search-box-wrapper" style={{ position: 'relative', width: '100%' }}>
        <textarea
          className="search-box"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onSubmit(); }}
          placeholder="What would you like to research?"
          rows={compact ? 2 : 3}
          disabled={running}
        />
        <button
          className={`search-submit ${running ? 'running' : ''}`}
          onClick={onSubmit}
          disabled={running || !query.trim()}
        >
          {running ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="spinner">⟳</span> Running…
            </span>
          ) : (
            "Research →"
          )}
        </button>
      </div>
      {!compact && <span className="search-hint">Press Ctrl + Enter to run</span>}
    </div>
  );
}

function TimelineNode({ name, status, output }) {
  const meta = NODE_META[name] || { icon: "⚙️", label: name, desc: "" };
  const stateClass = status === "running" ? "active" : status === "done" ? "done" : status === "error" ? "error" : "";

  return (
    <div className={`timeline-node ${stateClass}`}>
      <div className="timeline-dot">
        {status === "running" ? <span className="spinner">⟳</span> : meta.icon}
      </div>
      <div className="timeline-body">
        <div className="timeline-header">
          <span className="timeline-label">{meta.label}</span>
          <span className={`timeline-status-badge ${status || 'idle'}`}>{status || "waiting"}</span>
        </div>
        <div className="timeline-desc">{meta.desc}</div>
        {output && <NodeOutput name={name} output={output} />}
      </div>
    </div>
  );
}

function NodeOutput({ name, output }) {
  if (name === "planner" && output.plan) return <div className="timeline-output">{output.plan.map((t, i) => <div key={i} className="sub-task"><span className="sub-task-dot">→</span><span>{t}</span></div>)}</div>;
  if (name === "researcher" && output.titles) return <div className="timeline-output">Found {output.count} results — {output.titles.slice(0, 2).join(", ")}</div>;
  if (name === "scraper") return <div className="timeline-output">Scraped {output.count} pages ({output.success} fully extracted)</div>;
  if (name === "summarizer") return <div className="timeline-output">Generated {output.count} summaries</div>;
  if (name === "reflector") return <div className="timeline-output"><div className="reflection">{output.reflection}</div></div>;
  return null;
}

function MarkdownReport({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("# ")) elements.push(<h1 key={i}>{line.slice(2)}</h1>);
    else if (line.startsWith("## ")) elements.push(<h2 key={i}>{line.slice(3)}</h2>);
    else if (line.startsWith("### ")) elements.push(<h3 key={i}>{line.slice(4)}</h3>);
    else if (line.startsWith("- ") || line.startsWith("* ")) elements.push(<li key={i}>{renderInline(line.slice(2))}</li>);
    else if (line.trim() !== "") elements.push(<p key={i}>{renderInline(line)}</p>);
    i++;
  }
  return <div className="report-content" id="report-pdf-content">{elements}</div>;
}

function renderInline(text) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) return <span key={i} className="citation">{match[1]}</span>;
    return part;
  });
}

function SkeletonLoader() {
  const widths = ['100%', '92%', '85%', '96%', '70%', '100%', '88%', '60%'];
  return (
    <div className="skeleton">
      <div className="skeleton-line" style={{ width: '45%', height: 24, marginBottom: 8 }} />
      {widths.map((w, i) => (
        <div key={i} className="skeleton-line" style={{ width: w, animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

function ReportPanel({ report, running, hasWriter, rateLimit }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("report-pdf-content");
    if (!element) return;
    const opt = {
      margin: 1,
      filename: 'nexus-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (report) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="report-header">
          <div style={{display:'flex', flexDirection:'column'}}>
            <span className="report-title">📋 Research Report</span>
            {rateLimit && <span style={{fontSize:10, color:'var(--status-running)', marginTop:4}}>API: {rateLimit.tokens} tokens used</span>}
          </div>
          <div className="report-actions">
            <button className={`report-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
              {copied ? '✓ Copied' : '⧉ Copy'}
            </button>
            <button className="report-btn" onClick={handleDownloadPDF}>
              <Download size={14} /> PDF
            </button>
          </div>
        </div>
        <MarkdownReport text={report} />
      </motion.div>
    );
  }

  if (running && hasWriter) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="report-header"><span className="report-title">📋 Research Report</span></div>
        <SkeletonLoader />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, color: 'var(--text-muted)', fontSize: 13 }}>
          <div className="typing-dots"><span /><span /><span /></div> Writing report…
        </div>
      </motion.div>
    );
  }

  return (
    <div className="report-placeholder">
      <div className="report-placeholder-icon">📝</div>
      <div className="report-placeholder-text">
        {running ? "Report will appear when the writer finishes…" : "Your research report will appear here"}
      </div>
      {running && <div className="typing-dots" style={{ marginTop: 4 }}><span /><span /><span /></div>}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Main App
   ══════════════════════════════════════════════ */
import Landing from "./Landing";

export default function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [nodes, setNodes] = useState({});
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [rateLimit, setRateLimit] = useState(null);
  
  // Theme & Layout state
  const [isDark, setIsDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("research_history") || "[]"));

  useEffect(() => {
    document.body.className = isDark ? "dark" : "light";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const updateNode = useCallback((name, patch) => {
    setNodes((prev) => {
      const isDone = patch.status === "done" && prev[name]?.status !== "done";
      if (isDone) playSound("pop");
      return { ...prev, [name]: { ...(prev[name] || { status: "idle" }), ...patch } };
    });
  }, []);

  const saveToHistory = useCallback((q, r) => {
    setHistory(prev => {
      const newItem = { id: Date.now(), query: q, report: r, date: new Date().toLocaleDateString() };
      const newHist = [newItem, ...prev].slice(0, 20); // Keep last 20
      localStorage.setItem("research_history", JSON.stringify(newHist));
      return newHist;
    });
  }, []);

  const runAgent = useCallback(async () => {
    if (!query.trim() || running) return;
    setRunning(true);
    setReport("");
    setError("");
    setNodes({});
    setRateLimit(null);
    let finalReport = "";

    try {
      const resp = await fetch(`${API_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const chunk of lines) {
          if (!chunk.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(chunk.slice(6));
            if (ev.type === "node_start") updateNode(ev.node, { status: "running" });
            else if (ev.type === "node_done") updateNode(ev.node, { status: "done" });
            else if (ev.type === "writer_token") {
              // Append live token to the report state
              setReport((prev) => prev + ev.content);
              finalReport += ev.content;
            }
            else if (ev.type === "node_output") {
              updateNode(ev.node, { output: ev.output });
            } 
            else if (ev.type === "rate_limit") setRateLimit(ev.info);
            else if (ev.type === "error") setError(ev.message);
          } catch {}
        }
      }
      if (finalReport) {
        playSound("success");
        saveToHistory(query, finalReport);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }, [query, running, updateNode, saveToHistory]);

  const loadHistory = (item) => {
    setQuery(item.query);
    setReport(item.report);
    setNodes(NODE_ORDER.reduce((acc, n) => ({ ...acc, [n]: { status: "done" } }), {}));
    setSidebarOpen(false);
  };

  const hasStarted = Object.keys(nodes).length > 0;
  const doneCount = NODE_ORDER.filter((n) => nodes[n]?.status === "done").length;
  const progressPct = hasStarted ? Math.round((doneCount / NODE_ORDER.length) * 100) : 0;
  const hasWriter = nodes.writer?.status === "running" || nodes.writer?.status === "done";

  if (currentView === "landing") {
    return <Landing onLaunch={() => setCurrentView("research")} />;
  }

  return (
    <div className="app-layout">
      <BackgroundOrbs />
      
      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="sidebar"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
          >
            <div className="sidebar-header">
              <span style={{fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:8}}><Clock size={16}/> History</span>
              <button onClick={() => setSidebarOpen(false)} style={{background:'none',border:'none',color:'inherit',cursor:'pointer'}}><X size={16}/></button>
            </div>
            <div className="sidebar-content">
              {history.length === 0 ? (
                <div style={{color:'var(--text-muted)', fontSize:12, textAlign:'center', marginTop:20}}>No past research yet</div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="history-item" onClick={() => loadHistory(item)}>
                    <div className="history-item-title">{item.query}</div>
                    <div className="history-item-date">{item.date}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="main-content">
        <Navbar 
          running={running} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
          toggleTheme={() => setIsDark(!isDark)} 
          isDark={isDark} 
        />

        <AnimatePresence mode="wait">
          {!hasStarted ? (
            <Hero key="hero" query={query} setQuery={setQuery} onSubmit={runAgent} running={running} />
          ) : (
            <motion.div 
              key="bento"
              className="main-container"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bento-grid">
                <div className="glass-card glass-card-3d bento-cell bento-search">
                  <SearchBox query={query} setQuery={setQuery} onSubmit={runAgent} running={running} compact />
                  {error && <div className="error-banner"><span>⚠</span> {error}</div>}
                </div>

                <div className="glass-card glass-card-3d bento-cell bento-timeline">
                  <div className="progress-label">Agent Progress — {running ? `Step ${Math.min(doneCount + 1, 6)} of 6` : `Complete`}</div>
                  <div className="progress-bar-container"><div className="progress-bar-fill" style={{ width: `${progressPct}%` }} /></div>
                  <div className="timeline">
                    {NODE_ORDER.map((name) => (
                      <TimelineNode key={name} name={name} status={nodes[name]?.status || "idle"} output={nodes[name]?.output} />
                    ))}
                  </div>
                </div>

                <div className="glass-card bento-cell bento-report" style={{ minHeight: 500 }}>
                  <ReportPanel report={report} running={running} hasWriter={hasWriter} rateLimit={rateLimit} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

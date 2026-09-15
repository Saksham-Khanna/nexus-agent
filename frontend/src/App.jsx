import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PanelRightOpen } from "lucide-react";
import Landing from "./Landing";
import { API_URL, NODE_ORDER } from "./constants";
import { safeParse } from "./utils";
import Topbar from "./components/Topbar";
import LeftCards from "./components/LeftCards";
import SidebarAgents from "./components/SidebarAgents";
import CenterIdle from "./components/CenterIdle";
import CenterResearch from "./components/CenterResearch";
import SourceDrawer from "./components/SourceDrawer";
import ReportsView from "./components/ReportsView";
import SourcesView from "./components/SourcesView";

/* ══════════════════════════════════════════════
   Main App
   ══════════════════════════════════════════════ */
const getInitialView = () => {
  if (typeof window === "undefined") return "landing";
  const path = window.location.pathname.toLowerCase();
  if (path === "/research" || path.startsWith("/research/")) {
    return "research";
  }
  return "landing";
};

export default function App() {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const [nodes, setNodes] = useState({});
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [rateLimit, setRateLimit] = useState(null);
  const [history, setHistory] = useState(() => safeParse("research_history", []));
  const [researchMode, setResearchMode] = useState("quick");
  const [rightPanelOpen, setRightPanelOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth > 1024 : true);
  const [currentView, setCurrentView] = useState(getInitialView);
  const [viewTransition, setViewTransition] = useState("none");
  const [centerView, setCenterView] = useState("idle");
  const [savedSources, setSavedSources] = useState(() => safeParse("saved_sources", []));
  const [researchSources, setResearchSources] = useState([]);
  const [sourceDrawerIndex, setSourceDrawerIndex] = useState(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === "/research" || path.startsWith("/research/")) {
        setCurrentView("research");
      } else {
        setCurrentView("landing");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Auto-collapse right panel when resizing to mobile
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth <= 1024) setRightPanelOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const updateNode = useCallback((name, patch) => {
    setNodes((prev) => ({ ...prev, [name]: { ...(prev[name] || { status: "idle" }), ...patch } }));
  }, []);

  const saveToHistory = useCallback((q, r, sources) => {
    setHistory(prev => {
      const item = { id: Date.now(), query: q, report: r, date: new Date().toLocaleDateString(), sources: sources || [] };
      const h = [item, ...prev].slice(0, 20);
      localStorage.setItem("research_history", JSON.stringify(h));
      return h;
    });
  }, []);

  const runAgent = useCallback(async (overrideQuery) => {
    const q = (overrideQuery || query).trim();
    if (!q || running) return;
    setRunning(true);
    setReport("");
    setError("");
    setNodes({});
    setRateLimit(null);
    let finalReport = "";
    let capturedSources = [];
    try {
      setResearchSources([]);
      setSourceDrawerIndex(null);
      const resp = await fetch(`${API_URL}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, mode: researchMode }),
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
            else if (ev.type === "writer_token") { setReport(p => p + ev.content); finalReport += ev.content; }
            else if (ev.type === "node_output") {
              updateNode(ev.node, { output: ev.output });
              if (ev.node === "researcher" && ev.output?.sources) {
                capturedSources = ev.output.sources;
                setResearchSources(ev.output.sources);
              }
              if (ev.node === "summarizer" && ev.output?.sources) {
                const enriched = ev.output.sources.map(s => {
                  const existing = capturedSources.find(cs => cs.url === s.url);
                  return { ...s, score: existing?.score || 0, snippet: existing?.snippet || '', domain: s.domain || existing?.domain || '' };
                });
                setResearchSources(enriched);
                capturedSources = enriched;
              }
            }
            else if (ev.type === "sources_complete") {
              const finalSources = ev.sources.map(s => {
                const existing = capturedSources.find(cs => cs.url === s.url);
                return { ...s, score: existing?.score || 0, snippet: existing?.snippet || '', domain: s.domain || existing?.domain || '' };
              });
              setResearchSources(finalSources);
              capturedSources = finalSources;
            }
            else if (ev.type === "rate_limit") setRateLimit(ev.info);
            else if (ev.type === "error") setError(ev.message);
          } catch {}
        }
      }
      if (finalReport) saveToHistory(q, finalReport, capturedSources);
    } catch (e) { setError(e.message); }
    finally { setRunning(false); }
  }, [query, running, researchMode, updateNode, saveToHistory]);

  const loadHistory = (item) => {
    setCenterView("idle");
    setQuery(item.query);
    setReport(item.report);
    setNodes(NODE_ORDER.reduce((acc, n) => ({ ...acc, [n]: { status: "done" } }), {}));
  };

  const handleNewResearch = () => {
    setCenterView("idle");
    setQuery("");
    setReport("");
    setNodes({});
    setError("");
    setRateLimit(null);
  };

  const deleteHistoryItem = (id) => {
    setHistory(prev => {
      const h = prev.filter(item => item.id !== id);
      localStorage.setItem("research_history", JSON.stringify(h));
      return h;
    });
  };

  const deleteSavedSource = (idx) => {
    setSavedSources(prev => {
      const s = prev.filter((_, i) => i !== idx);
      localStorage.setItem("saved_sources", JSON.stringify(s));
      return s;
    });
  };

  const toggleSaveSource = (source) => {
    setSavedSources(prev => {
      const exists = prev.some(s => s.url === source.url);
      let updated;
      if (exists) {
        updated = prev.filter(s => s.url !== source.url);
      } else {
        updated = [...prev, { ...source, query: query }];
      }
      localStorage.setItem("saved_sources", JSON.stringify(updated));
      return updated;
    });
  };

  const openSourceDrawer = (citationIndex) => {
    if (researchSources.length > 0) {
      setSourceDrawerIndex(citationIndex);
    }
  };

  const saveAllSources = () => {
    const sources = history.flatMap(item =>
      (item.sources || []).map(s => ({ ...s, query: item.query }))
    );
    const unique = sources.filter((s, i, arr) => arr.findIndex(x => x.title === s.title) === i);
    setSavedSources(unique);
    localStorage.setItem("saved_sources", JSON.stringify(unique));
  };

  const handleTrendingClick = (topic) => {
    setQuery(topic);
    runAgent(topic);
  };

  const handleHome = () => {
    if (window.location.pathname !== "/" && window.location.pathname !== "/home") {
      window.history.pushState(null, "", "/");
    }
    setCurrentView("landing");
    setQuery("");
    setReport("");
    setNodes({});
    setError("");
    setRateLimit(null);
  };

  const handleFooterNav = (sectionId, e) => {
    if (e) e.preventDefault();
    if (window.location.pathname !== "/" && window.location.pathname !== "/home") {
      window.history.pushState(null, "", "/" + (sectionId ? `#${sectionId}` : ""));
    }
    setCurrentView("landing");
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const hasStarted = Object.keys(nodes).length > 0;

  if (currentView === "landing") {
    return (
      <div className={viewTransition === 'landing-exit' ? 'view-exit' : ''}>
        <Landing onLaunch={() => {
          if (window.location.pathname !== "/research") {
            window.history.pushState(null, "", "/research");
          }
          setViewTransition("landing-exit");
          setTimeout(() => {
            setCurrentView("research");
            setViewTransition("research-enter");
            setTimeout(() => setViewTransition("none"), 600);
          }, 600);
        }} />
      </div>
    );
  }

  return (
    <div className={`app-layout${viewTransition === 'research-enter' ? ' view-enter' : ''}`}>
      <Topbar
        running={running}
        onHome={handleHome}
        onNavClick={handleFooterNav}
        activeView={centerView}
        onNewResearch={handleNewResearch}
        onMyReports={() => { saveAllSources(); setCenterView("reports"); }}
        onSavedSources={() => { saveAllSources(); setCenterView("sources"); }}
      />

      <div className={`app-body-layout${rightPanelOpen ? '' : ' right-collapsed'}`}>
        <LeftCards
          activeView={centerView}
          onNewResearch={handleNewResearch}
          onMyReports={() => { saveAllSources(); setCenterView("reports"); }}
          onSavedSources={() => { saveAllSources(); setCenterView("sources"); }}
        />

        <div className="center-column">
          <div className="center-scroll">
            <div className="center-content-wrapper">
              <AnimatePresence mode="wait">
                {centerView === "reports" ? (
                  <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                    <ReportsView history={history} onSelect={loadHistory} onDelete={deleteHistoryItem} />
                  </motion.div>
                ) : centerView === "sources" ? (
                  <motion.div key="sources" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ width: '100%' }}>
                    <SourcesView savedSources={savedSources} onDelete={deleteSavedSource} />
                  </motion.div>
                ) : !hasStarted ? (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CenterIdle
                      query={query} setQuery={setQuery} onSubmit={runAgent} running={running}
                      onTrendingClick={handleTrendingClick}
                      researchMode={researchMode} setResearchMode={setResearchMode}
                    />
                  </motion.div>
                ) : (
                  <motion.div key="research" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CenterResearch
                      query={query} setQuery={setQuery} onSubmit={runAgent} running={running}
                      error={error} nodes={nodes} report={report} rateLimit={rateLimit}
                      onCitationClick={openSourceDrawer}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="landing-footer">
              <div className="footer-inner">
                <div className="footer-grid">
                  <div className="footer-brand">
                    <span className="footer-brand-name">NEXUS</span>
                    <span className="footer-brand-tagline">AI-Powered Research Platform</span>
                  </div>
                  <div className="footer-col">
                    <span className="footer-col-title">Product</span>
                    <a href="/" onClick={(e) => { e.preventDefault(); handleHome(); }}>Home</a>
                    <a href="/#features" onClick={(e) => handleFooterNav('features', e)}>Features</a>
                    <a href="/#how-it-works" onClick={(e) => handleFooterNav('how-it-works', e)}>How It Works</a>
                    <a href="/#faq" onClick={(e) => handleFooterNav('faq', e)}>FAQ</a>
                  </div>
                  <div className="footer-col">
                    <span className="footer-col-title">Connect</span>
                    <a href="mailto:khanna.saksham2918@gmail.com">Email</a>
                    <a href="https://www.linkedin.com/in/sakshamm-khanna29/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    <a href="https://github.com/Saksham-Khanna/nexus-agent" target="_blank" rel="noopener noreferrer">GitHub</a>
                  </div>
                </div>
                <div className="footer-bottom">
                  <span className="footer-copy">© {new Date().getFullYear()} NEXUS Research. Built with multi-agent AI.</span>
                  <span className="footer-status">
                    <span className="footer-status-dot" />
                    All systems operational
                  </span>
                </div>
              </div>
            </footer>
          </div>
        </div>

        {rightPanelOpen && <div className="sidebar-overlay" onClick={() => setRightPanelOpen(false)} />}
        <SidebarAgents nodes={nodes} history={history} collapsed={!rightPanelOpen} onClose={() => setRightPanelOpen(false)} onViewAll={() => setRightPanelOpen(true)} />
        {!rightPanelOpen && (
          <button className="right-panel-reopen" aria-label="Open panel" onClick={() => setRightPanelOpen(true)}>
            <PanelRightOpen size={16} />
          </button>
        )}
      </div>

      {sourceDrawerIndex !== null && researchSources.length > 0 && (
        <SourceDrawer
          sources={researchSources}
          activeIndex={sourceDrawerIndex}
          onClose={() => setSourceDrawerIndex(null)}
          onNavigate={(idx) => setSourceDrawerIndex(idx)}
          savedSources={savedSources}
          onToggleSave={toggleSaveSource}
        />
      )}
    </div>
  );
}

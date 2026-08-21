import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Settings, Download, X, PanelRightOpen, FileText, Bookmark, Search, Trash2, ExternalLink, ChevronLeft, ChevronRight, Globe, Star, BookmarkPlus, BookmarkCheck } from "lucide-react";
import html2pdf from "html2pdf.js";
import Landing from "./Landing";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const NODE_META = {
  planner:    { icon: "🗂️",  label: "Web Searcher",   desc: "Searches the web for relevant sources",        color: "blue"   },
  researcher: { icon: "📄",  label: "Source Analyst",  desc: "Reads and extracts key information",          color: "purple" },
  scraper:    { icon: "🛡️",  label: "Fact Checker",    desc: "Verifies facts and checks credibility",       color: "green"  },
  summarizer: { icon: "🔷",  label: "Synthesizer",     desc: "Combines insights across sources",            color: "orange" },
  reflector:  { icon: "✏️",  label: "Report Writer",   desc: "Generates structured research report",        color: "teal"   },
  writer:     { icon: "⭐",  label: "Critic",           desc: "Reviews and improves the final report",       color: "yellow" },
};

const NODE_ORDER = ["planner", "researcher", "scraper", "summarizer", "reflector", "writer"];

const RESEARCH_MODES = [
  { id: "quick",    label: "Quick",    icon: "⚡" },
  { id: "deep",     label: "Deep",     icon: "🔍" },
  { id: "academic", label: "Academic", icon: "🎓" },
  { id: "news",     label: "News",     icon: "🌐" },
];

const TRENDING_TOPICS = [
  "Quantum Computing",
  "AI Agents",
  "CRISPR",
  "Space Tech",
  "Robotics",
  "Cybersecurity",
  "Fusion Energy",
  "Web3",
];

const WORKFLOW_STEPS = [
  { label: "ASK",        icon: "💬", color: "#C0848E" },
  { label: "SEARCH",     icon: "🔍", color: "#61C08B" },
  { label: "ANALYZE",    icon: "📊", color: "#F0B36A" },
  { label: "VERIFY",     icon: "🛡️", color: "#5B9BD5" },
  { label: "SYNTHESIZE", icon: "🔷", color: "#A47BC4" },
  { label: "REPORT",     icon: "📄", color: "#D58B78" },
];

const ICON_COLORS = ["pink", "green", "orange", "blue", "purple", "pink"];

/* ══════════════════════════════════════════════
   Components
   ══════════════════════════════════════════════ */

function SidebarHistory({ history, onSelect, collapsed, onViewAll }) {
  const getSourceCount = (report) => {
    if (!report) return 0;
    return new Set((report.match(/\[\d+\]/g) || [])).size;
  };

  return (
    <aside className={`panel-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-header-icon">🕐</span>
          <span className="panel-header-title">Recent Research</span>
        </div>
        <button className="panel-header-action" title="Refresh" onClick={() => { const h = JSON.parse(localStorage.getItem("research_history") || "[]"); setHistory(h); }}>↻</button>
      </div>
      <div className="panel-body">
        {history.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <span>No past research yet</span>
            <span className="empty-state-sub">Your queries will appear here</span>
          </div>
        ) : (
          history.slice(0, 5).map((item, idx) => (
            <div
              key={item.id}
              className="recent-item"
              onClick={() => onSelect(item)}
            >
              <div className={`recent-item-icon ${ICON_COLORS[idx % ICON_COLORS.length]}`}>
                {["⚛️", "🧬", "✂️", "🚀", "📚"][idx % 5]}
              </div>
              <div className="recent-item-body">
                <div className="recent-item-title">{item.query}</div>
                <div className="recent-item-meta">
                  {getSourceCount(item.report)} sources · {item.date || "Recently"}
                </div>
              </div>
              <div className="recent-item-arrow">→</div>
            </div>
          ))
        )}
      </div>
      <div className="panel-footer">
        <button className="panel-footer-btn" onClick={onViewAll}>View all research →</button>
      </div>
      <div className="upgrade-panel-sidebar">
        <div className="upgrade-icon">👑</div>
        <div className="upgrade-title">Upgrade to Pro</div>
        <div className="upgrade-desc">
          Unlock deeper research, more sources, and advanced report customization.
        </div>
        <button className="upgrade-btn">Upgrade Now →</button>
      </div>
    </aside>
  );
}

function SidebarAgents({ nodes, history, collapsed, onClose, onViewAll }) {
  return (
    <aside className={`panel-sidebar panel-sidebar-right${collapsed ? ' collapsed' : ''}`}>
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-header-title">AI Agents</span>
        </div>
        <button className="topbar-menu-btn" aria-label="Close panel" onClick={onClose} style={{ marginLeft: 'auto' }}>
          <X size={16} />
        </button>
      </div>
      <div className="panel-body">
        {NODE_ORDER.map((name) => {
          const meta = NODE_META[name];
          const status = nodes[name]?.status || "idle";
          const statusLabel = status === "running" ? "ACTIVE" : status === "done" ? "DONE" : "READY";
          return (
            <div key={name} className={`agent-row ${status}`}>
              <div className={`agent-row-icon ${meta.color}`}>{meta.icon}</div>
              <div className="agent-row-info">
                <div className="agent-row-name">{meta.label}</div>
                <div className="agent-row-desc">{meta.desc}</div>
              </div>
              <div className={`agent-row-status ${status}`}>{statusLabel}</div>
            </div>
          );
        })}
      </div>
      <div className="panel-footer">
        <button className="view-all-agents-btn" onClick={onViewAll}>View all agents →</button>
      </div>
      <StatsPanel history={history} />
    </aside>
  );
}

function StatsPanel({ history }) {
  const reportCount = history.length;
  const sourceCount = history.reduce((sum, item) => {
    if (!item.report) return sum;
    return sum + new Set((item.report.match(/\[\d+\]/g) || [])).size;
  }, 0);
  const timeSaved = (reportCount * 0.4 + (reportCount > 0 ? 0.2 : 0)).toFixed(1);

  return (
    <div className="stats-panel-sidebar">
      <div className="stats-panel-header">
        <span className="stats-panel-title">Today's Research</span>
        <span style={{ fontSize: 13, color: '#C0848E' }}>📊</span>
      </div>
      <div className="stats-row">
        <div className="stat-item">
          <div className="stat-value pink">{reportCount}</div>
          <div className="stat-label">Reports</div>
        </div>
        <div className="stat-item">
          <div className="stat-value green">{sourceCount}</div>
          <div className="stat-label">Sources</div>
        </div>
        <div className="stat-item">
          <div className="stat-value amber">{timeSaved}h</div>
          <div className="stat-label">Saved</div>
        </div>
      </div>
    </div>
  );
}

function LeftCards({ activeView, onNewResearch, onMyReports, onSavedSources }) {
  return (
    <aside className="left-cards-panel">
      <button
        className={`left-nav-card${activeView === 'idle' ? ' active' : ''}`}
        onClick={onNewResearch}
      >
        <div className="left-card-icon pink">
          <Search size={18} />
        </div>
        <div className="left-card-text">
          <div className="left-card-title">New Research</div>
          <div className="left-card-subtitle">Start a new query</div>
        </div>
      </button>

      <button
        className={`left-nav-card${activeView === 'reports' ? ' active' : ''}`}
        onClick={onMyReports}
      >
        <div className="left-card-icon amber">
          <FileText size={18} />
        </div>
        <div className="left-card-text">
          <div className="left-card-title">My Reports</div>
          <div className="left-card-subtitle">View saved reports</div>
        </div>
      </button>

      <button
        className={`left-nav-card${activeView === 'sources' ? ' active' : ''}`}
        onClick={onSavedSources}
      >
        <div className="left-card-icon purple">
          <Bookmark size={18} />
        </div>
        <div className="left-card-text">
          <div className="left-card-title">Saved Sources</div>
          <div className="left-card-subtitle">Your bookmarked sources</div>
        </div>
      </button>
    </aside>
  );
}

const TopbarGitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.6 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.4 5.4 0 0 0-.1-3.7s-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0c-2.7-1.8-3.9-1.4-3.9-1.4a5.4 5.4 0 0 0-.1 3.7 5.5 5.5 0 0 0-1.5 3.8c0 4.9 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/>
  </svg>
);

const TopbarLinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

function Topbar({ running, onHome, onNavClick }) {
  return (
    <nav className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand-text" onClick={onHome} title="Go to home" style={{ cursor: 'pointer', marginLeft: '16px' }}>
          <span className="nav-logo-nexus">NEXUS</span>
          <span className="nav-logo-research">RESEARCH</span>
        </div>
      </div>

      <div className="topbar-center" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        <a href="/#features" onClick={(e) => onNavClick('features', e)} className="nav-link">Features</a>
        <a href="/#how-it-works" onClick={(e) => onNavClick('how-it-works', e)} className="nav-link">How It Works</a>
        <a href="/#faq" onClick={(e) => onNavClick('faq', e)} className="nav-link">FAQ</a>
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {running && (
          <div className="topbar-status running">
            <div className="status-dot" />
            Running
          </div>
        )}
        <a href="https://www.linkedin.com/in/sakshamm-khanna29/" target="_blank" rel="noopener noreferrer" className="github-link" aria-label="LinkedIn" title="LinkedIn">
          <TopbarLinkedInIcon />
        </a>
        <a href="https://github.com/Saksham-Khanna/nexus-agent" target="_blank" rel="noopener noreferrer" className="github-link" aria-label="GitHub" title="GitHub">
          <TopbarGitHubIcon />
        </a>
        <button className="github-link" aria-label="Settings" title="Settings coming soon" onClick={() => alert('Settings coming soon!')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Settings size={20} />
        </button>
      </div>
    </nav>
  );
}

function CenterIdle({ query, setQuery, onSubmit, running, onTrendingClick, researchMode, setResearchMode }) {
  return (
    <>
      <div className="agent-badge">
        <span className="agent-badge-dot" />
        Multi-agent AI Research Assistant
      </div>

      <div className="center-hero">
        <h1 className="center-title">
          Research anything,{' '}
          <span className="title-accent">instantly.</span>
        </h1>
        <p className="center-desc">
          Ask a question and our AI agents will search the web,
          analyze sources, and generate a comprehensive research
          report — all in real time.
        </p>
      </div>

      <div className="center-search">
        <div className="search-wrapper">
          <textarea
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onSubmit(); }}
            placeholder="What would you like to research?"
            rows={2}
            disabled={running}
          />
          <button className="search-btn" onClick={onSubmit} disabled={running || !query.trim()}>
            {running ? (
              <span className="search-btn-inner"><span className="spinner">⟳</span> Running</span>
            ) : (
              <span className="search-btn-inner">Research →</span>
            )}
          </button>
        </div>
      </div>

      <div className="center-section">
        <div className="section-label">Research Mode</div>
        <div className="mode-pills">
          {RESEARCH_MODES.map((mode) => (
            <button
              key={mode.id}
              className={`mode-pill${researchMode === mode.id ? ' active' : ''}`}
              onClick={() => setResearchMode(mode.id)}
            >
              <span>{mode.icon}</span> {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="center-section">
        <div className="trending-section-header">
          <div className="section-label" style={{ marginBottom: 0 }}>Trending Research</div>
          <button className="trending-arrow-btn">→</button>
        </div>
        <div className="trending-row">
          {TRENDING_TOPICS.map((topic) => (
            <button
              key={topic}
              className="trending-chip"
              onClick={() => onTrendingClick(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="workflow-section">
        <div className="workflow-section-title">How NEXUS Thinks</div>
        <div className="workflow-row">
          <div className="workflow-connector-line" />
          {WORKFLOW_STEPS.map((step) => (
            <div key={step.label} className="workflow-item">
              <div className="workflow-node" style={{ borderColor: step.color }}>{step.icon}</div>
              <div className="workflow-label">{step.label}</div>
            </div>
          ))}
        </div>
        <div className="workflow-desc">
          Multiple AI agents working together to deliver accurate, cited, and insightful research.
        </div>
      </div>
    </>
  );
}

function CenterResearch({ query, setQuery, onSubmit, running, error, nodes, report, rateLimit, onCitationClick }) {
  const doneCount = NODE_ORDER.filter((n) => nodes[n]?.status === "done").length;
  const progressPct = Object.keys(nodes).length > 0 ? Math.round((doneCount / NODE_ORDER.length) * 100) : 0;
  const hasWriter = nodes.writer?.status === "running" || nodes.writer?.status === "done";

  return (
    <>
      <div className="center-search" style={{ marginBottom: 12 }}>
        <div className="search-wrapper">
          <textarea
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) onSubmit(); }}
            placeholder="Refine your query..."
            rows={2}
            disabled={running}
          />
          <button className="search-btn" onClick={onSubmit} disabled={running || !query.trim()}>
            {running ? (
              <span className="search-btn-inner"><span className="spinner">⟳</span> Running</span>
            ) : (
              <span className="search-btn-inner">Research →</span>
            )}
          </button>
        </div>
        {error && <div className="error-banner"><span>⚠</span> {error}</div>}
      </div>

      <div className="research-progress" style={{ width: '100%', maxWidth: 760 }}>
        <div className="progress-label">
          Agent Progress — {running ? `Step ${Math.min(doneCount + 1, 6)} of 6` : doneCount === 6 ? 'Complete' : 'Idle'}
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${progressPct}%` }} /></div>
      </div>

      <div className="research-grid">
        <div className="research-timeline">
          {NODE_ORDER.map((name) => {
            const meta = NODE_META[name];
            const status = nodes[name]?.status || "idle";
            const output = nodes[name]?.output;
            return (
              <div key={name} className={`timeline-node ${status}`}>
                <div className="timeline-dot">
                  {status === "running" ? <span className="spinner">⟳</span> : meta.icon}
                </div>
                <div className="timeline-body">
                  <div className="timeline-header">
                    <span className="timeline-label">{meta.label}</span>
                    <span className={`timeline-status-badge ${status}`}>{status}</span>
                  </div>
                  <div className="timeline-desc">{meta.desc}</div>
                  {output && (
                    <div className="timeline-output">
                      {name === "planner" && output.plan && output.plan.map((t, i) => <div key={i} className="sub-task"><span className="sub-task-dot">→</span><span>{t}</span></div>)}
                      {name === "researcher" && output.titles && <span>Found {output.count} results</span>}
                      {name === "scraper" && <span>Scraped {output.count} pages ({output.success} extracted)</span>}
                      {name === "summarizer" && <span>Generated {output.count} summaries</span>}
                      {name === "reflector" && output.reflection && <div className="reflection">{output.reflection}</div>}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="research-report">
          <ReportPanel report={report} running={running} hasWriter={hasWriter} rateLimit={rateLimit} onCitationClick={onCitationClick} />
        </div>
      </div>
    </>
  );
}

function ReportPanel({ report, running, hasWriter, rateLimit, onCitationClick }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    const el = document.getElementById("report-pdf-content");
    if (!el) return;
    html2pdf().set({
      margin: 1, filename: 'nexus-report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }).from(el).save();
  };

  if (report) {
    const lines = report.split("\n");
    const elements = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.startsWith("# ")) elements.push(<h1 key={i}>{line.slice(2)}</h1>);
      else if (line.startsWith("## ")) elements.push(<h2 key={i}>{line.slice(3)}</h2>);
      else if (line.startsWith("### ")) elements.push(<h3 key={i}>{line.slice(4)}</h3>);
      else if (line.startsWith("- ") || line.startsWith("* ")) elements.push(<li key={i}>{renderInline(line.slice(2), onCitationClick)}</li>);
      else if (line.trim() !== "") elements.push(<p key={i}>{renderInline(line, onCitationClick)}</p>);
      i++;
    }
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="report-wrapper">
        <div className="report-header">
          <div>
            <span className="report-title">Research Report</span>
            {rateLimit && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>API: {rateLimit.tokens} tokens</span>}
          </div>
          <div className="report-actions">
            <button className={`report-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>{copied ? '✓ Copied' : '⧉ Copy'}</button>
            <button className="report-btn" onClick={handleDownloadPDF}><Download size={14} /> PDF</button>
          </div>
        </div>
        <div className="report-content" id="report-pdf-content">{elements}</div>
      </motion.div>
    );
  }

  if (running && hasWriter) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="report-header"><span className="report-title">Research Report</span></div>
        <div className="skeleton">
          <div className="skeleton-line" style={{ width: '45%', height: 24, marginBottom: 8 }} />
          {['100%', '92%', '85%', '96%', '70%', '100%', '88%'].map((w, i) => (
            <div key={i} className="skeleton-line" style={{ width: w, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
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

function renderInline(text, onCitationClick) {
  return text.split(/(\[\d+\])/g).map((part, i) => {
    const m = part.match(/^\[(\d+)\]$/);
    if (m) {
      const idx = parseInt(m[1], 10);
      return (
        <span
          key={i}
          className="citation"
          onClick={(e) => { e.stopPropagation(); onCitationClick && onCitationClick(idx); }}
          title={`View source ${idx}`}
        >
          {m[1]}
        </span>
      );
    }
    return part;
  });
}

/* ══════════════════════════════════════════════
   Source Drawer
   ══════════════════════════════════════════════ */
function SourceDrawer({ sources, activeIndex, onClose, onNavigate, savedSources, onToggleSave }) {
  const source = sources.find(s => s.index === activeIndex);
  if (!source) return null;

  const isSaved = savedSources.some(s => s.url === source.url);
  const currentPos = sources.findIndex(s => s.index === activeIndex);
  const hasPrev = currentPos > 0;
  const hasNext = currentPos < sources.length - 1;

  const getFaviconUrl = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  const getScoreColor = (score) => {
    if (score >= 0.8) return '#61C08B';
    if (score >= 0.5) return '#F0B36A';
    return '#A1A1A6';
  };

  const getScoreLabel = (score) => {
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  return (
    <AnimatePresence>
      <motion.div
        className="source-drawer-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.aside
        className="source-drawer"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        {/* Header */}
        <div className="source-drawer-header">
          <div className="source-drawer-nav">
            <button
              className="source-drawer-nav-btn"
              disabled={!hasPrev}
              onClick={() => hasPrev && onNavigate(sources[currentPos - 1].index)}
              title="Previous source"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="source-drawer-counter">
              {currentPos + 1} / {sources.length}
            </span>
            <button
              className="source-drawer-nav-btn"
              disabled={!hasNext}
              onClick={() => hasNext && onNavigate(sources[currentPos + 1].index)}
              title="Next source"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="source-drawer-actions">
            <button
              className={`source-drawer-save-btn ${isSaved ? 'saved' : ''}`}
              onClick={() => onToggleSave(source)}
              title={isSaved ? 'Remove from saved' : 'Save source'}
            >
              {isSaved ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
            </button>
            <button className="source-drawer-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="source-drawer-body">
          {/* Domain & Favicon */}
          <div className="source-drawer-domain">
            <img
              src={getFaviconUrl(source.domain)}
              alt=""
              className="source-drawer-favicon"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <span className="source-drawer-domain-text">{source.domain}</span>
            {source.score > 0 && (
              <span className="source-drawer-score" style={{ color: getScoreColor(source.score) }}>
                <Star size={12} fill={getScoreColor(source.score)} />
                {getScoreLabel(source.score)} relevance
              </span>
            )}
          </div>

          {/* Title */}
          <h2 className="source-drawer-title">{source.title}</h2>

          {/* URL */}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-drawer-url"
          >
            <Globe size={13} />
            {source.url}
            <ExternalLink size={12} />
          </a>

          {/* Citation badge */}
          <div className="source-drawer-citation-badge">
            Source [{source.index}] in report
          </div>

          {/* Summary / Snippet */}
          {source.summary && (
            <div className="source-drawer-section">
              <h3 className="source-drawer-section-title">Key Insights</h3>
              <p className="source-drawer-summary">{source.summary}</p>
            </div>
          )}
          {source.snippet && !source.summary && (
            <div className="source-drawer-section">
              <h3 className="source-drawer-section-title">Excerpt</h3>
              <p className="source-drawer-summary">{source.snippet}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="source-drawer-footer">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-drawer-open-btn"
          >
            <ExternalLink size={14} /> Open original source
          </a>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}

function QuickAccessButtons({ onNewResearch, onMyReports, onSavedSources, activeView }) {
  return (
    <div className="quick-access-bar">
      <button className={`quick-access-btn${activeView === 'idle' ? ' active' : ''}`} onClick={onNewResearch}>
        <Search size={18} />
        <span>New Research</span>
      </button>
      <button className={`quick-access-btn${activeView === 'reports' ? ' active' : ''}`} onClick={onMyReports}>
        <FileText size={18} />
        <span>My Reports</span>
      </button>
      <button className={`quick-access-btn${activeView === 'sources' ? ' active' : ''}`} onClick={onSavedSources}>
        <Bookmark size={18} />
        <span>Saved Sources</span>
      </button>
    </div>
  );
}

function QuickAccessSidebar({ onNewResearch, onMyReports, onSavedSources, activeView, collapsed }) {
  return (
    <aside className={`quick-access-sidebar${collapsed ? ' collapsed' : ''}`}>
      <button className={`quick-access-sidebar-btn${activeView === 'idle' ? ' active' : ''}`} onClick={onNewResearch} title="New Research">
        <Search size={20} />
        <span className="quick-access-sidebar-label">New Research</span>
      </button>
      <button className={`quick-access-sidebar-btn${activeView === 'reports' ? ' active' : ''}`} onClick={onMyReports} title="My Reports">
        <FileText size={20} />
        <span className="quick-access-sidebar-label">My Reports</span>
      </button>
      <button className={`quick-access-sidebar-btn${activeView === 'sources' ? ' active' : ''}`} onClick={onSavedSources} title="Saved Sources">
        <Bookmark size={20} />
        <span className="quick-access-sidebar-label">Saved Sources</span>
      </button>
    </aside>
  );
}

function ReportsView({ history, onSelect, onDelete }) {
  const getSourceCount = (report) => {
    if (!report) return 0;
    return new Set((report.match(/\[\d+\]/g) || [])).size;
  };

  return (
    <div className="reports-view">
      <div className="reports-header">
        <h2 className="reports-title">My Reports</h2>
        <span className="reports-count">{history.length} report{history.length !== 1 ? 's' : ''}</span>
      </div>
      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <span>No reports yet</span>
          <span className="empty-state-sub">Start a research to see your reports here</span>
        </div>
      ) : (
        <div className="reports-list">
          {history.map((item) => (
            <div key={item.id} className="report-card" onClick={() => onSelect(item)}>
              <div className="report-card-header">
                <div className="report-card-title">{item.query}</div>
                <button className="report-card-delete" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="report-card-meta">
                <span>{getSourceCount(item.report)} sources</span>
                <span>·</span>
                <span>{item.date || "Recently"}</span>
              </div>
              <div className="report-card-preview">
                {item.report.replace(/[#*\[\]]/g, '').slice(0, 120)}...
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SourcesView({ savedSources, onDelete }) {
  return (
    <div className="sources-view">
      <div className="sources-header">
        <h2 className="sources-title">Saved Sources</h2>
        <span className="sources-count">{savedSources.length} source{savedSources.length !== 1 ? 's' : ''}</span>
      </div>
      {savedSources.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔖</div>
          <span>No saved sources yet</span>
          <span className="empty-state-sub">Sources from your research will appear here</span>
        </div>
      ) : (
        <div className="sources-list">
          {savedSources.map((source, idx) => (
            <div key={idx} className="source-card">
              <div className="source-card-header">
                <span className="source-card-index">[{source.index}]</span>
                <div className="source-card-title">{source.title}</div>
                <button className="source-card-delete" onClick={() => onDelete(idx)} title="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
              {source.query && <div className="source-card-query">from: {source.query}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const [history, setHistory] = useState(() => JSON.parse(localStorage.getItem("research_history") || "[]"));
  const [researchMode, setResearchMode] = useState("quick");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [currentView, setCurrentView] = useState(getInitialView);
  const [viewTransition, setViewTransition] = useState("none");
  const [centerView, setCenterView] = useState("idle");
  const [savedSources, setSavedSources] = useState(() => JSON.parse(localStorage.getItem("saved_sources") || "[]"));
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
      {/* Topbar spans full width */}
      <Topbar
        running={running}
        onHome={handleHome}
        onNavClick={handleFooterNav}
      />

      {/* Main 3-Column Body Layout */}
      <div className={`app-body-layout${rightPanelOpen ? '' : ' right-collapsed'}`}>
        {/* Left Standalone Cards */}
        <LeftCards
          activeView={centerView}
          onNewResearch={handleNewResearch}
          onMyReports={() => { saveAllSources(); setCenterView("reports"); }}
          onSavedSources={() => { saveAllSources(); setCenterView("sources"); }}
        />

        {/* Center Main Canvas */}
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

            {/* App Footer */}
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

        {/* Right Sidebar */}
        <SidebarAgents nodes={nodes} history={history} collapsed={!rightPanelOpen} onClose={() => setRightPanelOpen(false)} onViewAll={() => setRightPanelOpen(true)} />
        {!rightPanelOpen && (
          <button className="right-panel-reopen" aria-label="Open panel" onClick={() => setRightPanelOpen(true)}>
            <PanelRightOpen size={16} />
          </button>
        )}
      </div>

      {/* Source Drawer */}
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

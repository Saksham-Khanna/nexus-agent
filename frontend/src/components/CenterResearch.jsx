import { useState, useEffect, useRef } from "react";
import { NODE_META, NODE_ORDER } from "../constants";
import ReportPanel from "./ReportPanel";

export default function CenterResearch({ query, setQuery, onSubmit, running, error, nodes, report, rateLimit, onCitationClick }) {
  const [mobileTab, setMobileTab] = useState("timeline");
  const autoSwitchedRef = useRef(false);

  const doneCount = NODE_ORDER.filter((n) => nodes[n]?.status === "done").length;
  const progressPct = Object.keys(nodes).length > 0 ? Math.round((doneCount / NODE_ORDER.length) * 100) : 0;
  const hasWriter = nodes.writer?.status === "running" || nodes.writer?.status === "done";

  // Reset auto-switch tracker when new run begins
  useEffect(() => {
    if (!running && !hasWriter) {
      autoSwitchedRef.current = false;
    }
  }, [running, hasWriter]);

  // Auto-switch to report tab when writer starts streaming for first time
  useEffect(() => {
    if (hasWriter && !autoSwitchedRef.current) {
      setMobileTab("report");
      autoSwitchedRef.current = true;
    }
  }, [hasWriter]);

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

      {/* Mobile Segmented Tab Switcher (Visible only <= 860px) */}
      <div className="research-mobile-tabs" role="tablist" aria-label="Research Views">
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "timeline"}
          className={`research-tab-btn ${mobileTab === "timeline" ? "active" : ""}`}
          onClick={() => setMobileTab("timeline")}
        >
          <span className="research-tab-title">Agent Pipeline</span>
          <span className={`research-tab-badge ${doneCount === 6 ? "done" : ""}`}>
            {running && nodes.writer?.status !== "done" ? (
              <span className="spinner" style={{ display: "inline-block", fontSize: 10, marginRight: 3 }}>⟳</span>
            ) : null}
            {doneCount}/6
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobileTab === "report"}
          className={`research-tab-btn ${mobileTab === "report" ? "active" : ""}`}
          onClick={() => setMobileTab("report")}
        >
          <span className="research-tab-title">Live Report</span>
          {hasWriter && running ? (
            <span className="research-tab-pulse" title="Writing report...">● Streaming</span>
          ) : report ? (
            <span className="research-tab-badge ready">Ready</span>
          ) : null}
        </button>
      </div>

      <div className="research-grid">
        <div className={`research-timeline ${mobileTab === "timeline" ? "mobile-active" : "mobile-hidden"}`}>
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
        <div className={`research-report ${mobileTab === "report" ? "mobile-active" : "mobile-hidden"}`}>
          <ReportPanel report={report} running={running} hasWriter={hasWriter} rateLimit={rateLimit} onCitationClick={onCitationClick} />
        </div>
      </div>
    </>
  );
}

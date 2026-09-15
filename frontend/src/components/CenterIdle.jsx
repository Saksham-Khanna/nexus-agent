import { RESEARCH_MODES, TRENDING_TOPICS, WORKFLOW_STEPS } from "../constants";

export default function CenterIdle({ query, setQuery, onSubmit, running, onTrendingClick, researchMode, setResearchMode }) {
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

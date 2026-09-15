import { X } from "lucide-react";
import { NODE_META, NODE_ORDER } from "../constants";

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

export default function SidebarAgents({ nodes, history, collapsed, onClose, onViewAll }) {
  return (
    <aside className={`panel-sidebar panel-sidebar-right${collapsed ? ' collapsed' : ''}`}>
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-header-title">AI Agents</span>
        </div>
        <button className="panel-header-action" aria-label="Close panel" onClick={onClose}>
          <X size={14} />
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

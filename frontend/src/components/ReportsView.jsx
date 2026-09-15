import { Trash2 } from "lucide-react";

export default function ReportsView({ history, onSelect, onDelete }) {
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

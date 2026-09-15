import { Trash2 } from "lucide-react";

export default function SourcesView({ savedSources, onDelete }) {
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

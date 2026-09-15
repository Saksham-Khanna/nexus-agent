import { Search, FileText, Bookmark } from "lucide-react";

export default function LeftCards({ activeView, onNewResearch, onMyReports, onSavedSources }) {
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

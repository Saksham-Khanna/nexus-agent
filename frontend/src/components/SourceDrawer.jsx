import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Globe, Star, BookmarkPlus, BookmarkCheck, ExternalLink } from "lucide-react";

export default function SourceDrawer({ sources, activeIndex, onClose, onNavigate, savedSources, onToggleSave }) {
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

        <div className="source-drawer-body">
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

          <h2 className="source-drawer-title">{source.title}</h2>

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

          <div className="source-drawer-citation-badge">
            Source [{source.index}] in report
          </div>

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

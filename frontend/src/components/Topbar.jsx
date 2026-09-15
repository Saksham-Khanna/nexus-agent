import { useState, useEffect, useRef } from "react";
import { Settings, Menu, X, Search, FileText, Bookmark } from "lucide-react";

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

export default function Topbar({ running, onHome, onNavClick, onNewResearch, onMyReports, onSavedSources, activeView }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const handleNav = (id, e) => {
    setMobileOpen(false);
    onNavClick(id, e);
  };
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setMobileOpen(false); };
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target) && btnRef.current && !btnRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);
  return (
    <nav className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand-text" onClick={onHome} title="Go to home" style={{ cursor: 'pointer', marginLeft: '16px' }}>
          <span className="nav-logo-nexus">NEXUS</span>
          <span className="nav-logo-research">RESEARCH</span>
        </div>
      </div>

      <div className="topbar-center" style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        <a href="/#features" onClick={(e) => handleNav('features', e)} className="nav-link">Features</a>
        <a href="/#how-it-works" onClick={(e) => handleNav('how-it-works', e)} className="nav-link">How It Works</a>
        <a href="/#faq" onClick={(e) => handleNav('faq', e)} className="nav-link">FAQ</a>
      </div>

      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {running && (
          <div className="topbar-status running">
            <div className="status-dot" />
            Running
          </div>
        )}
        <a href="https://www.linkedin.com/in/sakshamm-khanna29/" target="_blank" rel="noopener noreferrer" className="github-link topbar-desktop-icon" aria-label="LinkedIn" title="LinkedIn">
          <TopbarLinkedInIcon />
        </a>
        <a href="https://github.com/Saksham-Khanna/nexus-agent" target="_blank" rel="noopener noreferrer" className="github-link topbar-desktop-icon" aria-label="GitHub" title="GitHub">
          <TopbarGitHubIcon />
        </a>
        <button className="github-link topbar-desktop-icon" aria-label="Settings" title="Settings coming soon" onClick={() => alert('Settings coming soon!')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <Settings size={20} />
        </button>
        <button ref={btnRef} className="topbar-hamburger" aria-label="Menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(v => !v)}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileOpen && (
        <>
          <div className="topbar-mobile-overlay" onClick={() => setMobileOpen(false)} />
          <div ref={menuRef} className="topbar-mobile-menu">
            <div className="topbar-mobile-menu-section">
              <div className="topbar-mobile-menu-label">Research</div>
              <button className={`topbar-mobile-menu-item${activeView === 'idle' ? ' active' : ''}`} onClick={() => { setMobileOpen(false); onNewResearch && onNewResearch(); }}>
                <Search size={16} /> New Research
              </button>
              <button className={`topbar-mobile-menu-item${activeView === 'reports' ? ' active' : ''}`} onClick={() => { setMobileOpen(false); onMyReports && onMyReports(); }}>
                <FileText size={16} /> My Reports
              </button>
              <button className={`topbar-mobile-menu-item${activeView === 'sources' ? ' active' : ''}`} onClick={() => { setMobileOpen(false); onSavedSources && onSavedSources(); }}>
                <Bookmark size={16} /> Saved Sources
              </button>
            </div>
            <div className="topbar-mobile-menu-divider" />
            <div className="topbar-mobile-menu-section">
              <div className="topbar-mobile-menu-label">Explore</div>
              <a href="/#features" onClick={(e) => handleNav('features', e)} className="nav-link" style={{ padding: '8px 12px' }}>Features</a>
              <a href="/#how-it-works" onClick={(e) => handleNav('how-it-works', e)} className="nav-link" style={{ padding: '8px 12px' }}>How It Works</a>
              <a href="/#faq" onClick={(e) => handleNav('faq', e)} className="nav-link" style={{ padding: '8px 12px' }}>FAQ</a>
            </div>
            <div className="topbar-mobile-menu-divider" />
            <div className="topbar-mobile-socials">
              <a href="https://www.linkedin.com/in/sakshamm-khanna29/" target="_blank" rel="noopener noreferrer" className="navbar-mobile-social-link">
                <TopbarLinkedInIcon /> LinkedIn
              </a>
              <a href="https://github.com/Saksham-Khanna/nexus-agent" target="_blank" rel="noopener noreferrer" className="navbar-mobile-social-link">
                <TopbarGitHubIcon /> GitHub
              </a>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}

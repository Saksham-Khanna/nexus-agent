import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Search, BrainCircuit, Activity, BookOpen, Layers, Zap, ShieldCheck, ChevronDown, Globe, FileText, Cpu } from 'lucide-react';

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.6 6-6.5a5.5 5.5 0 0 0-1.5-3.8 5.4 5.4 0 0 0-.1-3.7s-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0c-2.7-1.8-3.9-1.4-3.9-1.4a5.4 5.4 0 0 0-.1 3.7 5.5 5.5 0 0 0-1.5 3.8c0 4.9 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const FAQS = [
  { q: "How is NEXUS different from ChatGPT?", a: "ChatGPT answers from its training data, which has a knowledge cutoff. NEXUS actively searches the live web in real time, scrapes actual pages, and synthesizes cited reports — giving you up-to-date, sourced answers instead of memorized ones." },
  { q: "Does it search the live internet?", a: "Yes. Every query triggers a real-time web search. NEXUS retrieves and reads live pages, so your reports always reflect current information rather than outdated training data." },
  { q: "Where do the citations come from?", a: "Citations are sourced directly from the web pages the agents scrape. Every claim in the report is tied back to the original URL, so you can verify every piece of information yourself." },
  { q: "Can I export my research reports?", a: "Yes! Once a report is generated, you can download it as a clean, formatted PDF with a single click from the dashboard." },
  { q: "Is my research history saved?", a: "Your research history is stored locally in your browser, so you can instantly pull up past queries and reports from the sidebar. No account required." },
  { q: "Can I use NEXUS for academic research?", a: "Absolutely. NEXUS is designed for deep, multi-source research — ideal for literature reviews, competitive analysis, thesis research, and professional reports. Always cross-verify critical claims before submission." },
];

const HOW_IT_WORKS = [
  { num: "01", icon: <Cpu size={20}/>, color: "#7c6cf5", title: "Planner", desc: "Breaks your query into specific, targeted research tasks." },
  { num: "02", icon: <Search size={20}/>, color: "#5eead4", title: "Researcher", desc: "Searches the live web and collects the most relevant sources." },
  { num: "03", icon: <Globe size={20}/>, color: "#818cf8", title: "Scraper", desc: "Visits each source and extracts the core text content." },
  { num: "04", icon: <BrainCircuit size={20}/>, color: "#a78bfa", title: "Summarizer", desc: "Condenses each source down to its most critical insights." },
  { num: "05", icon: <ShieldCheck size={20}/>, color: "#f472b6", title: "Reflector", desc: "Grades the research — if gaps exist, it loops back for more." },
  { num: "06", icon: <FileText size={20}/>, color: "#34d399", title: "Writer", desc: "Synthesizes everything into a cited, formatted markdown report." },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      style={{
        borderBottom: '1px solid var(--glass-border)',
        padding: '24px 0',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} style={{ color: 'var(--text-muted)', flexShrink: 0, marginLeft: 16 }} />
        </motion.div>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p
            key="answer"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25 }}
            style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, overflow: 'hidden' }}
          >
            {a}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Landing({ onLaunch }) {
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} style={{ position: 'fixed', width: '100%', zIndex: 100 }}>
        <div className="navbar-brand">
          <div className="navbar-logo">🔬</div>
          <div className="navbar-title">NEXUS <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Research</span></div>
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="nav-link">Features</a>
          <a href="#how-it-works" onClick={(e) => handleScroll(e, 'how-it-works')} className="nav-link">How It Works</a>
          <a href="#faq" onClick={(e) => handleScroll(e, 'faq')} className="nav-link">FAQ</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <a href="https://www.linkedin.com/in/sakshamm-khanna29/" target="_blank" rel="noopener noreferrer" className="github-link" aria-label="LinkedIn">
            <LinkedInIcon />
          </a>
          <a href="https://github.com/Saksham-Khanna/nexus-agent" target="_blank" rel="noopener noreferrer" className="github-link" aria-label="GitHub">
            <GitHubIcon />
          </a>
          <button className="search-submit cta-btn-shimmer" onClick={onLaunch} style={{ position: 'relative', right: 0, bottom: 0 }}>
            Launch App <ArrowRight size={14} style={{ display: 'inline', marginLeft: 4, verticalAlign: 'middle' }} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ paddingTop: '160px', paddingBottom: '120px', maxWidth: '1200px', margin: '0 auto', paddingLeft: '24px', paddingRight: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
          <div className="hero-badge" style={{ marginBottom: '32px' }}>
            <span className="hero-badge-dot" /> V2.0 · MULTI-AGENT INTELLIGENCE
          </div>
          <h1 style={{ fontSize: 'clamp(48px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', marginBottom: '24px' }}>
            Research at the<br />Speed of <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Thought.</span>
          </h1>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '40px', maxWidth: '480px' }}>
            Autonomous AI agents that plan, search the live web, evaluate sources, reflect, and deliver cited markdown reports in minutes.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '48px' }}>
            <button className="search-submit" onClick={onLaunch} style={{ position: 'relative', right: 0, bottom: 0, padding: '14px 28px', fontSize: '15px' }}>
              Launch NEXUS <ArrowRight size={16} style={{ display: 'inline', marginLeft: 8, verticalAlign: 'middle' }} />
            </button>
            <button onClick={(e) => handleScroll(e, 'features')} style={{ padding: '14px 28px', fontSize: '15px', fontWeight: 600, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} /> View Features
            </button>
          </div>
          <div style={{ display: 'flex', gap: '24px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '1px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }}/>REAL-TIME WEB SEARCH</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }}/>6 AUTONOMOUS AGENTS</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }}/>CITED REPORTS</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="glass-card glass-card-3d" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>Local Session · q-94f2</div>
            <div className="hero-badge" style={{ margin: 0, padding: '2px 8px', fontSize: '10px' }}><span className="hero-badge-dot"/> LIVE</div>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>QUERY <Search size={12} style={{ display: 'inline', marginLeft: 4 }} /></div>
            <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '24px' }}>Impact of quantum computing on modern cryptography</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--status-done)', fontSize: '13px' }}><CheckCircle2 size={16} /> Planning research strategy</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--status-done)', fontSize: '13px' }}><CheckCircle2 size={16} /> Searching live web (14 sources found)</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--status-done)', fontSize: '13px' }}><CheckCircle2 size={16} /> Reading & evaluating sources</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--status-done)', fontSize: '13px' }}><CheckCircle2 size={16} /> Reflecting on knowledge gaps</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--status-running)', fontSize: '13px' }}><span className="spinner" style={{ marginLeft: 2, marginRight: 2 }}>⟳</span> Writing report with citations...</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>REPORT.MD</div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}># Quantum Threat to Cryptography</div>
              Quantum computers utilize principles of quantum mechanics to solve complex mathematical problems...<span style={{ display: 'inline-block', width: '8px', height: '14px', background: 'var(--accent-light)', verticalAlign: 'middle', marginLeft: '4px', animation: 'dotPulse 1s infinite' }} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '2px', marginBottom: '16px' }}>— WHY NEXUS</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px' }}>
            The difference between answering<br />and <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>actually researching.</span>
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {[
            { icon: <Activity />, title: "Live Internet Research", desc: "Agents actively browse the live web, pulling in up-to-the-minute data rather than relying on stale training weights." },
            { icon: <BrainCircuit />, title: "Autonomous Multi-Agent AI", desc: "A coordinated team of six specialized agents: Planner, Researcher, Scraper, Summarizer, Reflector, and Writer." },
            { icon: <ShieldCheck />, title: "Verified Citations", desc: "Every claim is backed by a linked citation to the original source, ensuring absolute trust and traceability." },
            { icon: <Zap />, title: "Live Token Streaming", desc: "Watch your report materialize word-by-word in real time. No more staring at a loading spinner for 60 seconds." },
            { icon: <BookOpen />, title: "Markdown & PDF Reports", desc: "Clean, beautifully formatted reports ready to download as PDF or copy directly into your workflow." },
            { icon: <Layers />, title: "Self-Correcting Reflection", desc: "Our Reflector agent grades the research quality. If it's not thorough enough, it forces the agents to dig deeper." }
          ].map((feature, i) => (
            <motion.div key={i} whileHover={{ y: -4, transition: { duration: 0.2 } }} className="glass-card" style={{ padding: '32px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-light)', marginBottom: '24px' }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>{feature.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '2px', marginBottom: '16px' }}>— HOW IT WORKS</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px' }}>
            Six agents, one <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>orchestrated mind.</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '16px', maxWidth: '500px', margin: '16px auto 0 auto' }}>A coordinated pipeline of specialized AI agents — each with a single job, working in perfect sequence.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', position: 'relative' }}>
          {HOW_IT_WORKS.map((step, i) => (
            <motion.div key={i} whileHover={{ y: -4 }} className="glass-card" style={{ padding: '24px', position: 'relative' }}>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: step.color, fontWeight: 700, marginBottom: '16px', letterSpacing: '1px' }}>{step.num}</div>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${step.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.color, marginBottom: '16px' }}>
                {step.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{step.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && (
                <div style={{ position: 'absolute', right: '-9px', top: '50%', width: '18px', height: '1px', background: 'var(--glass-border)', zIndex: 2, display: 'none' }} className="connector-line" />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '120px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '2px', marginBottom: '16px' }}>— FAQ</div>
          <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-1px' }}>
            Questions? <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>We've got answers.</span>
          </h2>
        </div>
        <div className="glass-card" style={{ padding: '0 32px' }}>
          {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '160px 24px', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'var(--accent-glow)', filter: 'blur(120px)', borderRadius: '50%', zIndex: 0, opacity: 0.5, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-badge" style={{ marginBottom: '32px' }}>
            <span className="hero-badge-dot" /> READY IN SECONDS
          </div>
          <h2 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: '24px' }}>
            Stop Googling for hours.
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 40px auto' }}>
            Let your autonomous AI research team handle the digging while you focus on the insights.
          </p>
          <button className="search-submit" onClick={onLaunch} style={{ position: 'relative', right: 0, bottom: 0, padding: '16px 32px', fontSize: '16px' }}>
            Launch NEXUS <ArrowRight size={16} style={{ display: 'inline', marginLeft: 8, verticalAlign: 'middle' }} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '48px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="navbar-logo" style={{ width: 24, height: 24, fontSize: 12 }}>🔬</div>
            <div className="navbar-title">NEXUS Research</div>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '8px' }}>© 2026 NEXUS Research. All rights reserved.</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--status-done)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} /> ALL SYSTEMS OPERATIONAL
          </span>
        </div>
      </footer>
    </div>
  );
}

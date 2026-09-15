import { useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import html2pdf from "html2pdf.js";

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

export default function ReportPanel({ report, running, hasWriter, rateLimit, onCitationClick }) {
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

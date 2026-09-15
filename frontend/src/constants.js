export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const NODE_META = {
  planner:    { icon: "🗂️",  label: "Web Searcher",   desc: "Searches the web for relevant sources",        color: "blue"   },
  researcher: { icon: "📄",  label: "Source Analyst",  desc: "Reads and extracts key information",          color: "purple" },
  scraper:    { icon: "🛡️",  label: "Fact Checker",    desc: "Verifies facts and checks credibility",       color: "green"  },
  summarizer: { icon: "🔷",  label: "Synthesizer",     desc: "Combines insights across sources",            color: "orange" },
  reflector:  { icon: "✏️",  label: "Report Writer",   desc: "Generates structured research report",        color: "teal"   },
  writer:     { icon: "⭐",  label: "Critic",           desc: "Reviews and improves the final report",       color: "yellow" },
};

export const NODE_ORDER = ["planner", "researcher", "scraper", "summarizer", "reflector", "writer"];

export const RESEARCH_MODES = [
  { id: "quick",    label: "Quick",    icon: "⚡" },
  { id: "deep",     label: "Deep",     icon: "🔍" },
  { id: "academic", label: "Academic", icon: "🎓" },
  { id: "news",     label: "News",     icon: "🌐" },
];

export const TRENDING_TOPICS = [
  "Quantum Computing",
  "AI Agents",
  "CRISPR",
  "Space Tech",
  "Robotics",
  "Cybersecurity",
  "Fusion Energy",
  "Web3",
];

export const WORKFLOW_STEPS = [
  { label: "ASK",        icon: "💬", color: "#C0848E" },
  { label: "SEARCH",     icon: "🔍", color: "#61C08B" },
  { label: "ANALYZE",    icon: "📊", color: "#F0B36A" },
  { label: "VERIFY",     icon: "🛡️", color: "#5B9BD5" },
  { label: "SYNTHESIZE", icon: "🔷", color: "#A47BC4" },
  { label: "REPORT",     icon: "📄", color: "#D58B78" },
];

export const ICON_COLORS = ["pink", "green", "orange", "blue", "purple", "pink"];

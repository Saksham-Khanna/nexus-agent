export const safeParse = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
};

export const getSourceCount = (report) => {
  if (!report) return 0;
  return new Set((report.match(/\[\d+\]/g) || [])).size;
};

export const getFaviconUrl = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

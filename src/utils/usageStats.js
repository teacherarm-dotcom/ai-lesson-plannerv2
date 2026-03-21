const STATS_KEY = 'usage_stats';
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyxjQPVEx1FGPOvkCZ43V4STKKhY6VCgodo-A25ykPGiCWaIJGxDe8IvWBvNXcP7GLz/exec';

const getStats = () => {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch { return {}; }
};

const saveStats = (stats) => localStorage.setItem(STATS_KEY, JSON.stringify(stats));

/**
 * Track a page visit (once per session)
 */
export const trackVisit = () => {
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastVisitDate === today) return; // already tracked today

  stats.totalVisits = (stats.totalVisits || 0) + 1;
  stats.lastVisitDate = today;
  saveStats(stats);

  // Log to Google Sheet
  if (GOOGLE_SHEET_URL) {
    try {
      fetch(GOOGLE_SHEET_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'visit', timestamp: new Date().toISOString() }),
      }).catch(() => {});
    } catch { /* silent */ }
  }
};

/**
 * Track a download
 */
export const trackDownload = () => {
  const stats = getStats();
  stats.totalDownloads = (stats.totalDownloads || 0) + 1;
  saveStats(stats);
};

/**
 * Track AI generation
 */
export const trackGeneration = () => {
  const stats = getStats();
  stats.totalGenerations = (stats.totalGenerations || 0) + 1;
  saveStats(stats);
};

/**
 * Get all stats
 */
export const getUsageStats = () => {
  const stats = getStats();
  return {
    totalVisits: stats.totalVisits || 0,
    totalDownloads: stats.totalDownloads || 0,
    totalGenerations: stats.totalGenerations || 0,
  };
};

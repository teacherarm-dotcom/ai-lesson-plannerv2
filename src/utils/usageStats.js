const STATS_KEY = 'usage_stats';
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbyxjQPVEx1FGPOvkCZ43V4STKKhY6VCgodo-A25ykPGiCWaIJGxDe8IvWBvNXcP7GLz/exec';

const getStats = () => {
  try { return JSON.parse(localStorage.getItem(STATS_KEY)) || {}; } catch { return {}; }
};

const saveStats = (stats) => localStorage.setItem(STATS_KEY, JSON.stringify(stats));

/**
 * Send event to Google Sheet (fire-and-forget)
 */
const sendToSheet = (data) => {
  if (!GOOGLE_SHEET_URL) return;
  try {
    fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data),
    }).catch(() => {});
  } catch { /* silent */ }
};

/**
 * Track a page visit (once per session)
 */
export const trackVisit = () => {
  const stats = getStats();
  const today = new Date().toISOString().split('T')[0];
  if (stats.lastVisitDate === today) return;

  stats.totalVisits = (stats.totalVisits || 0) + 1;
  stats.lastVisitDate = today;
  saveStats(stats);

  sendToSheet({
    type: 'usage_stats',
    event: 'เข้าใช้งาน',
    detail: `ครั้งที่ ${stats.totalVisits}`,
    userAgent: navigator.userAgent,
  });
};

/**
 * Track a download + send to Google Sheet
 */
export const trackDownload = (module = '', courseInfo = '') => {
  const stats = getStats();
  stats.totalDownloads = (stats.totalDownloads || 0) + 1;
  saveStats(stats);

  sendToSheet({
    type: 'usage_stats',
    event: 'ดาวน์โหลด',
    detail: `${module}${courseInfo ? ' — ' + courseInfo : ''} (ครั้งที่ ${stats.totalDownloads})`,
    userAgent: navigator.userAgent,
  });
};

/**
 * Track AI generation + send to Google Sheet
 */
export const trackGeneration = (module = '', courseInfo = '') => {
  const stats = getStats();
  stats.totalGenerations = (stats.totalGenerations || 0) + 1;
  saveStats(stats);

  sendToSheet({
    type: 'usage_stats',
    event: 'สร้างแผนฯ',
    detail: `${module}${courseInfo ? ' — ' + courseInfo : ''} (ครั้งที่ ${stats.totalGenerations})`,
    userAgent: navigator.userAgent,
  });
};

/**
 * Send user download info to Google Sheet (ข้อมูลผู้ใช้)
 */
export const sendUserDownloadInfo = (userInfo, courseInfo = {}, module = '') => {
  sendToSheet({
    type: 'user_download',
    ...userInfo,
    courseCode: courseInfo.courseCode || '',
    courseName: courseInfo.courseName || '',
    module,
  });
};

/**
 * Get all stats (for display in sidebar)
 */
export const getUsageStats = () => {
  const stats = getStats();
  return {
    totalVisits: stats.totalVisits || 0,
    totalDownloads: stats.totalDownloads || 0,
    totalGenerations: stats.totalGenerations || 0,
  };
};

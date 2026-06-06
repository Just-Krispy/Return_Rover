// ============================================
// SETTINGS.JS — Dashboard settings, config defaults
// ============================================
// Configurable project name, gateway, refresh, feature flags

export const PROJECT_NAME = 'Research Pipeline';   // Generic — replace per-project
export const PROJECT_SLUG = 'research';             // Used in braindump tags

export const DEFAULT_GATEWAY = 'https://archer-vps.taile001d1.ts.net/brain-api';
export const FETCH_TIMEOUT = 5000;                  // 5s before abort
export const CACHE_TTL = 24 * 60 * 60 * 1000;      // 24h IndexedDB cache TTL

export let API_GATEWAY = (() => {
  const stored = localStorage.getItem('brain-api-gateway') || DEFAULT_GATEWAY;
  try { if (stored) new URL(stored); } catch { return DEFAULT_GATEWAY; }
  return stored;
})();

export let REFRESH_INTERVAL = 600000;  // 10 minutes
export let MAX_RECENT_SEARCHES = parseInt(localStorage.getItem('brain-max-searches') || '8');

/** Persist an updated gateway URL */
export function setApiGateway(url) {
  try { if (url) new URL(url); } catch { return; }
  API_GATEWAY = url;
  localStorage.setItem('brain-api-gateway', url);
}

/** Persist an updated refresh interval (ms) */
export function setRefreshInterval(ms) {
  REFRESH_INTERVAL = ms;
}

/** Persist max recent searches */
export function setMaxRecentSearches(n) {
  MAX_RECENT_SEARCHES = n;
  localStorage.setItem('brain-max-searches', String(n));
}

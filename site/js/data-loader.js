// Dornt Data Loader — Fetches JSON from GCS public bucket

const API_BASE = window.DORNT_API_BASE || 'api/v1';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cache = new Map();

async function fetchData(path) {
  const url = `${API_BASE}/${path}`;
  const cached = cache.get(url);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache.set(url, { data, time: Date.now() });
    return data;
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err);
    if (cached) return cached.data; // Return stale data if available
    throw err;
  }
}

// Public API
async function getTopStories() {
  return fetchData('top.json');
}

async function getStoryIndex() {
  return fetchData('stories/index.json');
}

async function getStoryDetail(id) {
  return fetchData(`stories/${id}.json`);
}

async function getStorylines() {
  return fetchData('storylines/index.json');
}

async function getStoryline(id) {
  return fetchData(`storylines/${id}.json`);
}

async function getBriefing() {
  return fetchData('briefing/latest.json');
}

async function getPlatformMeta() {
  return fetchData('meta.json');
}

// For non-module usage
window.dorntData = {
  getTopStories,
  getStoryIndex,
  getStoryDetail,
  getStorylines,
  getStoryline,
  getBriefing,
  getPlatformMeta,
};

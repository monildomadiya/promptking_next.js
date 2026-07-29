export const getCache = (key, ttlMs = 5 * 60 * 1000) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > ttlMs) return null; // Cache expired
    return data;
  } catch (error) {
    console.warn('Failed to parse cache for key:', key);
    return null;
  }
};

export const setCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch (error) {
    console.warn('Failed to set cache for key:', key);
  }
};

export const clearCache = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to clear cache for key:', key);
  }
};

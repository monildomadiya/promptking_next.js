/**
 * Lightweight server-side in-memory cache with TTL.
 * This runs in the Node.js server process — shared across all requests.
 * Keys expire after their configured TTL (in milliseconds).
 */

const store = new Map();

/**
 * Get a value from cache.
 * Returns null if the key doesn't exist or has expired.
 */
export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Set a value in cache with a TTL in milliseconds.
 * @param {string} key
 * @param {*} data
 * @param {number} ttlMs - Time to live in milliseconds (default: 5 minutes)
 */
export function cacheSet(key, data, ttlMs = 5 * 60 * 1000) {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Delete a specific key from cache (e.g., after an admin update).
 */
export function cacheInvalidate(key) {
  store.delete(key);
}

/**
 * Clear all cache entries (useful for admin resets).
 */
export function cacheClear() {
  store.clear();
}

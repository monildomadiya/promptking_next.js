/**
 * Lightweight server-side in-memory cache with TTL.
 * This runs in the Node.js server process — shared across all requests.
 * Keys expire after their configured TTL (in milliseconds).
 */

// One Map for the whole process, hung off globalThis rather than module scope.
//
// Route handlers do not reliably share a module instance — the same reason
// lib/db.js keeps its connection pool on globalThis. With a module-level Map,
// /api/settings and /api/admin/save_settings each got their own: the admin save
// dutifully deleted a key from a Map that nothing read, the public route kept
// serving its own copy until the TTL expired, and a settings change took up to
// ten minutes to appear no matter how correct the invalidation looked.
const store = globalThis.__pkCacheStore || (globalThis.__pkCacheStore = new Map());

/**
 * Every cached dataset, named once.
 *
 * These used to be string literals spread across the routes that read them and
 * the admin routes that clear them, which is how `all_prompts_listing` and
 * `api_blogs` ended up being invalidated by four admin routes without anything
 * ever writing them — the caches those calls were meant to clear had never been
 * wired up. A shared map makes that mismatch impossible: if a name is not in
 * here, nothing can invalidate it and nothing can store it.
 */
export const CACHE_KEYS = {
  prompts: 'all_prompts_listing',
  settings: 'api_settings',
  categories: 'api_categories',
  websiteCategories: 'api_website_categories',
  websiteCategoriesSsr: 'website_categories_ssr',
  websiteCategoriesPage: 'all_website_categories_page',
  blogs: 'api_blogs',
  faqs: 'api_faqs',
  wallpapers: 'api_wallpapers',
  wallpaperCategories: 'api_wallpaper_categories',
};

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

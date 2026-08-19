import db from '@/lib/db';
import { cacheGet, cacheSet, CACHE_KEYS } from '@/lib/cache';

// Same cadence as the prompt listing: long enough that a burst of traffic is
// one query, short enough that a scheduled wallpaper goes live on time. Admin
// writes call publishChanges('wallpapers') and drop it immediately.
const WALLPAPERS_TTL_MS = 60 * 1000;

const parseDbBool = (val) => {
  if (val === null || val === undefined) return false;
  if (Buffer.isBuffer(val)) return val[0] === 1;
  return val == 1 || val === true || val === 'true';
};

// Re-exported so server code has one import site for wallpapers; the
// definitions live in lib/wallpaperUrls.js because client components need them
// and this module imports the database pool.
export { DOWNLOAD_SIZES, buildDownloadUrl, previewUrl } from '@/lib/wallpaperUrls';

const shapeRow = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  description: row.description || '',
  image: row.image_url,
  orientation: row.orientation || 'both',
  width: row.width || null,
  height: row.height || null,
  tags: String(row.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
  categoryId: row.category_id || null,
  categoryName: row.category_name || null,
  categorySlug: row.category_slug || null,
  promptKey: row.prompt_key || null,
  downloadCount: Number(row.download_count || 0),
  viewCount: Number(row.view_count || 0),
  isFeatured: parseDbBool(row.is_featured),
  metaTitle: row.meta_title || null,
  metaDescription: row.meta_description || null,
  publishDate: row.publish_date ? new Date(row.publish_date).toISOString() : null,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
});

/**
 * Every wallpaper the public site may show: published, not a draft, and past
 * its publish date. Mirrors the prompt listing's rules so a wallpaper
 * scheduled for next week behaves the way an admin already expects.
 */
export async function fetchWallpapers() {
  const cached = cacheGet(CACHE_KEYS.wallpapers);
  if (cached) return cached;

  try {
    // Columns listed literally: the db wrapper turns every ${} into a bound
    // parameter, so a column list cannot be interpolated — it would arrive as
    // a quoted string and select a constant instead of the row's data.
    // LEFT JOIN, not INNER: a wallpaper with no category yet still belongs on
    // the page — it just falls outside every pill but "All".
    const rows = await db`
      SELECT w.id, w.slug, w.title, w.description, w.image_url, w.orientation,
             w.width, w.height, w.tags, w.prompt_key, w.download_count,
             w.view_count, w.is_featured, w.meta_title, w.meta_description,
             w.publish_date, w.created_at, w.category_id,
             c.name AS category_name, c.slug AS category_slug
      FROM wallpapers w
      LEFT JOIN wallpaper_categories c ON c.id = w.category_id
      WHERE (w.is_draft = 0 OR w.is_draft IS NULL)
        AND (w.publish_date IS NULL OR w.publish_date <= NOW())
      ORDER BY w.is_featured DESC, w.sort_order ASC, w.id DESC
    `;
    const wallpapers = rows.map(shapeRow);
    cacheSet(CACHE_KEYS.wallpapers, wallpapers, WALLPAPERS_TTL_MS);
    return wallpapers;
  } catch (error) {
    // A missing table or a dead connection should cost the section, not the
    // whole page — /wallpapers renders its empty state instead of a 500.
    console.error('fetchWallpapers failed:', error.message);
    return [];
  }
}

export async function fetchWallpaperBySlug(slug) {
  if (!slug) return null;
  const all = await fetchWallpapers();
  return all.find((w) => w.slug === slug) || null;
}

/**
 * Categories that actually have something to show.
 *
 * An empty pill is worse than a missing one: it advertises a collection, costs
 * a tap, and lands on "nothing here". The counts come from the same cached
 * listing the grid renders, so a pill can never disagree with the grid.
 */
export async function fetchWallpaperCategories() {
  const cached = cacheGet(CACHE_KEYS.wallpaperCategories);
  if (cached) return cached;

  try {
    const rows = await db`
      SELECT id, name, slug, description, sort_order
      FROM wallpaper_categories
      ORDER BY sort_order ASC, name ASC
    `;

    const wallpapers = await fetchWallpapers();
    const counts = wallpapers.reduce((acc, w) => {
      if (w.categoryId) acc[w.categoryId] = (acc[w.categoryId] || 0) + 1;
      return acc;
    }, {});

    const categories = rows
      .map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description || '',
        count: counts[r.id] || 0,
      }))
      .filter((c) => c.count > 0);

    cacheSet(CACHE_KEYS.wallpaperCategories, categories, WALLPAPERS_TTL_MS);
    return categories;
  } catch (error) {
    console.error('fetchWallpaperCategories failed:', error.message);
    return [];
  }
}

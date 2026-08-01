import db from '@/lib/db';
import { cacheGet, cacheSet, CACHE_KEYS } from '@/lib/cache';

// Short enough that a scheduled prompt (publish_date <= NOW()) still goes live
// on time, long enough that a burst of traffic is one query instead of one per
// visitor. Admin writes call publishChanges() and drop it immediately, so this
// ceiling only applies to changes made straight in the database.
const PROMPTS_TTL_MS = 60 * 1000;

const parseDbBool = (val) => {
  if (val === null || val === undefined) return false;
  if (Buffer.isBuffer(val)) return val[0] === 1;
  return val == 1 || val === true || val === 'true';
};

/**
 * @param {{ includePromptText?: boolean }} [options]
 *   `promptText` is ~82% of this payload (206 KB of 252 KB across 102 prompts).
 *   The grid only needs it when someone actually copies a card, so the
 *   server-rendered page omits it and the client fills it in afterwards.
 */
export async function fetchAllData({ includePromptText = true } = {}) {
  // One cache entry holds the full set; the light payload is that set minus the
  // bodies. Caching the two variants separately would mean two entries to
  // invalidate, and the admin routes only ever cleared one name.
  const shape = ({ prompts, categories }) => ({
    prompts: includePromptText
      ? prompts
      : prompts.map(({ promptText, ...rest }) => rest),
    categories,
  });

  const cached = cacheGet(CACHE_KEYS.prompts);
  if (cached) return shape(cached);

  try {
    // Explicit column list: SELECT * also pulled description, faqs, tags and
    // sub_prompts — large columns that were fetched, transferred, then dropped.
    const promptsRows = await db`
        SELECT prompt_key, slug, title, ai_type, img_before, img_after, thumbnail_url,
               ig_link, is_image_slider, image_ratio, gallery_urls, password, is_premium,
               is_featured, copy_count, unlock_count, like_count, view_count,
               sort_order, meta_title, publish_date, category_id, prompt_text
        FROM prompts
        WHERE (publish_date IS NULL OR publish_date <= NOW())
        -- The sitemap has always excluded drafts and the dashboard badges them
        -- as DRAFT, but this listing never checked the flag, so a prompt marked
        -- draft still sat on the home page — just not in the sitemap.
        AND (is_draft = 0 OR is_draft IS NULL)
        AND (website_category_id IS NULL OR website_category_id = '')
        ORDER BY is_featured DESC, sort_order ASC, prompt_key ASC
      `;
    const categoriesRows = await db`SELECT id, name, slug FROM categories ORDER BY name ASC`;

    const prompts = promptsRows.map(row => ({
      id: row.id ?? row.prompt_key,
      title: row.title,
      sort_order: row.sort_order,
      isImageSlider: parseDbBool(row.is_image_slider),
      copyCount: Number(row.copy_count || 0),
      unlockCount: Number(row.unlock_count || 0),
      likeCount: Number(row.like_count || 0),
      viewCount: Number(row.view_count || 0),
      aiType: row.ai_type,
      slug: row.slug,
      key: row.prompt_key,
      prompt_key: row.prompt_key,
      password: row.password,
      promptText: row.prompt_text,
      thumbnail_url: row.thumbnail_url,
      imgAfter: row.thumbnail_url || row.img_after,
      imgBefore: row.img_before,
      igLink: row.ig_link,
      imageRatio: row.image_ratio,
      galleryUrls: row.gallery_urls,
      isPremium: parseDbBool(row.is_premium),
      isFeatured: parseDbBool(row.is_featured),
      metaTitle: row.meta_title,
      publish_date: row.publish_date ? row.publish_date.toISOString() : null,
      category_id: row.category_id
    }));

    const data = { prompts, categories: categoriesRows };
    cacheSet(CACHE_KEYS.prompts, data, PROMPTS_TTL_MS);
    return shape(data);
  } catch (error) {
    console.error('DATABASE ERROR (fetchAllData):', error.message);
    return { prompts: [], categories: [] };
  }
}

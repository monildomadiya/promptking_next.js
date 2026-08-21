import ClientHomePage from './ClientHomePage';
import { fetchAllData } from '@/lib/data';
import { fetchWallpaperCategoryCovers } from '@/lib/wallpapers';
import db from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/cache';

// ISR: page is cached for 60 seconds, then regenerated on next request
export const revalidate = 60;

async function fetchWebsiteCategories() {
  const CACHE_KEY = 'website_categories_ssr';
  const cached = cacheGet(CACHE_KEY);
  if (cached) return cached;

  try {
    const rows = await db`SELECT id, name, slug, image_url, tag FROM website_categories ORDER BY created_at DESC`;
    cacheSet(CACHE_KEY, rows, 10 * 60 * 1000); // 10 minutes
    return rows;
  } catch {
    return [];
  }
}

export default async function Page() {
  // Fetch all data in parallel for fastest load
  // Omit prompt_text from the server-rendered payload: it was ~82% of the data
  // (206 KB of 252 KB) and is only needed when someone copies a card. PromptList
  // fetches the full set in the background once hydrated.
  const [{ prompts, categories }, websiteCategories, wallpaperCategories] = await Promise.all([
    fetchAllData({ includePromptText: false }),
    fetchWebsiteCategories(),
    fetchWallpaperCategoryCovers(),
  ]);

  // What used to sit above this component: an h2, a keyword paragraph and links
  // to all 100 prompt pages, inside a `clip: rect(0,0,0,0)` box. Google treats
  // hidden text and hidden links as a spam signal, and sitemap.xml already lists
  // every prompt and category, so the block carried the risk without doing the
  // job. The visible "Browse" section below provides the crawlable links now.
  return (
    <ClientHomePage
      initialPrompts={prompts}
      initialCategories={categories}
      initialWebsiteCategories={websiteCategories}
      // Categories rather than the wallpapers themselves: the home page's
      // wallpaper section is now a row of links into collections, so shipping
      // fourteen wallpaper rows to render nothing was pure payload.
      initialWallpaperCategories={wallpaperCategories}
    />
  );
}

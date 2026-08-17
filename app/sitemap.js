import db from '@/lib/db';

export const revalidate = 3600; // Revalidate sitemap every hour

const BASE_URL = 'https://promptking.in';

/**
 * Prefer a real modification date. Falling back to `new Date()` for every row
 * makes every entry look like it changed on each sitemap fetch, which causes
 * Google to discount lastmod entirely — so fall back to undefined instead.
 */
const modified = (...candidates) => {
  for (const value of candidates) {
    if (!value) continue;
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return undefined;
};

export default async function sitemap() {
  let prompts = [];
  let categories = [];
  let blogs = [];

  try {
    prompts = await db`SELECT slug, prompt_key, created_at, publish_date FROM prompts WHERE is_draft = 0 OR is_draft IS NULL`;
  } catch (error) {
    console.error('Error fetching prompts for sitemap:', error.message);
  }

  try {
    // website_categories is the table /category/[slug] actually reads. The
    // legacy `categories` table produced sitemap entries whose pages 404.
    // Only list categories that have at least one prompt, so the sitemap can
    // never advertise an empty collection page.
    categories = await db`
      SELECT c.slug, c.created_at
      FROM website_categories c
      JOIN prompts p ON p.website_category_id = c.id
      GROUP BY c.id, c.slug, c.created_at
    `;
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error.message);
  }

  try {
    blogs = await db`SELECT slug, created_at, published_at FROM blogs`;
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error.message);
  }

  const promptUrls = prompts
    .filter((prompt) => prompt.slug || prompt.prompt_key)
    .map((prompt) => ({
      url: `${BASE_URL}/prompt/${prompt.slug || prompt.prompt_key}`,
      lastModified: modified(prompt.publish_date, prompt.created_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const categoryUrls = categories
    .filter((category) => category.slug)
    .map((category) => ({
      url: `${BASE_URL}/category/${category.slug}`,
      lastModified: modified(category.created_at),
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const blogUrls = blogs
    .filter((blog) => blog.slug)
    .map((blog) => ({
      url: `${BASE_URL}/article/${blog.slug}`,
      lastModified: modified(blog.published_at, blog.created_at),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  const entries = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    // Static pages
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/categories`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/games`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/games/guess-the-prompt`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/games/prompt-battle`, changeFrequency: 'weekly', priority: 0.5 },
    // Its content changes with the date, but the page itself is one URL.
    { url: `${BASE_URL}/games/daily-spin`, changeFrequency: 'daily', priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/adsense-policy`, changeFrequency: 'yearly', priority: 0.2 },
    // Dynamic content
    ...promptUrls,
    ...categoryUrls,
    ...blogUrls,
  ];

  // A slug can appear in more than one source query; a duplicate <loc> is a
  // sitemap validation error, so keep the first occurrence of each URL.
  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

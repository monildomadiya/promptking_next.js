import ClientHomePage from './ClientHomePage';
import { fetchAllData } from '@/lib/data';
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
  const [{ prompts, categories }, websiteCategories] = await Promise.all([
    fetchAllData(),
    fetchWebsiteCategories(),
  ]);
  
  return (
    <ClientHomePage 
      initialPrompts={prompts} 
      initialCategories={categories}
      initialWebsiteCategories={websiteCategories}
    />
  );
}

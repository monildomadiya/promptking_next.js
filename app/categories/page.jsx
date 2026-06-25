import ClientCategoriesPage from './ClientCategoriesPage';
import db from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/cache';

// ISR: page is cached for 60 seconds, then regenerated on next request
export const revalidate = 60;

export const metadata = {
  title: 'Explore AI Prompts Categories - PromptKing',
  description: 'Browse all categories of free, premium, and expert-crafted AI prompts for ChatGPT, Midjourney, Gemini, and more.',
};

async function fetchAllCategories() {
  const CACHE_KEY = 'all_categories_page';
  const cached = cacheGet(CACHE_KEY);
  if (cached) return cached;

  try {
    const rows = await db`SELECT id, name, slug FROM categories ORDER BY name ASC`;
    cacheSet(CACHE_KEY, rows, 10 * 60 * 1000); // 10 minutes cache
    return rows;
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await fetchAllCategories();
  
  return (
    <ClientCategoriesPage categories={categories} />
  );
}

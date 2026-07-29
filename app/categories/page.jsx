import ClientCategoriesPage from './ClientCategoriesPage';
import db from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/cache';

// ISR: page is cached for 60 seconds, then regenerated on next request
export const revalidate = 60;

export const metadata = {
  title: 'Explore AI Prompts Categories - PromptKing | Browse by Topic',
  description: 'Browse all categories of free, premium, and expert-crafted AI prompts for ChatGPT, Midjourney, Gemini, Claude, and more. Find the perfect prompt by topic, use case, or AI tool.',
  alternates: {
    canonical: 'https://promptking.in/categories',
  },
  openGraph: {
    title: 'Explore AI Prompts Categories - PromptKing | Browse by Topic',
    description: 'Browse all categories of free, premium, and expert-crafted AI prompts for ChatGPT, Midjourney, Gemini, Claude, and more.',
    url: 'https://promptking.in/categories',
    images: [
      {
        url: 'https://promptking.in/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PromptKing Categories',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Explore AI Prompts Categories - PromptKing | Browse by Topic',
    description: 'Browse all categories of free, premium, and expert-crafted AI prompts for ChatGPT, Midjourney, Gemini, Claude, and more.',
    images: ['https://promptking.in/og-image.jpg'],
  },
};

async function fetchAllCategories() {
  const CACHE_KEY = 'all_website_categories_page';
  const cached = cacheGet(CACHE_KEY);
  if (cached) return cached;

  try {
    // Fetch website_categories (not AI-type categories)
    const rows = await db`SELECT id, name, slug, image_url, tag FROM website_categories ORDER BY created_at DESC`;
    cacheSet(CACHE_KEY, rows, 10 * 60 * 1000); // 10 minutes cache
    return rows;
  } catch (error) {
    console.error("Error fetching website categories:", error);
    return [];
  }
}

export default async function CategoriesPage() {
  const categories = await fetchAllCategories();
  
  return (
    <ClientCategoriesPage categories={categories} />
  );
}

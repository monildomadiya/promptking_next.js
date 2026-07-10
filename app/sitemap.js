import db from '@/lib/db';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap() {
  const baseUrl = 'https://promptking.in';

  let prompts = [];
  let categories = [];
  let blogs = [];

  try {
    prompts = await db`SELECT slug, prompt_key, created_at FROM prompts`;
  } catch (error) {
    console.error('Error fetching prompts for sitemap:', error.message);
  }

  try {
    categories = await db`SELECT slug FROM categories`;
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error.message);
  }

  try {
    blogs = await db`SELECT slug, created_at FROM blogs`;
  } catch (error) {
    console.error('Error fetching blogs for sitemap:', error.message);
  }

  const promptUrls = prompts.map((prompt) => ({
    url: `${baseUrl}/prompt/${prompt.slug || prompt.prompt_key}`,
    lastModified: prompt.created_at ? new Date(prompt.created_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const categoryUrls = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const blogUrls = blogs.map((blog) => ({
    url: `${baseUrl}/article/${blog.slug}`,
    lastModified: blog.created_at ? new Date(blog.created_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // Static pages
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/categories`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/adsense-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    // Dynamic content
    ...promptUrls,
    ...categoryUrls,
    ...blogUrls,
  ];
}

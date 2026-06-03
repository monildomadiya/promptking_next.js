const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const baseUrl = 'https://promptking.in';
  
  try {
    // Fetch dynamic content
    const prompts = await db`SELECT prompt_key, slug, created_at FROM prompts`;
    const blogs = await db`SELECT slug, created_at FROM blogs`;
    const categories = await db`SELECT slug, created_at FROM categories`;
    
    // Start XML string
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static Routes
    const staticRoutes = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      { url: '/blog', changefreq: 'daily', priority: 0.8 },
      { url: '/faq', changefreq: 'weekly', priority: 0.7 },
      { url: '/about', changefreq: 'monthly', priority: 0.6 },
      { url: '/contact', changefreq: 'monthly', priority: 0.6 }
    ];

    staticRoutes.forEach(route => {
      xml += `
  <url>
    <loc>${baseUrl}${route.url}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    });

    // Dynamic Prompts
    prompts.forEach(prompt => {
      const slug = prompt.slug || prompt.prompt_key;
      xml += `
  <url>
    <loc>${baseUrl}/prompt/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Dynamic Blogs
    blogs.forEach(blog => {
      xml += `
  <url>
    <loc>${baseUrl}/article/${blog.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Dynamic Categories
    categories.forEach(category => {
      xml += `
  <url>
    <loc>${baseUrl}/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    xml += `\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);

  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

module.exports = router;

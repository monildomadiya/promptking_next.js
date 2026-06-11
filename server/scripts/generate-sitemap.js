/**
 * PromptKing - Dynamic Sitemap Generator
 * 
 * Run this script to regenerate sitemap.xml with all Prompts & Blogs from the database.
 * Usage: cd server && node scripts/generate-sitemap.js
 * 
 * This regenerates the file at: client/public/sitemap.xml
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SITE_URL = 'https://promptking.in';
const SITEMAP_PATH = path.join(__dirname, '../../client/public/sitemap.xml');

const STATIC_PAGES = [
  { url: '/',              changefreq: 'daily',   priority: '1.0' },
  { url: '/blog',          changefreq: 'weekly',  priority: '0.9' },
  { url: '/faq',           changefreq: 'monthly', priority: '0.7' },
  { url: '/about',         changefreq: 'monthly', priority: '0.6' },
  { url: '/contact',       changefreq: 'monthly', priority: '0.5' },
  { url: '/privacy',       changefreq: 'yearly',  priority: '0.3' },
  { url: '/terms',         changefreq: 'yearly',  priority: '0.3' },
  { url: '/disclaimer',    changefreq: 'yearly',  priority: '0.3' },
  { url: '/adsense-policy',changefreq: 'yearly',  priority: '0.3' },
];

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d) {
  const date = d ? new Date(d) : new Date();
  return date.toISOString().split('T')[0];
}

function buildUrlEntry({ loc, lastmod, changefreq, priority, images = [] }) {
  let imagesXml = '';
  if (images.length > 0) {
    imagesXml = images.map(img => `
    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`).join('');
  }

  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod || formatDate()}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imagesXml}
  </url>`;
}

async function generateSitemap() {
  let pool;
  try {
    pool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      port: 3306,
      ssl: { rejectUnauthorized: false }
    });

    console.log('✅ Connected to database');

    // Fetch all prompts
    const [prompts] = await pool.query(
      'SELECT prompt_key, title, updated_at, created_at, img_after, img_before FROM prompts WHERE 1 ORDER BY updated_at DESC'
    );
    console.log(`📋 Found ${prompts.length} prompts`);

    // Fetch all blog posts
    const [blogs] = await pool.query(
      'SELECT slug, title, updated_at, created_at, featured_image FROM blogs ORDER BY updated_at DESC'
    );
    console.log(`📰 Found ${blogs.length} blog articles`);

    // Fetch all categories
    const [categories] = await pool.query(
      'SELECT id, name, slug FROM categories ORDER BY name ASC'
    );
    console.log(`📂 Found ${categories.length} categories`);

    // Build all URL entries
    const urls = [];

    // Static pages
    for (const page of STATIC_PAGES) {
      urls.push(buildUrlEntry({
        loc: `${SITE_URL}${page.url}`,
        lastmod: formatDate(),
        changefreq: page.changefreq,
        priority: page.priority
      }));
    }

    // Category pages
    for (const cat of categories) {
      const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
      urls.push(buildUrlEntry({
        loc: `${SITE_URL}/category/${catSlug}`,
        lastmod: formatDate(),
        changefreq: 'daily',
        priority: '0.8'
      }));
    }

    // Blog articles
    for (const blog of blogs) {
      if (!blog.slug) continue;
      
      const images = [];
      if (blog.featured_image) {
        images.push({ loc: blog.featured_image.startsWith('/') ? SITE_URL + blog.featured_image : blog.featured_image, title: blog.title });
      }

      urls.push(buildUrlEntry({
        loc: `${SITE_URL}/article/${blog.slug}`,
        lastmod: formatDate(blog.updated_at || blog.created_at),
        changefreq: 'weekly',
        priority: '0.8',
        images
      }));
    }

    // Prompt detail pages
    for (const prompt of prompts) {
      if (!prompt.prompt_key) continue;

      const images = [];
      if (prompt.img_after) {
        images.push({ loc: prompt.img_after.startsWith('/') ? SITE_URL + prompt.img_after : prompt.img_after, title: prompt.title });
      }
      if (prompt.img_before) {
        images.push({ loc: prompt.img_before.startsWith('/') ? SITE_URL + prompt.img_before : prompt.img_before, title: prompt.title + ' (Before)' });
      }

      urls.push(buildUrlEntry({
        loc: `${SITE_URL}/prompt/${prompt.prompt_key}`,
        lastmod: formatDate(prompt.updated_at || prompt.created_at),
        changefreq: 'weekly',
        priority: '0.7',
        images
      }));
    }

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>`;

    fs.writeFileSync(SITEMAP_PATH, sitemapXml, 'utf8');
    console.log(`\n✅ Sitemap generated: ${SITEMAP_PATH}`);
    console.log(`   Total URLs: ${urls.length}`);

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Sitemap generation failed:', err.message);
    if (pool) await pool.end();
    process.exit(1);
  }
}

generateSitemap();

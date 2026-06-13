const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
cloudinary.config(true);


const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

const logAdminAction = async (action, details) => {
  try {
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
    await db`INSERT INTO activity_logs (action, details) VALUES (${action}, ${detailsStr})`;
  } catch (err) {
    console.warn("Audit Log Error:", err.message);
  }
};

// Safety Guard: Prevent infinite self-referential DDOS in production fallbacks
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (process.env.NODE_ENV === 'production' && typeof url === 'string' && url.includes('api.promptking.in/api/')) {
    throw new Error('Self-referential live API fallback disabled in production.');
  }
  return originalFetch(url, options);
};

let lastDbFailure = 0;
const DB_RETRY_DELAY = 10 * 1000; // 10 seconds, not 10 minutes!

const isDbHealthy = () => {
  if (lastDbFailure === 0) return true;
  const timeSinceFailure = Date.now() - lastDbFailure;
  return timeSinceFailure > DB_RETRY_DELAY;
};

// Local Overrides Cache (for local dev resilience)
let localSettingsCache = {};

const MOCK_DATA = {
  prompts: [
    {
      prompt_key: "PK001",
      slug: "photorealistic-cyberpunk-portrait",
      title: "Photorealistic Cyberpunk Portrait",
      description: "A highly detailed portrait of a cyberpunk character in a neon-lit street.",
      ai_type: "Midjourney",
      prompt_text: "High-end fashion photography, close up portrait of a futuristic cyberpunk woman, neon accessories, glowing skin, shallow depth of field, 8k resolution, cinematic lighting --ar 4:5 --v 6.0",
      img_before: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800",
      img_after: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=800",
      is_image_slider: 1,
      hide_prompt_box: 0,
      image_ratio: "4:5",
      is_premium: 1,
      is_featured: 1,
      gallery_urls: '["https://images.unsplash.com/photo-1550751827-4bd374c3f58b", "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5"]',
      copy_count: 156,
      unlock_count: 42,
      like_count: 89
    },
    {
      prompt_key: "PK002",
      slug: "modern-minimalist-living-room",
      title: "Modern Minimalist Living Room",
      description: "Clean and airy interior design style for a modern living room.",
      ai_type: "DALL-E",
      prompt_text: "Modern minimalist living room, soft natural lighting, Scandinavian furniture, neutral color palette, large windows, high ceiling, architectural photography style.",
      img_before: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800",
      img_after: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&q=80&w=800",
      is_image_slider: 0,
      hide_prompt_box: 0,
      image_ratio: "16:9",
      is_premium: 0,
      copy_count: 312,
      unlock_count: 0,
      like_count: 145
    },
    {
      prompt_key: "PK003",
      slug: "ghibli-style-anime-landscape",
      title: "Ghibli Style Anime Landscape",
      description: "A beautiful, serene landscape in the style of Studio Ghibli.",
      ai_type: "ChatGPT",
      prompt_text: "Rolling green hills with a small white cottage, blooming flowers everywhere, huge fluffy white clouds in a bright blue sky, Ghibli anime style, oil painting texture, vibrant colors, peaceful atmosphere.",
      img_before: "https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&q=80&w=800",
      img_after: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800",
      is_image_slider: 1,
      hide_prompt_box: 0,
      image_ratio: "3:2",
      is_premium: 0,
      copy_count: 890,
      unlock_count: 0,
      like_count: 420
    }
  ],
  categories: [
    { id: 1, name: "Midjourney", slug: "midjourney" },
    { id: 2, name: "DALL-E", slug: "dall-e" },
    { id: 3, name: "ChatGPT", slug: "chatgpt" },
    { id: 4, name: "Stable Diffusion", slug: "stable-diffusion" }
  ],
  settings: {
    logo_url: "",
    logo_height_desktop: "50px",
    logo_height_mobile: "32px",
    adsense_client_id: "ca-pub-test",
    adsense_enabled: "0",
    youtube_url: "https://youtube.com",
    instagram_url: "https://instagram.com"
  }
};

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }); }

const memoryStorage = multer.memoryStorage();

const upload = multer({ storage: memoryStorage });

// --- HELPER: Generate Unique Slug ---
const generateUniqueSlug = async (title, currentId = null, table = 'prompts', idColumn = 'prompt_key') => {
  if (!title) title = table === 'prompts' ? 'prompt' : 'article';
  
  let slug = title.toString().toLowerCase()
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (!slug) slug = table === 'prompts' ? 'prompt' : 'post';

  let uniqueSlug = slug;
  let counter = 1;
  let exists = true;

  while (exists) {
    const rows = await db`
      SELECT ${db(idColumn)} 
      FROM ${db(table)} 
      WHERE slug = ${uniqueSlug} AND ${db(idColumn)} != ${currentId || (idColumn === 'id' ? 0 : '')}
    `;
    if (rows.length === 0) {
      exists = false;
    } else {
      counter++;
      uniqueSlug = `${slug}-${counter}`;
    }
  }
  return uniqueSlug;
};

// --- LOGO UPLOAD (SVG Support & WebP native) ---
const logoUpload = multer({ 
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.avif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Invalid image type"));
  }
});

// --- IMAGE OPTIMIZATION PROXY ---
router.get('/optimize', async (req, res) => {
  try {
    const src = req.query.src;
    const width = parseInt(req.query.w, 10) || 800;

    if (!src) return res.status(400).send('Missing src parameter');

    let imageBuffer;

    if (src.startsWith('/uploads/')) {
      // Local image processing
      const absolutePath = path.join(__dirname, '..', src);
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).send('Image not found');
      }
      imageBuffer = await fs.promises.readFile(absolutePath);
    } else if (src.startsWith('http://') || src.startsWith('https://')) {
      // External image processing with basic domain whitelisting
      try {
        const parsedUrl = new URL(src);
        const allowedDomains = ['images.unsplash.com', 'i.pinimg.com', 'api.promptking.in'];
        
        if (!allowedDomains.includes(parsedUrl.hostname)) {
          console.warn('Unauthorized image proxy attempt:', parsedUrl.hostname);
          return res.redirect(src); // Gracefully fallback to original source
        }

        const fetchRes = await fetch(src);
        if (!fetchRes.ok) throw new Error(`External fetch failed: ${fetchRes.statusText}`);
        
        // Convert arrayBuffer to Node Buffer
        const arrayBuffer = await fetchRes.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
      } catch (fetchErr) {
        console.error('External image fetch error:', fetchErr);
        return res.redirect(src);
      }
    } else {
       return res.redirect(src);
    }

    // Process image with sharp
    const optimizedBuffer = await sharp(imageBuffer)
      .resize({ width: width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    res.set('Content-Type', 'image/webp');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(optimizedBuffer);
  } catch (error) {
    console.error('Image Optimization Error:', error);
    res.redirect(req.query.src);
  }
});


// --- 1. AUTHENTICATION (Removed Firebase Auth) ---
// Login and logout routes were removed. Admin auth remains separate.


// --- 2. FETCH PROMPTS ---
router.get('/get_data', async (req, res) => {
  const isLiveServer = req.headers.host && req.headers.host.includes('promptking.in');
  
  if (!isDbHealthy()) {
    console.log('Skipping DB query (Circuit Breaker active)...');
    if (!isLiveServer) {
      return fetchLiveData();
    } else {
      return res.json({
        prompts: MOCK_DATA.prompts,
        likes: {},
        categories: MOCK_DATA.categories
      });
    }
  }

  async function fetchLiveData() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/get_data');
      if (!liveRes.ok) throw new Error(`Live API responded with ${liveRes.status}`);
      const data = await liveRes.json();
      
      if (data.prompts) {
        data.prompts = data.prompts.map(p => ({
          ...p,
          isFeatured: p.isFeatured !== undefined ? p.isFeatured : (p.prompt_key === 'PK001' || p.prompt_key === 'PK004' ? true : false)
        }));
      }
      
      res.json(data);
    } catch (liveError) {
      console.error('CRITICAL ERROR: LIVE API FALLBACK FAILED:', liveError.message);
      const mockPrompts = MOCK_DATA.prompts.map(p => ({
        ...p,
        isImageSlider: Boolean(p.is_image_slider),
        hidePromptBox: Boolean(p.hide_prompt_box),
        copyCount: Number(p.copy_count || 0),
        unlockCount: Number(p.unlock_count || 0),
        likeCount: Number(p.like_count || 0),
        aiType: p.ai_type,
        slug: p.slug,
        key: p.prompt_key,
        prompt_key: p.prompt_key,
        password: p.password,
        promptText: p.prompt_text,
        imgAfter: p.img_after,
        imgBefore: p.img_before,
        igLink: p.ig_link,
        imageRatio: p.image_ratio,
        galleryUrls: p.gallery_urls,
        isPremium: Boolean(p.is_premium),
        isFeatured: Boolean(p.is_featured)
      }));
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.json({ 
        prompts: mockPrompts, 
        likes: {}, 
        categories: MOCK_DATA.categories,
        isMockMode: true,
        fallbackError: liveError.message 
      });
    }
  }

  try {
    let promptsRows;
    try {
      promptsRows = await db`SELECT id, prompt_key, title, ai_type, prompt_text, img_after, img_before, is_premium, is_featured, image_ratio, hide_prompt_box, password, ig_link, is_image_slider, sort_order, slug, copy_count, unlock_count, like_count, view_count, gallery_urls, meta_title, is_draft, publish_date FROM prompts WHERE is_draft = 0 AND (publish_date IS NULL OR publish_date <= NOW()) ORDER BY sort_order ASC, prompt_key ASC`;
    } catch (colErr) {
      if (colErr.message.includes('Unknown column')) {
        promptsRows = await db`SELECT * FROM prompts ORDER BY sort_order ASC, prompt_key ASC`;
      } else {
        throw colErr;
      }
    }
    const categoriesRows = await db`SELECT * FROM categories ORDER BY name ASC`;

    const parseDbBool = (val) => {
      if (val === null || val === undefined) return false;
      if (Buffer.isBuffer(val)) return val[0] === 1;
      return val == 1 || val === true || val === 'true';
    };

    const prompts = promptsRows.map(row => ({
      id: row.id,
      title: row.title,
      sort_order: row.sort_order,
      isImageSlider: parseDbBool(row.is_image_slider),
      hidePromptBox: parseDbBool(row.hide_prompt_box),
      copyCount: Number(row.copy_count),
      unlockCount: Number(row.unlock_count),
      likeCount: Number(row.like_count),
      viewCount: Number(row.view_count),
      aiType: row.ai_type,
      slug: row.slug,
      key: row.prompt_key,
      prompt_key: row.prompt_key,
      password: row.password,
      promptText: row.prompt_text,
      imgAfter: row.img_after,
      imgBefore: row.img_before,
      igLink: row.ig_link,
      imageRatio: row.image_ratio,
      galleryUrls: row.gallery_urls,
      isPremium: parseDbBool(row.is_premium),
      isFeatured: parseDbBool(row.is_featured),
      metaTitle: row.meta_title,
      is_draft: parseDbBool(row.is_draft),
      publish_date: row.publish_date
    }));

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    res.json({ prompts, likes: {}, categories: categoriesRows });
  } catch (error) {
    console.error('DATABASE ERROR:', error.message);
    if (!isLiveServer && process.env.NODE_ENV !== 'production') {
      lastDbFailure = Date.now();
      await fetchLiveData();
    } else {
      res.json({
        prompts: MOCK_DATA.prompts,
        likes: {},
        categories: MOCK_DATA.categories
      });
    }
  }
});

// --- BLOGS (Public) ---
router.get('/blogs', async (req, res) => {
  const isLiveServer = req.headers.host && (req.headers.host.includes('promptking.in') || req.headers.host.includes('onrender.com'));
  if (!isDbHealthy()) {
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    return fetchLiveBlogs();
  }
  
  async function fetchLiveBlogs() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/blogs');
      res.json(await liveRes.json());
    } catch (liveError) {
      res.status(500).json({ error: "Failed to fetch blogs from live API" });
    }
  }

  try {
    let rows;
    try {
      rows = await db`SELECT b.id, b.slug, b.title, b.featured_image, b.featured_image_alt, b.excerpt, SUBSTRING(b.content, 1, 300) AS content_fallback, b.status, b.published_at, b.read_time, b.created_at, a.name AS author_name, a.image AS author_image FROM blogs b LEFT JOIN authors a ON b.author_id = a.id WHERE b.status = 'published' OR b.status IS NULL ORDER BY b.created_at DESC`;
    } catch (colErr) {
      if (colErr.message.includes('Unknown column')) {
        rows = await db`SELECT b.*, a.name AS author_name, a.image AS author_image FROM blogs b LEFT JOIN authors a ON b.author_id = a.id ORDER BY b.created_at DESC`;
      } else {
        throw colErr;
      }
    }
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(rows);
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE BLOGS:', error.message);
    lastDbFailure = Date.now();
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    await fetchLiveBlogs();
  }
});

router.get('/blog/:slug', async (req, res) => {
  const isLiveServer = req.headers.host && (req.headers.host.includes('promptking.in') || req.headers.host.includes('onrender.com'));
  if (!isDbHealthy()) {
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    return fetchLiveBlog();
  }
  
  async function fetchLiveBlog() {
    try {
      const liveRes = await fetch(`https://api.promptking.in/api/blog/${req.params.slug}`);
      res.json(await liveRes.json());
    } catch (liveError) {
      res.status(500).json({ error: "Failed to fetch blog from live API" });
    }
  }

  try {
    const rows = await db`SELECT b.*, a.name AS author_name, a.image AS author_image FROM blogs b LEFT JOIN authors a ON b.author_id = a.id WHERE b.slug = ${req.params.slug}`;
    if (rows.length === 0) return res.status(404).json({ error: "Blog not found" });
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(rows[0]);
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE BLOG:', error.message);
    lastDbFailure = Date.now();
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    await fetchLiveBlog();
  }
});

// --- FAQS (Public) ---
router.get('/faqs', async (req, res) => {
  const isLiveServer = req.headers.host && (req.headers.host.includes('promptking.in') || req.headers.host.includes('onrender.com'));
  if (!isDbHealthy()) {
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    return fetchLiveFaqs();
  }

  async function fetchLiveFaqs() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/faqs');
      res.json(await liveRes.json());
    } catch (liveError) {
      res.status(500).json({ error: "Failed to fetch FAQs from live API" });
    }
  }

  try {
    const rows = await db`SELECT * FROM faqs ORDER BY created_at DESC`;
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(rows);
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE FAQS:', error.message);
    lastDbFailure = Date.now();
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    await fetchLiveFaqs();
  }
});

// --- CATEGORIES (Public) ---
router.get('/categories', async (req, res) => {
  const isLiveServer = req.headers.host && (req.headers.host.includes('promptking.in') || req.headers.host.includes('onrender.com'));
  if (!isDbHealthy()) {
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    return fetchLiveCategories();
  }

  async function fetchLiveCategories() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/categories');
      res.json(await liveRes.json());
    } catch (liveError) {
      res.json(MOCK_DATA.categories);
    }
  }

  try {
    const rows = await db`SELECT * FROM categories ORDER BY name ASC`;
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(rows);
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE CATEGORIES:', error.message);
    lastDbFailure = Date.now();
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    await fetchLiveCategories();
  }
});

// --- SINGLE CATEGORY & PROMPTS (Public) ---
router.get('/category/:slug', async (req, res) => {
  try {
    const categories = await db`SELECT * FROM categories WHERE slug = ${req.params.slug}`;
    if (categories.length === 0) return res.status(404).json({ error: "Category not found" });
    const category = categories[0];

    // Increment view count
    await db`UPDATE categories SET view_count = view_count + 1 WHERE id = ${category.id}`;

    // Fetch prompts for this category
    const prompts = await db`
      SELECT 
        prompt_key, slug, title, category_id, sub_prompts, thumbnail_url,
        description, ai_type, prompt_text, img_before, img_after, ig_link, is_image_slider, image_ratio,
        is_premium, gallery_urls, is_featured, is_draft, publish_date, view_count, copy_count, unlock_count, like_count
      FROM prompts 
      WHERE category_id = ${category.id} AND is_draft = 0 AND (publish_date IS NULL OR publish_date <= NOW())
      ORDER BY is_featured DESC, view_count DESC, created_at DESC
    `;

    res.json({ category, prompts });
  } catch (error) {
    console.error('Fetch category error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/prompt/:key', async (req, res) => {
  const { key } = req.params;
  const isLiveServer = req.headers.host && (req.headers.host.includes('promptking.in') || req.headers.host.includes('onrender.com'));

  if (!isDbHealthy()) {
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    return fetchLivePrompt();
  }

  async function fetchLivePrompt() {
    try {
      const liveRes = await fetch(`https://api.promptking.in/api/prompt/${key}`);
      if (!liveRes.ok) return res.status(404).json({ error: "Prompt not found on live API" });
      res.json(await liveRes.json());
    } catch (liveError) {
      res.status(500).json({ error: "Failed to fetch prompt from live API" });
    }
  }

  try {
    const rows = await db`
      SELECT * FROM prompts 
      WHERE prompt_key = ${key} OR (slug = ${key} AND slug IS NOT NULL AND slug != '')
    `;
    if (rows.length === 0) return res.status(404).json({ error: "Prompt not found" });

    const row = rows[0];
    const parseDbBool = (val) => {
      if (val === null || val === undefined) return false;
      if (Buffer.isBuffer(val)) return val[0] === 1;
      return val == 1 || val === true || val === 'true';
    };
    const prompt = {
      ...row,
      isImageSlider: parseDbBool(row.is_image_slider),
      hidePromptBox: parseDbBool(row.hide_prompt_box),
      copyCount: Number(row.copy_count),
      unlockCount: Number(row.unlock_count),
      likeCount: Number(row.like_count),
      viewCount: Number(row.view_count),
      aiType: row.ai_type,
      slug: row.slug,
      key: row.prompt_key,
      prompt_key: row.prompt_key,
      password: row.password,
      promptText: row.prompt_text,
      imgAfter: row.img_after,
      imgBefore: row.img_before,
      igLink: row.ig_link,
      imageRatio: row.image_ratio,
      galleryUrls: row.gallery_urls,
      isPremium: parseDbBool(row.is_premium),
      isFeatured: parseDbBool(row.is_featured),
      metaTitle: row.meta_title
    };
    res.json(prompt);
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE PROMPT:', error.message);
    lastDbFailure = Date.now();
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    await fetchLivePrompt();
  }
});

// --- SITE SETTINGS (Public) ---
const processSettings = (data) => {
  data = Object.assign({}, data, localSettingsCache);
  
  ['logo_url', 'favicon_url'].forEach(key => {
    if (data[key] && data[key].startsWith('/')) {
      data[key] = `https://api.promptking.in${data[key]}`;
    }
  });
  
  ['logo_height_desktop', 'logo_height_mobile', 'logo_width_desktop', 'logo_width_mobile'].forEach(key => {
    if (data[key] && !data[key].toString().includes('px') && !data[key].toString().includes('%') && !data[key].toString().includes('auto') && !isNaN(data[key])) {
      data[key] = `${data[key]}px`;
    }
  });
  
  return data;
};

router.get('/settings', async (req, res) => {
  const isLiveServer = req.headers.host && (req.headers.host.includes('promptking.in') || req.headers.host.includes('onrender.com'));
  if (!isDbHealthy()) {
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    return fetchLiveSettings();
  }
  try {
    const rows = await db`SELECT * FROM site_settings`;
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json(processSettings(settings));
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE SETTINGS:', error.message);
    lastDbFailure = Date.now();
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    await fetchLiveSettings();
  }

  async function fetchLiveSettings() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/settings');
      let data = await liveRes.json();
      
      res.json(processSettings(data));
    } catch (liveError) {
      res.json(processSettings(MOCK_DATA.settings));
    }
  }
});

// --- 3. LIKES (REMOVED) ---
// Like functionality was removed from the public interface.


// --- 4. RECORD COPY ---
router.post('/record_copy', async (req, res) => {
  const { key } = req.body;
  try {
    await db`UPDATE prompts SET copy_count = copy_count + 1 WHERE prompt_key = ${key}`;
    try {
      await db`INSERT INTO analytics_events (prompt_key, event_type) VALUES (${key}, 'copy')`;
    } catch(err) { console.warn('Analytics logging failed:', err.message); }
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record copy" });
  }
});

// --- 5. RECORD UNLOCK ---
router.post('/record_unlock', async (req, res) => {
  const { key } = req.body;
  try {
    await db`UPDATE prompts SET unlock_count = unlock_count + 1 WHERE prompt_key = ${key}`;
    try {
      await db`INSERT INTO analytics_events (prompt_key, event_type) VALUES (${key}, 'unlock')`;
    } catch(err) { console.warn('Analytics logging failed:', err.message); }
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record unlock" });
  }
});

// --- 5.1 RECORD VIEW ---
router.post('/record_view', async (req, res) => {
  const { key } = req.body;
  try {
    try {
      // Ignore if column doesn't exist yet for backwards compatibility
      await db`UPDATE prompts SET view_count = view_count + 1 WHERE prompt_key = ${key}`;
    } catch(e) {}
    try {
      await db`INSERT INTO analytics_events (prompt_key, event_type) VALUES (${key}, 'view')`;
    } catch(err) { console.warn('Analytics logging failed:', err.message); }
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record view" });
  }
});

// --- 5.2 RECORD LIKE ---
router.post('/record_like', async (req, res) => {
  const { key } = req.body;
  try {
    try {
      await db`UPDATE prompts SET like_count = like_count + 1 WHERE prompt_key = ${key}`;
    } catch(e) {}
    try {
      await db`INSERT INTO analytics_events (prompt_key, event_type) VALUES (${key}, 'like')`;
    } catch(err) { console.warn('Analytics logging failed:', err.message); }
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record like" });
  }
});

// --- BLOG ANALYTICS ---
router.post('/record_blog_view', async (req, res) => {
  const { slug } = req.body;
  try {
    try {
      await db`UPDATE blogs SET view_count = view_count + 1 WHERE slug = ${slug}`;
    } catch(e) {}
    try {
      await db`INSERT INTO analytics_events (prompt_key, event_type) VALUES (${'blog_' + slug}, 'view')`;
    } catch(err) {}
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: "Failed to record blog view" });
  }
});


// --- ADMIN ANALYTICS MOVED BELOW ADMINAUTH ---
// --- 5. USER PROFILE (REMOVED) ---
// User profile management was removed.


// --- 7. ADMIN ENDPOINTS (Restricted) ---

// State for Session Tokens and Rate Limiting
const validAdminTokens = new Set();
const loginAttempts = new Map(); // IP -> { count, timestamp }

// Rate Limit logic: 5 fails per 15 minutes
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; 

const adminAuth = (req, res, next) => {
  const tokenHeader = req.headers['x-admin-token'];

  if (req.session.isAdmin || (tokenHeader && validAdminTokens.has(tokenHeader))) {
    return next();
  }

  console.warn(`[AdminAuth] Rejected SECURE request from IP ${req.ip || 'Unknown'}. Token Provided: ${!!tokenHeader}`);
  res.status(401).json({ error: "Admin access required" });
};

router.get('/admin/check_auth', (req, res) => {
  const tokenHeader = req.headers['x-admin-token'];
  res.json({ isAdmin: !!(req.session.isAdmin || (tokenHeader && validAdminTokens.has(tokenHeader))) });
});

// --- ADMIN ANALYTICS ---
router.get('/admin/analytics', adminAuth, async (req, res) => {
  const daysStr = req.query.days || '30';
  try {
    let rows;
    if (daysStr === 'all') {
      rows = await db`SELECT DATE(created_at) as date, event_type, COUNT(*) as count FROM analytics_events WHERE prompt_key NOT LIKE 'blog_%' GROUP BY DATE(created_at), event_type ORDER BY date ASC`;
    } else {
      const days = parseInt(daysStr, 10);
      rows = await db`SELECT DATE(created_at) as date, event_type, COUNT(*) as count FROM analytics_events WHERE created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY) AND prompt_key NOT LIKE 'blog_%' GROUP BY DATE(created_at), event_type ORDER BY date ASC`;
    }
    const dataMap = {};
    rows.forEach(r => {
      let dateStr = r.date;
      if (typeof r.date === 'object' && r.date !== null) {
        const offset = r.date.getTimezoneOffset() * 60000;
        dateStr = (new Date(r.date - offset)).toISOString().split('T')[0];
      } else if (typeof r.date === 'string') {
        dateStr = r.date.split('T')[0];
      }
      if (!dataMap[dateStr]) dataMap[dateStr] = { date: dateStr, copy: 0, unlock: 0, view: 0 };
      if (r.event_type !== 'like') {
        dataMap[dateStr][r.event_type] = Number(r.count);
      }
    });
    const formattedData = Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
    res.json(formattedData);
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// --- ADMIN PROMPT-LEVEL ANALYTICS ---
router.get('/admin/analytics/prompts', adminAuth, async (req, res) => {
  try {
    const promptsData = await db`SELECT prompt_key, title, view_count, copy_count, unlock_count FROM prompts`;
    
    const finalData = promptsData.map(p => ({
      prompt_key: p.prompt_key,
      title: p.title || p.prompt_key,
      views: Number(p.view_count) || 0,
      copies: Number(p.copy_count) || 0,
      unlocks: Number(p.unlock_count) || 0
    }));
    
    res.json(finalData);
  } catch (err) {
    console.error('Analytics Prompts Error:', err);
    res.status(500).json({ error: "Failed to fetch prompt analytics" });
  }
});
// --- ADMIN BLOG-LEVEL ANALYTICS ---
router.get('/admin/analytics/blogs', adminAuth, async (req, res) => {
  try {
    let blogsData = [];
    try {
      blogsData = await db`SELECT slug, title, view_count FROM blogs`;
    } catch(e) {
      // In case columns are not yet created
      blogsData = await db`SELECT slug, title FROM blogs`;
    }
    
    const finalData = blogsData.map(b => ({
      slug: b.slug,
      title: b.title || b.slug,
      views: Number(b.view_count) || 0
    }));
    
    res.json(finalData);
  } catch (err) {
    console.error('Analytics Blogs Error:', err);
    res.status(500).json({ error: "Failed to fetch blog analytics" });
  }
});

// --- ADMIN ANALYTICS RESET ---
router.post('/admin/analytics/reset', adminAuth, async (req, res) => {
  try {
    // Only clear the overview events graph, do not reset lifetime counts on prompts/blogs
    await db`DELETE FROM analytics_events`;
    res.json({ status: "success" });
  } catch (error) {
    console.error('Analytics Reset Error:', error);
    res.status(500).json({ error: "Failed to reset analytics" });
  }
});

router.post('/admin/login', (req, res) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Check Rate Limit
  const attempt = loginAttempts.get(ip);
  if (attempt) {
    if (Date.now() - attempt.timestamp > LOCKOUT_MS) {
      loginAttempts.delete(ip); // lock expired
    } else if (attempt.count >= MAX_ATTEMPTS) {
      return res.status(429).json({ error: "Too many failed attempts. Security lock engaged. Try again in 15 minutes." });
    }
  }

  const { password } = req.body;
  if (password === (process.env.ADMIN_PASSWORD || 'admin')) {
    // Reset attempts on success
    loginAttempts.delete(ip);
    
    // Issue secure session token
    const token = crypto.randomUUID();
    validAdminTokens.add(token);
    
    req.session.isAdmin = true;
    res.json({ status: "success", token });
  } else {
    // Record Failure
    const currentCount = attempt ? attempt.count : 0;
    loginAttempts.set(ip, { count: currentCount + 1, timestamp: Date.now() });
    
    res.status(401).json({ error: "Invalid PIN" });
  }
});


// Admin Settings
router.get('/admin/settings', adminAuth, async (req, res) => {
  try {
    const rows = await db`SELECT * FROM site_settings`;
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    
    // Merge with memory cache
    res.json(Object.assign({}, settings, localSettingsCache));
  } catch (error) {
    // If DB fails, return Live settings merged with local overrides
    try {
      const liveRes = await fetch('https://api.promptking.in/api/settings');
      let data = await liveRes.json();
      res.json(Object.assign({}, data, localSettingsCache));
    } catch (e) {
      res.json(Object.assign({}, MOCK_DATA.settings, localSettingsCache));
    }
  }
});

router.post('/admin/save_settings', adminAuth, async (req, res) => {
  const settings = req.body;
  // Update memory cache
  Object.assign(localSettingsCache, settings);

  try {
    for (const [key, value] of Object.entries(settings)) {
      await db`
        INSERT INTO site_settings (setting_key, setting_value) 
        VALUES (${key}, ${value}) 
        ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
      `;
    }
    res.json({ status: "success" });
  } catch (error) {
    console.warn('ADMIN SAVE SETTINGS: DB FAILED, BUT PERSISTED TO MEMORY:', error.message);
    lastDbFailure = Date.now();
    res.json({ status: "success", warning: "Database unreachable, settings persisted to memory only." });
  }
});

router.post('/admin/upload_logo', adminAuth, logoUpload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  let logoUrl;
  try {
    const ext = path.extname(req.file.originalname).toLowerCase();
    const isSvg = ext === '.svg';
    let bufferToUpload = req.file.buffer;
    
    if (!isSvg) {
      bufferToUpload = await sharp(req.file.buffer).webp({ quality: 85 }).toBuffer();
    }
    
    const result = await uploadToCloudinary(bufferToUpload, {
      folder: 'promptking/logos',
      resource_type: 'image'
    });
    logoUrl = result.secure_url;
  } catch (error) {
    console.error('Cloudinary Logo Upload Error:', error);
    return res.status(500).json({ error: "Logo upload failed" });
  }
  
  // Update memory cache
  localSettingsCache.logo_url = logoUrl;

  try {
    await db`
      INSERT INTO site_settings (setting_key, setting_value) 
      VALUES ('logo_url', ${logoUrl}) 
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `;
    res.json({ status: "success", logoUrl });
  } catch (error) {
    console.warn('ADMIN UPLOAD LOGO: DB FAILED, BUT PERSISTED TO MEMORY:', error.message);
    lastDbFailure = Date.now();
    res.json({ status: "success", logoUrl, warning: "Database unreachable, selection persisted to memory only." });
  }
});

router.post('/admin/upload_image', adminAuth, logoUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  try {
    const bufferToUpload = await sharp(req.file.buffer).webp({ quality: 80 }).toBuffer();
    const result = await uploadToCloudinary(bufferToUpload, {
      folder: 'promptking/images',
      resource_type: 'image'
    });
    
    const imageUrl = result.secure_url;
    // No DB persistence required for general image upload (usually for prompt editors)
    res.json({ status: "success", imageUrl });
  } catch (error) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

router.post('/admin/upload_image_url', adminAuth, async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "No URL provided" });
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch image");
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const bufferToUpload = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    const result = await uploadToCloudinary(bufferToUpload, {
      folder: 'promptking/images',
      resource_type: 'image'
    });
    
    res.json({ status: "success", imageUrl: result.secure_url });
  } catch (error) {
    console.error('Cloudinary Upload from URL Error:', error);
    res.status(500).json({ error: "Failed to upload image from URL" });
  }
});

router.get('/admin/logout', (req, res) => {
  const tokenHeader = req.headers['x-admin-token'];
  if (tokenHeader) validAdminTokens.delete(tokenHeader);
  req.session.isAdmin = false;
  res.json({ status: "success" });
});

router.get('/admin/prompts', adminAuth, async (req, res) => {
  if (!isDbHealthy()) return fetchLiveAdminPrompts();

  async function fetchLiveAdminPrompts() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/get_data');
      if (!liveRes.ok) throw new Error("Live API failed");
      const result = await liveRes.json();
      const data = result.prompts || [];
      const mapped = data.map(p => ({
        ...p,
        isFeatured: p.isFeatured !== undefined ? p.isFeatured : (p.prompt_key === 'PK001' || p.prompt_key === 'PK004' ? true : false),
        is_featured: p.is_featured !== undefined ? p.is_featured : (p.prompt_key === 'PK001' || p.prompt_key === 'PK004' ? 1 : 0)
      }));
      res.json(mapped);
    } catch (e) {
      // Last-ditch mock data for UI safety
      res.json(MOCK_DATA.prompts.map(p => ({
        ...p,
        copy_count: Number(p.copy_count || 0),
        unlock_count: Number(p.unlock_count || 0),
        like_count: Number(p.like_count || p.likeCount || 0),
        view_count: Number(p.view_count || p.viewCount || 0),
      })));
    }
  }

  try {
    let rows;
    try {
      rows = await db`SELECT * FROM prompts ORDER BY sort_order ASC, prompt_key ASC`;
    } catch (colErr) {
      if (colErr.message.includes('Unknown column')) {
        rows = await db`SELECT * FROM prompts`;
      } else {
        throw colErr;
      }
    }
    const formatted = rows.map(r => ({
      ...r,
      copy_count: Number(r.copy_count || 0),
      unlock_count: Number(r.unlock_count || 0),
      like_count: Number(r.like_count || 0),
      view_count: Number(r.view_count || 0),
      correct_attempts: Number(r.correct_attempts || 0),
      wrong_attempts: Number(r.wrong_attempts || 0),
      is_featured: r.is_featured == 1 || r.is_featured === true || r.is_featured === 'true',
      is_premium: r.is_premium == 1 || r.is_premium === true || r.is_premium === 'true',
      hide_prompt_box: r.hide_prompt_box == 1 || r.hide_prompt_box === true || r.hide_prompt_box === 'true',
      is_draft: r.is_draft == 1 || r.is_draft === true || r.is_draft === 'true',
      publish_date: r.publish_date,
      metaTitle: r.meta_title
    }));
    res.json(formatted);
  } catch (error) {
    console.error('ADMIN PROMPTS DB ERROR:', error.message);
    const isLiveServer = req.headers.host && req.headers.host.includes('promptking.in');
    if (!isLiveServer && process.env.NODE_ENV !== 'production') {
      lastDbFailure = Date.now();
      await fetchLiveAdminPrompts();
    } else {
      res.json(MOCK_DATA.prompts.map(p => ({
        ...p,
        copy_count: Number(p.copy_count || 0),
        unlock_count: Number(p.unlock_count || 0),
        like_count: Number(p.like_count || 0),
      })));
    }
  }
});

// --- REORDER PROMPTS ---
router.post('/admin/reorder_prompts', adminAuth, async (req, res) => {
  const { orderedKeys } = req.body;
  if (!Array.isArray(orderedKeys) || orderedKeys.length === 0) {
    return res.status(400).json({ error: 'orderedKeys array is required' });
  }
  try {
    const updates = orderedKeys.map((key, index) =>
      db`UPDATE prompts SET sort_order = ${index} WHERE prompt_key = ${key}`
    );
    await Promise.all(updates);
    res.json({ status: 'ok', updated: orderedKeys.length });
  } catch (error) {
    console.error('Reorder error:', error);
    res.status(500).json({ error: 'Failed to save order' });
  }
});

const pingGoogleSitemap = () => {
  try {
    if (typeof fetch !== 'undefined') {
      fetch('http://www.google.com/ping?sitemap=https://promptking.in/api/sitemap.xml')
        .then(r => console.log('Pinged Google Sitemap:', r.status))
        .catch(e => console.error('Failed to ping Google:', e.message));
    }
  } catch (e) {
    console.error('Fetch error:', e);
  }
};

router.get('/admin/run_schema_update', async (req, res) => {
  const columnsToAdd = [
    "ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255)",
    "ADD COLUMN IF NOT EXISTS meta_description TEXT",
    "ADD COLUMN IF NOT EXISTS focus_keyword VARCHAR(255)",
    "ADD COLUMN IF NOT EXISTS canonical_url VARCHAR(255)",
    "ADD COLUMN IF NOT EXISTS og_title VARCHAR(255)",
    "ADD COLUMN IF NOT EXISTS og_description TEXT",
    "ADD COLUMN IF NOT EXISTS og_image VARCHAR(255)",
    "ADD COLUMN IF NOT EXISTS twitter_title VARCHAR(255)",
    "ADD COLUMN IF NOT EXISTS twitter_description TEXT",
    "ADD COLUMN IF NOT EXISTS twitter_image VARCHAR(255)",
    "ADD COLUMN IF NOT EXISTS faqs JSON",
    "ADD COLUMN IF NOT EXISTS tags TEXT",
    "ADD COLUMN IF NOT EXISTS gallery_urls JSON",
    "ADD COLUMN IF NOT EXISTS hide_prompt_box BOOLEAN DEFAULT FALSE",
    "ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE",
    "ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE",
    "ADD COLUMN IF NOT EXISTS publish_date DATETIME"
  ];

  let results = [];
  for (const col of columnsToAdd) {
    try {
      await db([`ALTER TABLE prompts ${col}`]);
      results.push(`Executed: ${col}`);
    } catch (err) {
      results.push(`Note on ${col}: ${err.message}`);
    }
  }
  
  res.json({ status: "success", logs: results });
});

router.post('/admin/save_prompt', adminAuth, async (req, res) => {
  const p = req.body;
  const originalKey = p.originalKey;
  let newKey = p.prompt_key?.trim();

  try {
    // Format validation (only for manually set keys)
    if (newKey) {
      if (!/^PK[0-9]+$/.test(newKey)) {
        return res.status(400).json({ error: "Invalid ID format. Must start with 'PK' followed by numbers only (e.g. PK001)." });
      }
    }

    // Uniqueness check
    if (newKey) {
      const existing = await db`SELECT prompt_key FROM prompts WHERE prompt_key = ${newKey}`;
      if (existing.length > 0) {
        if (originalKey && originalKey === newKey) {
          // Editing same prompt — key unchanged, that's fine
        } else if (originalKey) {
          // Editing prompt and trying to change to a key that's taken
          return res.status(400).json({ error: "Choose a different ID. This ID is already taken and must be unique." });
        } else {
          // New prompt: auto-generated key already exists — generate a new unique one
          let attempts = 0;
          do {
            newKey = 'PK' + Math.floor(1000 + Math.random() * 9000);
            const check = await db`SELECT prompt_key FROM prompts WHERE prompt_key = ${newKey}`;
            if (check.length === 0) break;
            attempts++;
          } while (attempts < 10);
        }
      }
    }

    // Unique Slug Generation
    let finalSlug = p.slug?.trim();
    if (!finalSlug) {
      finalSlug = await generateUniqueSlug(p.title, originalKey);
    } else {
      finalSlug = await generateUniqueSlug(finalSlug, originalKey);
    }

    let finalKey = newKey;
    if (originalKey) {
      finalKey = newKey || originalKey;
      const stringifyJson = (val) => val ? JSON.stringify(val) : null;
      await db`
        UPDATE prompts SET 
          prompt_key = ${finalKey}, 
          slug = ${finalSlug}, 
          title = ${p.title}, 
          category_id = ${p.category_id || null},
          sub_prompts = ${stringifyJson(p.sub_prompts)},
          thumbnail_url = ${p.thumbnail_url || null},
          meta_title = ${p.meta_title || ''},
          meta_description = ${p.meta_description || null},
          focus_keyword = ${p.focus_keyword || null},
          canonical_url = ${p.canonical_url || null},
          og_title = ${p.og_title || null},
          og_description = ${p.og_description || null},
          og_image = ${p.og_image || null},
          twitter_title = ${p.twitter_title || null},
          twitter_description = ${p.twitter_description || null},
          twitter_image = ${p.twitter_image || null},
          faqs = ${stringifyJson(p.faqs)},
          tags = ${p.tags || null},
          description = ${p.description}, 
          ai_type = ${p.ai_type}, 
          prompt_text = ${p.prompt_text}, 
          img_before = ${p.img_before}, 
          img_after = ${p.img_after}, 
          ig_link = ${p.ig_link}, 
          is_image_slider = ${p.is_image_slider ? 1 : 0}, 
          image_ratio = ${p.image_ratio}, 
          password = ${p.password}, 
          is_premium = ${p.is_premium ? 1 : 0},
          gallery_urls = ${p.gallery_urls || null},
          hide_prompt_box = ${p.hide_prompt_box ? 1 : 0},
          is_featured = ${p.is_featured ? 1 : 0},
          is_draft = ${p.is_draft ? 1 : 0},
          publish_date = ${p.publish_date || null}
        WHERE prompt_key = ${originalKey}
      `;
    } else {
      finalKey = newKey || ('PK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100));
      const sJson = (val) => val ? JSON.stringify(val) : null;
      await db`
        INSERT INTO prompts (
          prompt_key, slug, title, category_id, sub_prompts, thumbnail_url, meta_title, meta_description, focus_keyword, canonical_url,
          og_title, og_description, og_image, twitter_title, twitter_description, twitter_image,
          faqs, tags,
          description, ai_type, prompt_text, img_before, img_after, 
          ig_link, is_image_slider, image_ratio, password, is_premium, gallery_urls, hide_prompt_box, is_featured, is_draft, publish_date
        ) VALUES (
          ${finalKey}, ${finalSlug}, ${p.title}, ${p.category_id || null}, ${sJson(p.sub_prompts)}, ${p.thumbnail_url || null}, ${p.meta_title || ''}, ${p.meta_description || null}, ${p.focus_keyword || null}, ${p.canonical_url || null},
          ${p.og_title || null}, ${p.og_description || null}, ${p.og_image || null}, ${p.twitter_title || null}, ${p.twitter_description || null}, ${p.twitter_image || null},
          ${sJson(p.faqs)}, ${p.tags || null},
          ${p.description}, ${p.ai_type}, ${p.prompt_text}, 
          ${p.img_before}, ${p.img_after}, ${p.ig_link}, ${p.is_image_slider ? 1 : 0}, 
          ${p.image_ratio}, ${p.password}, ${p.is_premium ? 1 : 0}, ${p.gallery_urls || null}, ${p.hide_prompt_box ? 1 : 0}, ${p.is_featured ? 1 : 0}, ${p.is_draft ? 1 : 0}, ${p.publish_date || null}
        )
      `;
    }
    pingGoogleSitemap();
    logAdminAction(originalKey ? "Updated Prompt" : "Created Prompt", { key: finalKey, title: p.title });
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || "Save failed" });
  }
});

router.delete('/admin/delete_prompt/:key', adminAuth, async (req, res) => {
  const { key } = req.params;
  try {
    console.log(`[Admin] Single delete request for prompt: ${key}`);
    await db`DELETE FROM prompts WHERE prompt_key = ${key}`;
    res.json({ status: "success" });
  } catch (error) {
    console.error(`[Admin] Single delete FAILED for ${key}:`, error);
    res.status(500).json({ error: "Delete failed" });
  }
});

router.post('/admin/delete_prompts_bulk', adminAuth, async (req, res) => {
  const { keys } = req.body;
  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ error: "No keys provided for bulk delete" });
  }

  try {
    console.log(`[Admin] Bulk delete request for ${keys.length} prompts`);
    // Note: With the new db.js update, we just pass the array and it handles IN (...)
    await db`DELETE FROM prompts WHERE prompt_key IN ${keys}`;
    res.json({ status: "success", count: keys.length });
  } catch (error) {
    console.error("[Admin] Bulk delete FAILED:", error);
    res.status(500).json({ error: "Bulk delete failed" });
  }
});

router.post('/admin/hide_prompts_bulk', adminAuth, async (req, res) => {
  const { keys, hide } = req.body;
  if (!Array.isArray(keys) || keys.length === 0) {
    return res.status(400).json({ error: "No keys provided for bulk hide/show" });
  }

  // Update mock data for fallback
  MOCK_DATA.prompts.forEach(p => {
    if (keys.includes(p.prompt_key)) {
      p.hide_prompt_box = hide ? 1 : 0;
    }
  });

  try {
    const hideValue = hide ? 1 : 0;
    await db`UPDATE prompts SET hide_prompt_box = ${hideValue} WHERE prompt_key IN ${keys}`;
    res.json({ status: "success", count: keys.length });
  } catch (error) {
    console.warn("[Admin] Bulk hide/show DB FAILED, applied to mock data:", error.message);
    lastDbFailure = Date.now();
    res.json({ status: "success", count: keys.length, warning: "DB unreachable, applied to mock data" });
  }
});

// --- TOGGLE FEATURED ---
router.post('/admin/toggle_featured', adminAuth, async (req, res) => {
  const { key, is_featured } = req.body;
  if (!key) return res.status(400).json({ error: 'key is required' });
  try {
    const featuredValue = is_featured ? 1 : 0;
    await db`UPDATE prompts SET is_featured = ${featuredValue} WHERE prompt_key = ${key}`;
    res.json({ status: 'success', key, is_featured: !!is_featured });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Failed to toggle featured status' });
  }
});

// Admin Blog CRUD
router.get('/admin/blogs', adminAuth, async (req, res) => {
  if (!isDbHealthy()) return fetchLiveAdminBlogs();

  async function fetchLiveAdminBlogs() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/blogs');
      if (!liveRes.ok) throw new Error("Live API failed");
      res.json(await liveRes.json());
    } catch (e) { res.json([]); }
  }

  try {
    const rows = await db`SELECT b.*, a.name AS author_name, a.image AS author_image, a.description AS author_description FROM blogs b LEFT JOIN authors a ON b.author_id = a.id ORDER BY b.created_at DESC`;
    res.json(rows);
  } catch (error) {
    console.warn('ADMIN BLOGS DB FAILED, FETCHING LIVE:', error.message);
    lastDbFailure = Date.now();
    const isLiveServer = req.headers.host && (req.headers.host.includes('promptking.in') || req.headers.host.includes('onrender.com'));
    if (isLiveServer) return res.status(500).json({ error: "Database error on live server" });
    await fetchLiveAdminBlogs();
  }
});

router.post('/admin/save_blog', adminAuth, async (req, res) => {
  const b = req.body;
  
  let finalSlug = b.slug?.trim();
  if (!finalSlug) {
    finalSlug = await generateUniqueSlug(b.title, b.id, 'blogs', 'id');
  } else {
    finalSlug = await generateUniqueSlug(finalSlug, b.id, 'blogs', 'id');
  }
  
  try {
    const stringifyJson = (val) => val ? JSON.stringify(val) : null;
    
    // Auto-fill author details if author_id is provided
    if (b.author_id) {
      const authorRows = await db`SELECT * FROM authors WHERE id = ${b.author_id}`;
      if (authorRows.length > 0) {
        b.author_name = authorRows[0].name;
        b.author_image = authorRows[0].image;
        b.author_description = authorRows[0].description;
      }
    }
    
    if (b.id) {
      await db`UPDATE blogs SET 
        title = ${b.title}, 
        slug = ${finalSlug}, 
        content = ${b.content}, 
        featured_image = ${b.featured_image},
        featured_image_alt = ${b.featured_image_alt || null},
        featured_image_caption = ${b.featured_image_caption || null},
        excerpt = ${b.excerpt || null},
        category = ${b.category || null},
        tags = ${stringifyJson(b.tags)},
        meta_title = ${b.meta_title || null},
        meta_description = ${b.meta_description || null},
        focus_keyword = ${b.focus_keyword || null},
        canonical_url = ${b.canonical_url || null},
        og_title = ${b.og_title || null},
        og_description = ${b.og_description || null},
        og_image = ${b.og_image || null},
        twitter_title = ${b.twitter_title || null},
        twitter_description = ${b.twitter_description || null},
        twitter_image = ${b.twitter_image || null},
        faqs = ${stringifyJson(b.faqs)},
        enable_table_of_contents = ${b.enable_table_of_contents !== false},
        author_name = ${b.author_name || ''},
        author_image = ${b.author_image || ''},
        author_description = ${b.author_description || ''},
        author_id = ${b.author_id || null},
        status = ${b.status || 'published'},
        published_at = ${b.published_at || null},
        read_time = ${b.read_time || null}
      WHERE id = ${b.id}`;
    } else {
      await db`INSERT INTO blogs (
        title, slug, content, featured_image,
        featured_image_alt, featured_image_caption, excerpt, category, tags,
        meta_title, meta_description, focus_keyword, canonical_url,
        og_title, og_description, og_image, twitter_title, twitter_description, twitter_image,
        faqs, enable_table_of_contents, author_name, author_image, author_description, author_id, status, published_at, read_time
      ) VALUES (
        ${b.title}, ${finalSlug}, ${b.content}, ${b.featured_image},
        ${b.featured_image_alt || null}, ${b.featured_image_caption || null}, ${b.excerpt || null}, ${b.category || null}, ${stringifyJson(b.tags)},
        ${b.meta_title || null}, ${b.meta_description || null}, ${b.focus_keyword || null}, ${b.canonical_url || null},
        ${b.og_title || null}, ${b.og_description || null}, ${b.og_image || null}, ${b.twitter_title || null}, ${b.twitter_description || null}, ${b.twitter_image || null},
        ${stringifyJson(b.faqs)}, ${b.enable_table_of_contents !== false}, ${b.author_name || ''}, ${b.author_image || ''}, ${b.author_description || ''}, ${b.author_id || null}, ${b.status || 'published'}, ${b.published_at || null}, ${b.read_time || null}
      )`;
    }
    pingGoogleSitemap();
    res.json({ status: "success" });
  } catch (error) {
    console.error("Save blog error:", error);
    res.status(500).json({ error: "Save failed: " + error.message });
  }
});

router.delete('/admin/delete_blog/:id', adminAuth, async (req, res) => {
  try {
    await db`DELETE FROM blogs WHERE id = ${req.params.id}`;
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// FAQ CRUD
router.get('/admin/faqs', adminAuth, async (req, res) => {
  if (!isDbHealthy()) return fetchLiveAdminFaqs();

  async function fetchLiveAdminFaqs() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/faqs');
      if (!liveRes.ok) throw new Error("Live API failed");
      res.json(await liveRes.json());
    } catch (e) { res.json([]); }
  }

  try {
    const rows = await db`SELECT * FROM faqs`;
    res.json(rows);
  } catch (error) {
    console.warn('ADMIN FAQS DB FAILED, FETCHING LIVE:', error.message);
    lastDbFailure = Date.now();
    await fetchLiveAdminFaqs();
  }
});

router.post('/admin/save_faq', adminAuth, async (req, res) => {
  const f = req.body;
  try {
    if (f.id) {
      await db`UPDATE faqs SET question = ${f.question}, answer = ${f.answer}, category = ${f.category} WHERE id = ${f.id}`;
    } else {
      await db`INSERT INTO faqs (question, answer, category) VALUES (${f.question}, ${f.answer}, ${f.category})`;
    }
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: "Save failed" });
  }
});

router.delete('/admin/delete_faq/:id', adminAuth, async (req, res) => {
  try {
    await db`DELETE FROM faqs WHERE id = ${req.params.id}`;
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// Admin Category CRUD
router.get('/admin/categories', adminAuth, async (req, res) => {
  if (!isDbHealthy()) return fetchLiveAdminCategories();

  async function fetchLiveAdminCategories() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/categories');
      if (!liveRes.ok) throw new Error("Live API failed");
      res.json(await liveRes.json());
    } catch (e) { res.json(MOCK_DATA.categories); }
  }

  try {
    const rows = await db`SELECT * FROM categories ORDER BY name ASC`;
    res.json(rows);
  } catch (error) {
    console.warn('ADMIN CATEGORIES DB FAILED, FETCHING LIVE:', error.message);
    lastDbFailure = Date.now();
    await fetchLiveAdminCategories();
  }
});

router.post('/admin/save_category', adminAuth, async (req, res) => {
  const c = req.body;
  const slug = c.slug || c.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  try {
    if (c.id) {
      await db`UPDATE categories SET 
        name = ${c.name}, slug = ${slug}, image_url = ${c.image_url || null}, description = ${c.description || null}, 
        tag = ${c.tag || null}, meta_title = ${c.meta_title || null}, meta_description = ${c.meta_description || null}, 
        focus_keyword = ${c.focus_keyword || null} 
        WHERE id = ${c.id}`;
    } else {
      await db`INSERT INTO categories (name, slug, image_url, description, tag, meta_title, meta_description, focus_keyword) 
        VALUES (${c.name}, ${slug}, ${c.image_url || null}, ${c.description || null}, ${c.tag || null}, ${c.meta_title || null}, ${c.meta_description || null}, ${c.focus_keyword || null})`;
    }
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: "Save failed" });
  }
});

router.delete('/admin/delete_category/:id', adminAuth, async (req, res) => {
  try {
    await db`DELETE FROM categories WHERE id = ${req.params.id}`;
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// --- DYNAMIC SITEMAP ---
router.get('/sitemap.xml', async (req, res) => {
  const baseUrl = 'https://promptking.in';
  let prompts = [];
  let blogs = [];
  let categories = [];
  
  try {
    // Attempt DB fetch if healthy
    const db = require('../db');
    prompts = await db`SELECT prompt_key, title, updated_at, created_at, img_after, img_before FROM prompts WHERE prompt_key IS NOT NULL AND is_draft = 0 AND (publish_date IS NULL OR publish_date <= NOW())`;
    blogs = await db`SELECT slug, title, updated_at, created_at, featured_image FROM blogs WHERE slug IS NOT NULL`;
    categories = await db`SELECT name, slug FROM categories ORDER BY name ASC`;
  } catch (err) {
    console.warn("Sitemap: DB failed, serving static pages only", err.message);
  }

  const escapeXml = (str) => {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };
  
  const formatDate = (d) => {
    const date = d ? new Date(d) : new Date();
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  };

  try {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;
    
    // Static Pages
    const staticPages = ['', '/blog', '/faq', '/about', '/privacy', '/terms', '/disclaimer', '/contact', '/adsense-policy'];
    staticPages.forEach(p => {
      xml += `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${p === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    });

    // Dynamic Categories
    categories.forEach(cat => {
      const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
      xml += `  <url>\n    <loc>${baseUrl}/category/${escapeXml(catSlug)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    });

    // Dynamic Prompts
    prompts.forEach(p => {
      xml += `  <url>\n    <loc>${baseUrl}/prompt/${escapeXml(p.prompt_key)}</loc>\n    <lastmod>${formatDate(p.updated_at || p.created_at)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n`;
      if (p.img_after) {
        xml += `    <image:image>\n      <image:loc>${escapeXml(p.img_after.startsWith('/') ? baseUrl + p.img_after : p.img_after)}</image:loc>\n      <image:title>${escapeXml(p.title)}</image:title>\n    </image:image>\n`;
      }
      if (p.img_before) {
        xml += `    <image:image>\n      <image:loc>${escapeXml(p.img_before.startsWith('/') ? baseUrl + p.img_before : p.img_before)}</image:loc>\n      <image:title>${escapeXml(p.title + ' (Before)')}</image:title>\n    </image:image>\n`;
      }
      xml += `  </url>\n`;
    });

    // Dynamic Blogs
    blogs.forEach(b => {
      const img = b.featured_image;
      xml += `  <url>\n    <loc>${baseUrl}/article/${escapeXml(b.slug)}</loc>\n    <lastmod>${formatDate(b.updated_at || b.created_at)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n`;
      if (img) {
        xml += `    <image:image>\n      <image:loc>${escapeXml(img.startsWith('/') ? baseUrl + img : img)}</image:loc>\n      <image:title>${escapeXml(b.title)}</image:title>\n    </image:image>\n`;
      }
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error("Sitemap XML build error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

// --- CONTACT FORM ---
router.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // First, save the message to the database as a reliable backup
  let savedToDb = false;
  try {
    await db`INSERT INTO contact_messages (name, email, message) VALUES (${name}, ${email}, ${message})`;
    savedToDb = true;
  } catch (dbErr) {
    console.error('Failed to save contact message to DB:', dbErr);
  }

  try {
    const nodemailer = require('nodemailer');
    const emailUser = process.env.EMAIL_USER || 'promptking.in@gmail.com';
    const emailPass = process.env.EMAIL_PASS;

    if (!emailPass) {
       console.warn('EMAIL_PASS not configured. Message saved to DB only.');
       return res.json({ status: "success", message: "Message saved to database. Email bypassed." });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: emailUser,
      to: emailUser,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      replyTo: email
    };

    await transporter.sendMail(mailOptions);
    res.json({ status: "success", message: "Message sent successfully" });
  } catch (error) {
    console.error('Contact Form Email Error:', error);
    if (savedToDb) {
       // If it failed to send but was saved to the DB, it's a partial success.
       // The user still "Received" the message in the backend DB.
       return res.json({ status: "success", message: "Message saved to DB, but email delivery failed" });
    }
    res.status(500).json({ error: "Failed to send message and database is unavailable" });
  }
});



// Admin Authors CRUD
router.get('/admin/authors', adminAuth, async (req, res) => {
  try {
    const rows = await db`SELECT * FROM authors ORDER BY name ASC`;
    res.json(rows);
  } catch (error) {
    console.error('ADMIN AUTHORS DB FAILED:', error.message);
    res.status(500).json({ error: "Failed to fetch authors" });
  }
});

router.post('/admin/save_author', adminAuth, async (req, res) => {
  const a = req.body;
  try {
    if (a.id) {
      await db`UPDATE authors SET name = ${a.name}, image = ${a.image}, description = ${a.description} WHERE id = ${a.id}`;
    } else {
      await db`INSERT INTO authors (name, image, description) VALUES (${a.name}, ${a.image}, ${a.description})`;
    }
    res.json({ status: "success" });
  } catch (error) {
    console.error("Save author failed", error);
    res.status(500).json({ error: "Save failed" });
  }
});

router.delete('/admin/delete_author/:id', adminAuth, async (req, res) => {
  try {
    await db`DELETE FROM authors WHERE id = ${req.params.id}`;
    res.json({ status: "success" });
  } catch (error) {
    console.error("Delete author failed", error);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;

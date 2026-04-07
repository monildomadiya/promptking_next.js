const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

let lastDbFailure = 0;
const DB_RETRY_DELAY = 10 * 60 * 1000; // 10 minutes

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
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Invalid image type"));
  }
});

// --- IMAGE OPTIMIZATION PROXY ---
router.get('/optimize', async (req, res) => {
  try {
    const src = req.query.src;
    const width = parseInt(req.query.w, 10) || 800; // default 800px width

    if (!src) {
      return res.status(400).send('Missing src parameter');
    }

    // Ensure we are only optimizing local /uploads files
    if (!src.startsWith('/uploads/')) {
      return res.redirect(src);
    }

    // Resolve absolute path safely
    const absolutePath = path.join(__dirname, '..', src);
    
    // Check if file physically exists
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).send('Image not found');
    }

    // Process image with sharp
    const optimizedBuffer = await sharp(absolutePath)
      .resize({ width: width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    res.set('Content-Type', 'image/webp');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(optimizedBuffer);
  } catch (error) {
    console.error('Image Optimization Error:', error);
    // Silent fallback to original image if optimization fails
    res.redirect(req.query.src);
  }
});


// --- 1. AUTHENTICATION ---
router.post('/login', async (req, res) => {
  const { uid, name, email, picture } = req.body;
  try {
    await db`
      INSERT INTO users (id, name, email, avatar_url) 
      VALUES (${uid}, ${name}, ${email}, ${picture})
      ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        avatar_url = CASE 
          WHEN users.avatar_url IS NULL OR users.avatar_url = '' THEN VALUES(avatar_url) 
          ELSE users.avatar_url 
        END
    `;
    req.session.userId = uid;
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to login" });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ status: "success" });
});

// --- 2. FETCH PROMPTS & LIKES ---
router.get('/get_data', async (req, res) => {
  const uid = req.headers['x-user-id'] || req.session.userId || null;
  
  if (!isDbHealthy()) {
    console.log('Skipping DB query (Circuit Breaker active), fetching Live Data...');
    return fetchLiveData();
  }

  async function fetchLiveData() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/get_data');
      if (!liveRes.ok) throw new Error(`Live API responded with ${liveRes.status}`);
      const data = await liveRes.json();
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
        isPremium: Boolean(p.is_premium)
      }));
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
    const promptsRows = await db`SELECT * FROM prompts`;
    const categoriesRows = await db`SELECT * FROM categories ORDER BY name ASC`;

    const prompts = promptsRows.map(row => ({
      ...row,
      isImageSlider: Boolean(row.is_image_slider),
      hidePromptBox: Boolean(row.hide_prompt_box),
      copyCount: Number(row.copy_count),
      unlockCount: Number(row.unlock_count),
      likeCount: Number(row.like_count),
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
      isPremium: Boolean(row.is_premium)
    }));

    let likes = {};
    if (uid) {
      const likeRows = await db`SELECT prompt_key FROM user_likes WHERE user_id = ${uid}`;
      likeRows.forEach(l => likes[l.prompt_key] = true);
    }
    res.json({ prompts, likes, categories: categoriesRows });
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE DATA FROM PRODUCTION API:', error.message);
    lastDbFailure = Date.now();
    await fetchLiveData();
  }
});

// --- BLOGS (Public) ---
router.get('/blogs', async (req, res) => {
  if (!isDbHealthy()) return fetchLiveBlogs();
  
  async function fetchLiveBlogs() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/blogs');
      res.json(await liveRes.json());
    } catch (liveError) {
      res.status(500).json({ error: "Failed to fetch blogs from live API" });
    }
  }

  try {
    const rows = await db`SELECT * FROM blogs ORDER BY created_at DESC`;
    res.json(rows);
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE BLOGS:', error.message);
    lastDbFailure = Date.now();
    await fetchLiveBlogs();
  }
});

// --- FAQS (Public) ---
router.get('/faqs', async (req, res) => {
  if (!isDbHealthy()) return fetchLiveFaqs();

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
    res.json(rows);
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE FAQS:', error.message);
    lastDbFailure = Date.now();
    await fetchLiveFaqs();
  }
});

// --- CATEGORIES (Public) ---
router.get('/categories', async (req, res) => {
  if (!isDbHealthy()) return fetchLiveCategories();

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
    res.json(rows);
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE CATEGORIES:', error.message);
    lastDbFailure = Date.now();
    await fetchLiveCategories();
  }
});

router.get('/prompt/:key', async (req, res) => {
  const { key } = req.params;

  if (!isDbHealthy()) return fetchLivePrompt();

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
    const prompt = {
      ...row,
      isImageSlider: Boolean(row.is_image_slider),
      hidePromptBox: Boolean(row.hide_prompt_box),
      copyCount: Number(row.copy_count),
      unlockCount: Number(row.unlock_count),
      likeCount: Number(row.like_count),
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
      isPremium: Boolean(row.is_premium)
    };
    res.json(prompt);
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE PROMPT:', error.message);
    lastDbFailure = Date.now();
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
  try {
    const rows = await db`SELECT * FROM site_settings`;
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json(processSettings(settings));
  } catch (error) {
    console.warn('LOCAL DB FAILED, FETCHING LIVE SETTINGS:', error.message);
    lastDbFailure = Date.now();
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

router.post('/toggle_like', async (req, res) => {
  const uid = req.headers['x-user-id'] || req.session.userId;
  if (!uid) return res.status(401).json({ error: "Not logged in" });

  const { key } = req.body;
  try {
    const existing = await db`SELECT * FROM user_likes WHERE user_id = ${uid} AND prompt_key = ${key}`;
    if (existing.length > 0) {
      await db`DELETE FROM user_likes WHERE user_id = ${uid} AND prompt_key = ${key}`;
      await db`UPDATE prompts SET like_count = GREATEST(0, like_count - 1) WHERE prompt_key = ${key}`;
      res.json({ status: "removed" });
    } else {
      await db`INSERT INTO user_likes (user_id, prompt_key) VALUES (${uid}, ${key})`;
      await db`UPDATE prompts SET like_count = like_count + 1 WHERE prompt_key = ${key}`;
      res.json({ status: "added" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// --- 4. RECORD COPY ---
router.post('/record_copy', async (req, res) => {
  const uid = req.headers['x-user-id'] || req.session.userId || null;
  const { key } = req.body;
  try {
    await db`UPDATE prompts SET copy_count = copy_count + 1 WHERE prompt_key = ${key}`;
    if (uid) {
      await db`INSERT IGNORE INTO user_copied (user_id, prompt_key) VALUES (${uid}, ${key})`;
    }
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
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to record unlock" });
  }
});

// --- 5. GET USER PROFILE ---
router.get('/get_profile', async (req, res) => {
  const uid = req.headers['x-user-id'] || req.session.userId;
  if (!uid) return res.status(401).json({ error: "Not logged in" });

  try {
    const rows = await db`SELECT name, email, avatar_url FROM users WHERE id = ${uid}`;
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });

    let userData = rows[0];
    if (!userData.avatar_url) {
      const encodedName = encodeURIComponent(userData.name || 'User');
      userData.avatar_url = `https://ui-avatars.com/api/?name=${encodedName}&background=e50914&color=fff&bold=true`;
    }
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// --- 6. UPDATE USER PROFILE ---
router.post('/update_profile', upload.single('avatar'), async (req, res) => {
  const uid = req.headers['x-user-id'] || req.session.userId;
  if (!uid) return res.status(401).json({ error: "Not logged in" });

  const { name } = req.body;
  if (!name || name.trim() === '') return res.status(400).json({ error: "Name cannot be empty" });

  try {
    let avatarUrl = null;
    if (req.file) {
      const filename = `avatar_${uid}_${Date.now()}.webp`;
      const filepath = path.join(uploadDir, filename);
      await sharp(req.file.buffer).webp({ quality: 80 }).toFile(filepath);
      avatarUrl = `/uploads/${filename}`;
    }

    if (avatarUrl) {
      await db`UPDATE users SET name = ${name}, avatar_url = ${avatarUrl} WHERE id = ${uid}`;
    } else {
      await db`UPDATE users SET name = ${name} WHERE id = ${uid}`;
    }

    const rows = await db`SELECT name, avatar_url FROM users WHERE id = ${uid}`;
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    const userData = rows[0];
    
    let newAvatar = userData.avatar_url;
    if (!newAvatar) {
      const encodedName = encodeURIComponent(userData.name);
      newAvatar = `https://ui-avatars.com/api/?name=${encodedName}&background=e50914&color=fff&bold=true`;
    }

    res.json({ status: "success", new_avatar: newAvatar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// --- 7. ADMIN ENDPOINTS (Restricted) ---
const adminAuth = (req, res, next) => {
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  const hasValidHeader = req.headers['x-admin-pin'] === (process.env.ADMIN_PASSWORD || 'admin');

  if (hasValidHeader || req.session.isAdmin || isLocal) {
    if (isLocal && !req.session.isAdmin) {
      req.session.isAdmin = true;
    }
    return next();
  }
  res.status(401).json({ error: "Admin access required" });
};

router.get('/admin/check_auth', (req, res) => {
  const isLocal = req.hostname === 'localhost' || req.hostname === '127.0.0.1';
  const hasValidHeader = req.headers['x-admin-pin'] === (process.env.ADMIN_PASSWORD || 'admin');
  res.json({ isAdmin: !!(req.session.isAdmin || isLocal || hasValidHeader) });
});

router.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === (process.env.ADMIN_PASSWORD || 'admin')) {
    req.session.isAdmin = true;
    res.json({ status: "success" });
  } else {
    res.status(401).json({ error: "Invalid password" });
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
  
  const ext = path.extname(req.file.originalname).toLowerCase();
  const isSvg = ext === '.svg';
  const filename = isSvg ? `logo_${Date.now()}.svg` : `logo_${Date.now()}.webp`;
  const filepath = path.join(uploadDir, filename);
  
  if (isSvg) {
    fs.writeFileSync(filepath, req.file.buffer);
  } else {
    await sharp(req.file.buffer).webp({ quality: 85 }).toFile(filepath);
  }
  
  const logoUrl = `/uploads/${filename}`;
  
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
  
  const filename = `img_${Date.now()}.webp`;
  const filepath = path.join(uploadDir, filename);
  await sharp(req.file.buffer).webp({ quality: 80 }).toFile(filepath);
  
  const imageUrl = `/uploads/${filename}`;
  // No DB persistence required for general image upload (usually for prompt editors)
  res.json({ status: "success", imageUrl });
});

router.get('/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  res.json({ status: "success" });
});

router.get('/admin/prompts', adminAuth, async (req, res) => {
  if (!isDbHealthy()) return fetchLiveAdminPrompts();

  async function fetchLiveAdminPrompts() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/admin/prompts');
      if (!liveRes.ok) throw new Error("Live API failed");
      res.json(await liveRes.json());
    } catch (e) {
      // Last-ditch mock data for UI safety
      res.json(MOCK_DATA.prompts.map(p => ({
        ...p,
        copy_count: Number(p.copy_count || 0),
        unlock_count: Number(p.unlock_count || 0),
        like_count: Number(p.like_count || 0),
      })));
    }
  }

  try {
    const rows = await db`SELECT * FROM prompts`;
    const formatted = rows.map(r => ({
      ...r,
      copy_count: Number(r.copy_count || 0),
      unlock_count: Number(r.unlock_count || 0),
      like_count: Number(r.like_count || 0),
      correct_attempts: Number(r.correct_attempts || 0),
      wrong_attempts: Number(r.wrong_attempts || 0)
    }));
    res.json(formatted);
  } catch (error) {
    console.warn('ADMIN PROMPTS DB FAILED, FETCHING LIVE:', error.message);
    lastDbFailure = Date.now();
    await fetchLiveAdminPrompts();
  }
});

router.post('/admin/save_prompt', adminAuth, async (req, res) => {
  const p = req.body;
  const originalKey = p.originalKey;
  const newKey = p.prompt_key?.trim();

  try {
    // Format validation
    if (newKey) {
      if (!/^PK[0-9]+$/.test(newKey)) {
        return res.status(400).json({ error: "Invalid ID format. Must start with 'PK' followed by numbers only (e.g. PK001)." });
      }
    }

    // Uniqueness check
    if (newKey) {
      const existing = await db`SELECT prompt_key FROM prompts WHERE prompt_key = ${newKey}`;
      if (existing.length > 0) {
        if (!originalKey || (originalKey !== newKey)) {
          return res.status(400).json({ error: "Choose a different ID. This ID is already taken and must be unique." });
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

    if (originalKey) {
      await db`
        UPDATE prompts SET 
          prompt_key = ${newKey || originalKey}, 
          slug = ${finalSlug}, 
          title = ${p.title}, 
          description = ${p.description}, 
          ai_type = ${p.ai_type}, 
          prompt_text = ${p.prompt_text}, 
          img_before = ${p.img_before}, 
          img_after = ${p.img_after}, 
          ig_link = ${p.ig_link}, 
          is_image_slider = ${!!p.is_image_slider}, 
          image_ratio = ${p.image_ratio}, 
          password = ${p.password}, 
          is_premium = ${!!p.is_premium} 
        WHERE prompt_key = ${originalKey}
      `;
    } else {
      const finalKey = newKey || ('PK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100));
      await db`
        INSERT INTO prompts (
          prompt_key, slug, title, description, ai_type, prompt_text, img_before, img_after, 
          ig_link, is_image_slider, image_ratio, password, is_premium
        ) VALUES (
          ${finalKey}, ${finalSlug}, ${p.title}, ${p.description}, ${p.ai_type}, ${p.prompt_text}, 
          ${p.img_before}, ${p.img_after}, ${p.ig_link}, ${!!p.is_image_slider}, 
          ${p.image_ratio}, ${p.password}, ${!!p.is_premium}
        )
      `;
    }
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Save failed" });
  }
});

router.delete('/admin/delete_prompt/:key', adminAuth, async (req, res) => {
  try {
    await db`DELETE FROM prompts WHERE prompt_key = ${req.params.key}`;
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// Admin Blog CRUD
router.get('/admin/blogs', adminAuth, async (req, res) => {
  if (!isDbHealthy()) return fetchLiveAdminBlogs();

  async function fetchLiveAdminBlogs() {
    try {
      const liveRes = await fetch('https://api.promptking.in/api/admin/blogs');
      res.json(await liveRes.json());
    } catch (e) { res.json([]); }
  }

  try {
    const rows = await db`SELECT * FROM blogs`;
    res.json(rows);
  } catch (error) {
    console.warn('ADMIN BLOGS DB FAILED, FETCHING LIVE:', error.message);
    lastDbFailure = Date.now();
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
    if (b.id) {
      await db`UPDATE blogs SET title = ${b.title}, slug = ${finalSlug}, content = ${b.content}, featured_image = ${b.featured_image} WHERE id = ${b.id}`;
    } else {
      await db`INSERT INTO blogs (title, slug, content, featured_image) VALUES (${b.title}, ${finalSlug}, ${b.content}, ${b.featured_image})`;
    }
    res.json({ status: "success" });
  } catch (error) {
    console.error("Save blog error:", error);
    res.status(500).json({ error: "Save failed" });
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
      const liveRes = await fetch('https://api.promptking.in/api/admin/faqs');
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
      const liveRes = await fetch('https://api.promptking.in/api/admin/categories');
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
      await db`UPDATE categories SET name = ${c.name}, slug = ${slug} WHERE id = ${c.id}`;
    } else {
      await db`INSERT INTO categories (name, slug) VALUES (${c.name}, ${slug})`;
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
  
  try {
    // Attempt DB fetch if healthy
    const db = require('./db');
    prompts = await db`SELECT prompt_key FROM prompts WHERE prompt_key IS NOT NULL`;
    blogs = await db`SELECT slug FROM blogs`;
  } catch (err) {
    console.warn("Sitemap: DB failed, serving static pages only", err.message);
  }

  try {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Static Pages
    const staticPages = ['', '/blog', '/faq', '/about', '/privacy', '/terms', '/disclaimer', '/contact'];
    staticPages.forEach(p => {
      xml += `  <url>\n    <loc>${baseUrl}${p}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${p === '' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
    });

    // Dynamic Prompts
    prompts.forEach(p => {
      xml += `  <url>\n    <loc>${baseUrl}/prompt/${p.prompt_key}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    });

    // Dynamic Blogs
    blogs.forEach(b => {
      xml += `  <url>\n    <loc>${baseUrl}/article/${b.slug}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
    });

    xml += `</urlset>`;
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error("Sitemap XML build error:", error);
    res.status(500).send("Error generating sitemap");
  }
});

module.exports = router;

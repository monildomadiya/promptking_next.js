const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) { fs.mkdirSync(uploadDir, { recursive: true }); }

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename: (req, file, cb) => {
    const uid = req.headers['x-user-id'] || req.session.userId;
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${uid}_${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

// --- HELPER: Generate Unique Slug ---
const generateUniqueSlug = async (title, currentId = null, table = 'prompts', idColumn = 'prompt_key') => {
  let slug = title.toLowerCase()
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
      WHERE slug = ${uniqueSlug} AND ${db(idColumn)} != ${currentId || ''}
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

// --- LOGO UPLOAD (SVG Support) ---
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, uploadDir); },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `logo_${Date.now()}${ext}`);
  }
});

const logoUpload = multer({ 
  storage: logoStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.svg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Invalid image type"));
  }
});

// --- 1. AUTHENTICATION ---
router.post('/login', async (req, res) => {
  const { uid, name, email, picture } = req.body;
  try {
    await db`
      INSERT INTO users (id, name, email, avatar_url) 
      VALUES (${uid}, ${name}, ${email}, ${picture})
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
    console.error('CRITICAL DATABASE FETCH ERROR:', error);
    res.status(500).json({ error: "Failed to fetch data", details: String(error) });
  }
});

// --- BLOGS (Public) ---
router.get('/blogs', async (req, res) => {
  try {
    const rows = await db`SELECT * FROM blogs ORDER BY created_at DESC`;
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

// --- FAQS (Public) ---
router.get('/faqs', async (req, res) => {
  try {
    const rows = await db`SELECT * FROM faqs ORDER BY created_at DESC`;
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// --- CATEGORIES (Public) ---
router.get('/categories', async (req, res) => {
  try {
    const rows = await db`SELECT * FROM categories ORDER BY name ASC`;
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

router.get('/prompt/:key', async (req, res) => {
  const { key } = req.params;
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
    console.error(error);
    res.status(500).json({ error: "Failed to fetch prompt" });
  }
});

// --- SITE SETTINGS (Public) ---
router.get('/settings', async (req, res) => {
  try {
    const rows = await db`SELECT * FROM site_settings`;
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch settings" });
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
      avatarUrl = `/uploads/${req.file.filename}`;
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
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Fetch settings failed" });
  }
});

router.post('/admin/save_settings', adminAuth, async (req, res) => {
  const settings = req.body;
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
    res.status(500).json({ error: "Save settings failed" });
  }
});

router.post('/admin/upload_logo', adminAuth, logoUpload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const logoUrl = `/uploads/${req.file.filename}`;
  try {
    await db`
      INSERT INTO site_settings (setting_key, setting_value) 
      VALUES ('logo_url', ${logoUrl}) 
      ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
    `;
    res.json({ status: "success", logoUrl });
  } catch (error) {
    res.status(500).json({ error: "Logo save failed" });
  }
});

router.post('/admin/upload_image', adminAuth, logoUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ status: "success", imageUrl });
});

router.get('/admin/logout', (req, res) => {
  req.session.isAdmin = false;
  res.json({ status: "success" });
});

router.get('/admin/prompts', adminAuth, async (req, res) => {
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
    res.status(500).json({ error: "Fetch failed" });
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
          hide_prompt_box = ${!!p.hide_prompt_box}, 
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
          ig_link, is_image_slider, hide_prompt_box, image_ratio, password, is_premium
        ) VALUES (
          ${finalKey}, ${finalSlug}, ${p.title}, ${p.description}, ${p.ai_type}, ${p.prompt_text}, 
          ${p.img_before}, ${p.img_after}, ${p.ig_link}, ${!!p.is_image_slider}, 
          ${!!p.hide_prompt_box}, ${p.image_ratio}, ${p.password}, ${!!p.is_premium}
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
  try {
    const rows = await db`SELECT * FROM blogs`;
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
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
  try {
    const rows = await db`SELECT * FROM faqs`;
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
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
  try {
    const rows = await db`SELECT * FROM categories ORDER BY name ASC`;
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: "Fetch failed" });
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

module.exports = router;


import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAdminAuth } from '@/lib/auth';
import { cacheInvalidate } from '@/lib/cache';

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

export async function POST(req) {
  const isAdmin = await getAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  try {
    const p = await req.json();
    const originalKey = p.originalKey;
    let newKey = p.prompt_key?.trim();

    if (newKey && !/^PK[0-9]+$/.test(newKey)) {
      return NextResponse.json({ error: "Invalid ID format. Must start with 'PK' followed by numbers only (e.g. PK001)." }, { status: 400 });
    }

    if (newKey) {
      const existing = await db`SELECT prompt_key FROM prompts WHERE prompt_key = ${newKey}`;
      if (existing.length > 0) {
        if (originalKey && originalKey === newKey) {
          // fine
        } else if (originalKey) {
          return NextResponse.json({ error: "Choose a different ID. This ID is already taken and must be unique." }, { status: 400 });
        } else {
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

    let finalSlug = p.slug?.trim();
    if (!finalSlug) {
      finalSlug = await generateUniqueSlug(p.title, originalKey);
    } else {
      finalSlug = await generateUniqueSlug(finalSlug, originalKey);
    }

    let finalKey = newKey;
    const stringifyJson = (val) => val ? JSON.stringify(val) : null;

    if (originalKey) {
      finalKey = newKey || originalKey;
      await db`
        UPDATE prompts SET 
          prompt_key = ${finalKey}, 
          slug = ${finalSlug}, 
          title = ${p.title}, 
          website_category_id = ${p.website_category_id || null},
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
          is_featured = ${p.is_featured ? 1 : 0},
          publish_date = ${p.publish_date || null},
          author_id = ${p.author_id || null}
        WHERE prompt_key = ${originalKey}
      `;
    } else {
      finalKey = newKey || ('PK' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100));
      await db`
        INSERT INTO prompts (
          prompt_key, slug, title, website_category_id, sub_prompts, thumbnail_url, meta_title, meta_description, focus_keyword, canonical_url,
          og_title, og_description, og_image, twitter_title, twitter_description, twitter_image,
          faqs, tags,
          description, ai_type, prompt_text, img_before, img_after, 
          ig_link, is_image_slider, image_ratio, password, is_premium, gallery_urls, is_featured, publish_date, author_id
        ) VALUES (
          ${finalKey}, ${finalSlug}, ${p.title}, ${p.website_category_id || null}, ${stringifyJson(p.sub_prompts)}, ${p.thumbnail_url || null}, ${p.meta_title || ''}, ${p.meta_description || null}, ${p.focus_keyword || null}, ${p.canonical_url || null},
          ${p.og_title || null}, ${p.og_description || null}, ${p.og_image || null}, ${p.twitter_title || null}, ${p.twitter_description || null}, ${p.twitter_image || null},
          ${stringifyJson(p.faqs)}, ${p.tags || null},
          ${p.description}, ${p.ai_type}, ${p.prompt_text}, 
          ${p.img_before}, ${p.img_after}, ${p.ig_link}, ${p.is_image_slider ? 1 : 0}, 
          ${p.image_ratio}, ${p.password}, ${p.is_premium ? 1 : 0}, ${p.gallery_urls || null}, ${p.is_featured ? 1 : 0}, ${p.publish_date || null}, ${p.author_id || null}
        )
      `;
    }

    // Invalidate the server-side cache so the live site reflects changes immediately
    cacheInvalidate('all_prompts_listing');
    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/', 'layout');
    } catch (e) {}

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Save failed" }, { status: 500 });
  }
}

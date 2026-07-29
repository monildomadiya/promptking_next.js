import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheInvalidate } from '@/lib/cache';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, name, slug, description, image_url, tag, meta_title, meta_description, focus_keyword } = body;
    
    if (id) {
      await db`UPDATE website_categories SET name=${name}, slug=${slug}, description=${description || null}, image_url=${image_url || null}, tag=${tag || null}, meta_title=${meta_title || null}, meta_description=${meta_description || null}, focus_keyword=${focus_keyword || null} WHERE id=${id}`;
    } else {
      await db`INSERT INTO website_categories (name, slug, description, image_url, tag, meta_title, meta_description, focus_keyword) VALUES (${name}, ${slug}, ${description || null}, ${image_url || null}, ${tag || null}, ${meta_title || null}, ${meta_description || null}, ${focus_keyword || null})`;
    }

    // Invalidate caches so live site reflects changes immediately
    cacheInvalidate('api_website_categories');
    cacheInvalidate('website_categories_ssr');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

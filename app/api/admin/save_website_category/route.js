import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheInvalidate } from '@/lib/cache';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, name, slug, icon, description, image_url, tag } = body;
    
    if (id) {
      await db`UPDATE website_categories SET name=${name}, slug=${slug}, icon=${icon}, description=${description}, image_url=${image_url || null}, tag=${tag || null} WHERE id=${id}`;
    } else {
      await db`INSERT INTO website_categories (name, slug, icon, description, image_url, tag) VALUES (${name}, ${slug}, ${icon}, ${description}, ${image_url || null}, ${tag || null})`;
    }

    // Invalidate caches so live site reflects changes immediately
    cacheInvalidate('api_website_categories');
    cacheInvalidate('website_categories_ssr');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

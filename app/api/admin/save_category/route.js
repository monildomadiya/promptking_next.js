import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheInvalidate } from '@/lib/cache';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, name, slug, description, image, icon } = body;
    
    if (id) {
      await db`UPDATE categories SET name=${name}, slug=${slug}, description=${description}, image=${image}, icon=${icon} WHERE id=${id}`;
    } else {
      await db`INSERT INTO categories (name, slug, description, image, icon) VALUES (${name}, ${slug}, ${description}, ${image}, ${icon})`;
    }

    // Invalidate caches so live site reflects changes immediately
    cacheInvalidate('api_categories');
    cacheInvalidate('all_prompts_listing');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

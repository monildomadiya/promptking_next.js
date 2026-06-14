import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, name, slug, icon, description } = body;
    
    if (id) {
      await db`UPDATE website_categories SET name=${name}, slug=${slug}, icon=${icon}, description=${description} WHERE id=${id}`;
    } else {
      await db`INSERT INTO website_categories (name, slug, icon, description) VALUES (${name}, ${slug}, ${icon}, ${description})`;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

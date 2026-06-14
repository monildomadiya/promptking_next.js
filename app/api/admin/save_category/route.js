import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, name, slug, description, image, icon } = body;
    
    if (id) {
      await db`UPDATE categories SET name=${name}, slug=${slug}, description=${description}, image=${image}, icon=${icon} WHERE id=${id}`;
    } else {
      await db`INSERT INTO categories (name, slug, description, image, icon) VALUES (${name}, ${slug}, ${description}, ${image}, ${icon})`;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

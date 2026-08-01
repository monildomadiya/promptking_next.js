import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { publishChanges } from '@/lib/publish';
import { requireAdmin } from '@/lib/auth';

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, name, slug, description, image, icon } = body;
    
    if (id) {
      await db`UPDATE categories SET name=${name}, slug=${slug}, description=${description}, image=${image}, icon=${icon} WHERE id=${id}`;
    } else {
      await db`INSERT INTO categories (name, slug, description, image, icon) VALUES (${name}, ${slug}, ${description}, ${image}, ${icon})`;
    }

    // Invalidate caches so live site reflects changes immediately
    publishChanges('categories', 'prompts');
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

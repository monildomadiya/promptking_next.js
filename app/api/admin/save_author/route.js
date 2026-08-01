import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { publishChanges } from '@/lib/publish';
import { requireAdmin } from '@/lib/auth';

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, name, image, description } = body;
    
    if (id) {
      await db`UPDATE authors SET name=${name}, image=${image}, description=${description} WHERE id=${id}`;
    } else {
      await db`INSERT INTO authors (name, image, description) VALUES (${name}, ${image}, ${description})`;
    }

    // Author name and photo are denormalized onto every post they wrote.
    publishChanges('blogs');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

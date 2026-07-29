import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, name, image, description } = body;
    
    if (id) {
      await db`UPDATE authors SET name=${name}, image=${image}, description=${description} WHERE id=${id}`;
    } else {
      await db`INSERT INTO authors (name, image, description) VALUES (${name}, ${image}, ${description})`;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

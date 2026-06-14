import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, title, slug, content, meta_description, featured_image, read_time, author_id, status } = body;
    
    if (id) {
      await db`UPDATE blogs SET title=${title}, slug=${slug}, content=${content}, meta_description=${meta_description}, featured_image=${featured_image}, read_time=${read_time}, author_id=${author_id}, status=${status} WHERE id=${id}`;
    } else {
      await db`INSERT INTO blogs (title, slug, content, meta_description, featured_image, read_time, author_id, status) VALUES (${title}, ${slug}, ${content}, ${meta_description}, ${featured_image}, ${read_time}, ${author_id}, ${status})`;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

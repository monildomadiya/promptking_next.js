import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    try {
      await db`UPDATE blogs SET view_count = COALESCE(view_count, 0) + 1 WHERE slug = ${slug}`;
    } catch (colErr) {
      if (colErr.code === 'ER_NO_SUCH_TABLE') {
        console.warn('Blogs table does not exist yet.');
      } else {
        throw colErr;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DATABASE ERROR (record_blog_view):', error.message);
    return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
  }
}

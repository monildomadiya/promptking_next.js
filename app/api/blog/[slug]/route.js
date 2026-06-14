import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    
    let blogs = [];
    try {
      blogs = await db`SELECT * FROM blogs WHERE slug = ${slug}`;
    } catch (colErr) {
      if (colErr.code === 'ER_NO_SUCH_TABLE') {
        console.warn('Blogs table does not exist yet.');
      } else {
        throw colErr;
      }
    }

    if (!blogs || blogs.length === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }
    
    // Process booleans if needed
    const parseDbBool = (val) => {
      if (val === null || val === undefined) return false;
      if (Buffer.isBuffer(val)) return val[0] === 1;
      return val == 1 || val === true || val === 'true';
    };

    const blog = {
        ...blogs[0],
        enable_table_of_contents: parseDbBool(blogs[0].enable_table_of_contents)
    };

    const response = NextResponse.json(blog);
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('DATABASE ERROR (blog details):', error.message);
    return NextResponse.json({ error: "Failed to fetch blog" }, { status: 500 });
  }
}

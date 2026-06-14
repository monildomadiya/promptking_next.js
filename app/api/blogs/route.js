import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    let blogs = [];
    try {
      blogs = await db`SELECT * FROM blogs ORDER BY created_at DESC`;
    } catch (colErr) {
      if (colErr.code === 'ER_NO_SUCH_TABLE') {
        console.warn('Blogs table does not exist yet.');
      } else {
        throw colErr;
      }
    }
    
    // Process booleans if needed
    const parseDbBool = (val) => {
      if (val === null || val === undefined) return false;
      if (Buffer.isBuffer(val)) return val[0] === 1;
      return val == 1 || val === true || val === 'true';
    };

    const processedBlogs = blogs.map(row => {
        return {
            ...row,
            enable_table_of_contents: parseDbBool(row.enable_table_of_contents)
        };
    });

    const response = NextResponse.json(processedBlogs);
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return response;
  } catch (error) {
    console.error('DATABASE ERROR (blogs):', error.message);
    return NextResponse.json({ error: "Failed to fetch blogs" }, { status: 500 });
  }
}

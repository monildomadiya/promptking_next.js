import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    let blogs = [];
    try {
      // This is a LIST endpoint — every caller renders cards (blog index, the
      // home page rail, the article sidebar). `SELECT *` shipped the full
      // article HTML plus the FAQ JSON for all posts: 306 KB of a 339 KB
      // response, none of it rendered. Full bodies come from /api/blog/[slug].
      //
      // `content_fallback` is the excerpt-less teaser the cards want. It was
      // already referenced by the blog index but never sent, so posts without
      // an excerpt silently fell through to a hardcoded placeholder. 600 chars
      // is enough to survive stripping tags down to the ~160 shown.
      blogs = await db`
        SELECT id, title, slug, excerpt, LEFT(content, 600) AS content_fallback,
               featured_image, featured_image_alt, created_at, published_at,
               author_id, author_name, author_image, read_time, category, tags,
               status, enable_table_of_contents,
               view_count, like_count, copy_count, unlock_count
        FROM blogs
        ORDER BY created_at DESC
      `;
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

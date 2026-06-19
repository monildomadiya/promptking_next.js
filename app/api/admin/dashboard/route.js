export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

  try {
    // Prompt stats
    const [promptStats] = await db`
      SELECT 
        COUNT(*)                   AS total_prompts,
        COALESCE(SUM(copy_count),0)   AS total_copies,
        COALESCE(SUM(unlock_count),0) AS total_unlocks,
        COALESCE(SUM(view_count),0)   AS total_views,
        COALESCE(SUM(like_count),0)   AS total_likes
      FROM prompts
    `;

    // Blog stats
    const [blogStats] = await db`
      SELECT COUNT(*) AS total_blogs FROM blogs
    `;

    return NextResponse.json({
      prompts:  Number(promptStats.total_prompts)  || 0,
      copies:   Number(promptStats.total_copies)   || 0,
      unlocks:  Number(promptStats.total_unlocks)  || 0,
      views:    Number(promptStats.total_views)    || 0,
      likes:    Number(promptStats.total_likes)    || 0,
      blogs:    Number(blogStats.total_blogs)      || 0,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}

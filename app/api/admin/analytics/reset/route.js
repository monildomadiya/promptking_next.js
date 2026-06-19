export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

  try {
    // Reset all interaction counts on prompts
    await db`
      UPDATE prompts
      SET view_count = 0, copy_count = 0, unlock_count = 0, like_count = 0
    `;

    // Clear analytics_events table if it exists
    try {
      await db`DELETE FROM analytics_events`;
    } catch (e) {
      // Table may not exist — that's fine
    }

    return NextResponse.json({ success: true, message: 'Analytics data has been reset.' });
  } catch (error) {
    console.error('Analytics reset error:', error);
    return NextResponse.json({ error: 'Failed to reset analytics data' }, { status: 500 });
  }
}

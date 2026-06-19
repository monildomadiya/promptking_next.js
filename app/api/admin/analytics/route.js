export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

  try {
    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days') || '30';

    // Try analytics_events table first (event-level granular data)
    let rows = [];
    let usedEventsTable = false;

    try {
      if (daysParam === 'all') {
        rows = await db`
          SELECT 
            DATE(created_at) as date,
            SUM(CASE WHEN event_type = 'view'   THEN 1 ELSE 0 END) as view,
            SUM(CASE WHEN event_type = 'copy'   THEN 1 ELSE 0 END) as copy,
            SUM(CASE WHEN event_type = 'unlock' THEN 1 ELSE 0 END) as unlock
          FROM analytics_events
          GROUP BY DATE(created_at)
          ORDER BY DATE(created_at) ASC
        `;
      } else {
        const days = Math.max(1, parseInt(daysParam) || 30);
        rows = await db`
          SELECT 
            DATE(created_at) as date,
            SUM(CASE WHEN event_type = 'view'   THEN 1 ELSE 0 END) as view,
            SUM(CASE WHEN event_type = 'copy'   THEN 1 ELSE 0 END) as copy,
            SUM(CASE WHEN event_type = 'unlock' THEN 1 ELSE 0 END) as unlock
          FROM analytics_events
          WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
          GROUP BY DATE(created_at)
          ORDER BY DATE(created_at) ASC
        `;
      }
      usedEventsTable = true;
    } catch (e) {
      // analytics_events table may not exist — fall back to prompts table aggregates
      console.warn('analytics_events table not available, using prompts table fallback:', e.message);
    }

    // If analytics_events has no data OR table doesn't exist, fall back to prompts table totals
    if (!usedEventsTable || rows.length === 0) {
      // Generate a single synthetic "today" summary from prompts table totals
      const [totals] = await db`
        SELECT 
          COALESCE(SUM(view_count), 0)   AS total_views,
          COALESCE(SUM(copy_count), 0)   AS total_copies,
          COALESCE(SUM(unlock_count), 0) AS total_unlocks
        FROM prompts
      `;

      // Build a rolling 7-day or 30-day synthetic chart using created_at from prompts
      const days = daysParam === 'all' ? 365 : (Math.max(1, parseInt(daysParam) || 30));
      const dailyRows = await db`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as new_prompts,
          COALESCE(SUM(view_count), 0)   as view,
          COALESCE(SUM(copy_count), 0)   as copy,
          COALESCE(SUM(unlock_count), 0) as unlock
        FROM prompts
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `;

      if (dailyRows.length > 0) {
        const formattedFallback = dailyRows.map(row => ({
          date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          view:   Number(row.view)   || 0,
          copy:   Number(row.copy)   || 0,
          unlock: Number(row.unlock) || 0,
        }));
        return NextResponse.json(formattedFallback);
      }

      // Last resort: single bar with lifetime totals under today's date
      const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return NextResponse.json([{
        date:   today,
        view:   Number(totals.total_views)   || 0,
        copy:   Number(totals.total_copies)  || 0,
        unlock: Number(totals.total_unlocks) || 0,
      }]);
    }

    const formattedData = rows.map(row => ({
      date:   new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      view:   Number(row.view)   || 0,
      copy:   Number(row.copy)   || 0,
      unlock: Number(row.unlock) || 0,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

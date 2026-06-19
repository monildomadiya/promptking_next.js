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
    // Note: 'view', 'copy', 'unlock' are reserved in MariaDB — backtick-quote them
    let rows = [];
    let usedEventsTable = false;

    try {
      if (daysParam === 'all') {
        rows = await db`
          SELECT 
            DATE(created_at) AS \`date\`,
            SUM(CASE WHEN event_type = 'view'   THEN 1 ELSE 0 END) AS \`view\`,
            SUM(CASE WHEN event_type = 'copy'   THEN 1 ELSE 0 END) AS \`copy\`,
            SUM(CASE WHEN event_type = 'unlock' THEN 1 ELSE 0 END) AS \`unlock\`
          FROM analytics_events
          GROUP BY DATE(created_at)
          ORDER BY DATE(created_at) ASC
        `;
      } else {
        const days = Math.max(1, parseInt(daysParam) || 30);
        rows = await db`
          SELECT 
            DATE(created_at) AS \`date\`,
            SUM(CASE WHEN event_type = 'view'   THEN 1 ELSE 0 END) AS \`view\`,
            SUM(CASE WHEN event_type = 'copy'   THEN 1 ELSE 0 END) AS \`copy\`,
            SUM(CASE WHEN event_type = 'unlock' THEN 1 ELSE 0 END) AS \`unlock\`
          FROM analytics_events
          WHERE created_at >= SUBDATE(CURDATE(), ${days})
          GROUP BY DATE(created_at)
          ORDER BY DATE(created_at) ASC
        `;
      }
      usedEventsTable = true;
    } catch (e) {
      // analytics_events table may not exist — fall back to prompts table aggregates
      console.warn('analytics_events table not available, using prompts table fallback:', e.message);
    }

    // If analytics_events has no data OR table doesn't exist, fall back to prompts table
    if (!usedEventsTable || rows.length === 0) {
      // Get all-time totals from prompts
      const [totals] = await db`
        SELECT 
          COALESCE(SUM(view_count), 0)   AS total_views,
          COALESCE(SUM(copy_count), 0)   AS total_copies,
          COALESCE(SUM(unlock_count), 0) AS total_unlocks
        FROM prompts
      `;

      // Build synthetic daily chart — no date filter, always returns data
      // Backtick-quote reserved-word aliases for MariaDB compatibility
      const dailyRows = await db`
        SELECT 
          DATE(created_at)                AS \`date\`,
          COALESCE(SUM(view_count),   0)  AS \`view\`,
          COALESCE(SUM(copy_count),   0)  AS \`copy\`,
          COALESCE(SUM(unlock_count), 0)  AS \`unlock\`
        FROM prompts
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `;

      if (dailyRows.length > 0) {
        // Apply day filter in JS (avoids parameterized INTERVAL syntax issues)
        const days = daysParam === 'all' ? Infinity : Math.max(1, parseInt(daysParam) || 30);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        const filtered = daysParam === 'all'
          ? dailyRows
          : dailyRows.filter(row => new Date(row.date) >= cutoff);

        // If nothing falls in the range, show all data so chart is never empty
        const source = filtered.length > 0 ? filtered : dailyRows;

        return NextResponse.json(source.map(row => ({
          date:   new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          view:   Number(row.view)   || 0,
          copy:   Number(row.copy)   || 0,
          unlock: Number(row.unlock) || 0,
        })));
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

    return NextResponse.json(rows.map(row => ({
      date:   new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      view:   Number(row.view)   || 0,
      copy:   Number(row.copy)   || 0,
      unlock: Number(row.unlock) || 0,
    })));

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

// Ensure analytics_events table exists (idempotent)
async function ensureAnalyticsTable() {
  try {
    await db`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        item_key VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at)
      )
    `;
  } catch (e) {
    console.warn('Could not create analytics_events table:', e.message);
  }
}

export async function GET(req) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

  try {
    // Auto-create table if missing
    await ensureAnalyticsTable();

    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days') || '30';

    let rows = [];

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
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `;
    }

    // If analytics_events has real data, return it
    if (rows.length > 0) {
      return NextResponse.json(rows.map(row => ({
        date:   new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        view:   Number(row.view)   || 0,
        copy:   Number(row.copy)   || 0,
        unlock: Number(row.unlock) || 0,
      })));
    }

    // No event-level data yet — return empty so the "No analytics data yet" message shows
    // (Don't fabricate misleading data from prompt creation dates)
    return NextResponse.json([]);

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

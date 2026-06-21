export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAdminAuth } from '@/lib/auth';

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
  } catch (e) {}
}

// Safely format a date value from MariaDB (may be a Date object or string)
function formatDate(val) {
  try {
    const d = val instanceof Date ? val : new Date(val);
    // Adjust for local timezone offset to prevent off-by-one day issues
    const adjusted = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
    return adjusted.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return String(val);
  }
}

export async function GET(req) {
  const isAdmin = await getAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

  try {
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

    // Return event-level data if available
    if (rows.length > 0) {
      return NextResponse.json(rows.map(row => ({
        date:   formatDate(row.date),
        view:   Number(row.view)   || 0,
        copy:   Number(row.copy)   || 0,
        unlock: Number(row.unlock) || 0,
      })));
    }

    // If no events in selected range, return empty array so frontend shows 'No analytics data yet' empty state
    return NextResponse.json([]);

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

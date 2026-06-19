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

    let rows;

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

    const formattedData = rows.map(row => ({
      date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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

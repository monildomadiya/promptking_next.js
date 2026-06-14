import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days')) || 30;

    const query = await db`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN event_type = 'view' THEN 1 ELSE 0 END) as view,
        SUM(CASE WHEN event_type = 'copy' THEN 1 ELSE 0 END) as copy,
        SUM(CASE WHEN event_type = 'unlock' THEN 1 ELSE 0 END) as \`unlock\`
      FROM analytics_events
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;

    const formattedData = query.map(row => ({
      date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      view: Number(row.view) || 0,
      copy: Number(row.copy) || 0,
      unlock: Number(row.unlock) || 0
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

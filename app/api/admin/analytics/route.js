export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAdminAuth } from '@/lib/auth';

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
    const url = new URL(req.url);
    const daysParam = url.searchParams.get('days') || '30';

    let rows = [];

    if (daysParam === 'all') {
      rows = await db`
        SELECT \`date\`, views as \`view\`, copies as \`copy\`, unlocks as \`unlock\`
        FROM analytics_daily
        ORDER BY \`date\` ASC
      `;
    } else {
      const days = Math.max(1, parseInt(daysParam) || 30);
      rows = await db`
        SELECT \`date\`, views as \`view\`, copies as \`copy\`, unlocks as \`unlock\`
        FROM analytics_daily
        WHERE \`date\` >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
        ORDER BY \`date\` ASC
      `;
    }

    if (rows.length > 0) {
      return NextResponse.json(rows.map(row => ({
        date:   formatDate(row.date),
        view:   Number(row.view)   || 0,
        copy:   Number(row.copy)   || 0,
        unlock: Number(row.unlock) || 0,
      })));
    }

    // Return empty array if no events found to show 'No analytics data yet' on frontend
    return NextResponse.json([]);

  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

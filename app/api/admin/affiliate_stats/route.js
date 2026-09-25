export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ensureAffiliateTables } from '@/lib/affiliate';

const toDay = (d) => {
  const date = new Date(d);
  // DATE columns come back as local-midnight Date objects; format in local
  // time so a click on the 5th is not charted on the 4th.
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Numbers for the Performance tab: totals, a daily series, stores, top products. */
export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const days = Math.min(365, Math.max(7, Number(new URL(req.url).searchParams.get('days')) || 30));

  try {
    await ensureAffiliateTables();

    const [totals] = await db`
      SELECT COUNT(*) AS products,
             SUM(is_active = 1 AND (deal_ends_at IS NULL OR deal_ends_at > NOW())) AS live,
             SUM(is_featured = 1) AS featured,
             COALESCE(SUM(click_count), 0) AS clicks_all_time
      FROM affiliate_products
    `;

    const daily = await db`
      SELECT d.click_date, p.store, SUM(d.clicks) AS clicks
      FROM affiliate_clicks_daily d
      JOIN affiliate_products p ON p.id = d.product_id
      WHERE d.click_date >= CURDATE() - INTERVAL ${days - 1} DAY
      GROUP BY d.click_date, p.store
      ORDER BY d.click_date ASC
    `;

    const top = await db`
      SELECT p.id, p.title, p.store, p.image_url, p.slug, SUM(d.clicks) AS clicks
      FROM affiliate_clicks_daily d
      JOIN affiliate_products p ON p.id = d.product_id
      WHERE d.click_date >= CURDATE() - INTERVAL ${days - 1} DAY
      GROUP BY p.id, p.title, p.store, p.image_url, p.slug
      ORDER BY clicks DESC
      LIMIT 8
    `;

    // A continuous series: days with no clicks are zeros on the chart, not
    // gaps — a missing key is a hole to Recharts, and a lone point in a hole
    // draws nothing at all.
    const byDay = new Map();
    const stores = new Map();
    for (const row of daily) {
      const key = toDay(row.click_date);
      const clicks = Number(row.clicks || 0);
      const entry = byDay.get(key) || {};
      entry[row.store] = (entry[row.store] || 0) + clicks;
      byDay.set(key, entry);
      stores.set(row.store, (stores.get(row.store) || 0) + clicks);
    }
    const zeros = Object.fromEntries([...stores.keys()].map((s) => [s, 0]));
    const series = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const key = toDay(d);
      const entry = byDay.get(key) || {};
      const total = Object.values(entry).reduce((a, b) => a + b, 0);
      series.push({ date: key.slice(5), total, ...zeros, ...entry });
    }

    const periodClicks = [...stores.values()].reduce((a, b) => a + b, 0);

    return NextResponse.json({
      days,
      totals: {
        products: Number(totals?.products || 0),
        live: Number(totals?.live || 0),
        featured: Number(totals?.featured || 0),
        clicksAllTime: Number(totals?.clicks_all_time || 0),
        clicksPeriod: periodClicks,
      },
      series,
      stores: [...stores.entries()].map(([store, clicks]) => ({ store, clicks })).sort((a, b) => b.clicks - a.clicks),
      top: top.map((t) => ({ ...t, clicks: Number(t.clicks || 0) })),
    });
  } catch (error) {
    console.error('affiliate_stats error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

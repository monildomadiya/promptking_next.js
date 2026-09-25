export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { ensureAffiliateTables } from '@/lib/affiliate';

const parseDbBool = (val) => {
  if (val === null || val === undefined) return false;
  if (Buffer.isBuffer(val)) return val[0] === 1;
  return val == 1 || val === true || val === 'true';
};

/** Admin listing: every product, inactive and expired included, with recent clicks. */
export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await ensureAffiliateTables();
    const rows = await db`
      SELECT p.*, COALESCE(d.recent, 0) AS clicks_7d
      FROM affiliate_products p
      LEFT JOIN (
        SELECT product_id, SUM(clicks) AS recent
        FROM affiliate_clicks_daily
        WHERE click_date >= CURDATE() - INTERVAL 6 DAY
        GROUP BY product_id
      ) d ON d.product_id = p.id
      ORDER BY p.is_featured DESC, p.sort_order ASC, p.id DESC
    `;
    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        price: r.price === null ? null : Number(r.price),
        mrp: r.mrp === null ? null : Number(r.mrp),
        rating: r.rating === null ? null : Number(r.rating),
        click_count: Number(r.click_count || 0),
        clicks_7d: Number(r.clicks_7d || 0),
        is_active: parseDbBool(r.is_active),
        is_featured: parseDbBool(r.is_featured),
      }))
    );
  } catch (error) {
    console.error('admin affiliate list error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * Admin listing. Unlike the public one this keeps empty categories — a
 * category with nothing in it yet is exactly the thing an admin has just
 * created and is about to fill.
 */
export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const rows = await db`
      SELECT c.id, c.name, c.slug, c.description, c.sort_order,
             COUNT(w.id) AS wallpaper_count
      FROM wallpaper_categories c
      LEFT JOIN wallpapers w ON w.category_id = c.id
      GROUP BY c.id, c.name, c.slug, c.description, c.sort_order
      ORDER BY c.sort_order ASC, c.name ASC
    `;
    return NextResponse.json(rows.map((r) => ({ ...r, wallpaper_count: Number(r.wallpaper_count || 0) })));
  } catch (error) {
    console.error('admin wallpaper_categories list error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

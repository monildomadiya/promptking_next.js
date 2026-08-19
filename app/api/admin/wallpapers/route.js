export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

const parseDbBool = (val) => {
  if (val === null || val === undefined) return false;
  if (Buffer.isBuffer(val)) return val[0] === 1;
  return val == 1 || val === true || val === 'true';
};

/** Admin listing: unlike the public one this includes drafts and scheduled rows. */
export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const rows = await db`SELECT * FROM wallpapers ORDER BY sort_order ASC, id DESC`;
    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        is_featured: parseDbBool(r.is_featured),
        is_draft: parseDbBool(r.is_draft),
      }))
    );
  } catch (error) {
    console.error('admin wallpapers list error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

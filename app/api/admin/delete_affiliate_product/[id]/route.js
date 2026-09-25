import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';
import { ensureAffiliateTables } from '@/lib/affiliate';

export async function DELETE(req, { params }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await params;

  try {
    await ensureAffiliateTables();
    await db`DELETE FROM affiliate_products WHERE id = ${id}`;
    // The daily rows would otherwise keep counting towards the totals of a
    // product nobody can see or edit any more.
    await db`DELETE FROM affiliate_clicks_daily WHERE product_id = ${id}`;
    publishChanges('affiliateProducts');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('delete_affiliate_product error:', error.message);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}

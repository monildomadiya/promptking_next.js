import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';
import { ensureAffiliateTables } from '@/lib/affiliate';

/** One-click switches in the product table. Whitelisted: the column name is SQL. */
const FIELDS = new Set(['is_active', 'is_featured']);

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    await ensureAffiliateTables();
    const { id, field, value } = await req.json();
    if (!id || !FIELDS.has(field)) {
      return NextResponse.json({ error: 'Unknown field' }, { status: 400 });
    }
    await db`UPDATE affiliate_products SET ${db(field)} = ${value ? 1 : 0} WHERE id = ${id}`;
    publishChanges('affiliateProducts');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('affiliate_product_toggle error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';

export async function DELETE(req, { params }) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;

  try {
    // Nothing references a FAQ, so this is the whole job. order_num is left
    // alone: it only has to sort, and the gap a delete leaves behind changes no
    // ordering that anyone can see.
    await db`DELETE FROM faqs WHERE id = ${id}`;

    publishChanges('faqs');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete FAQ error:', error.message);
    return NextResponse.json({ error: 'Failed to delete FAQ' }, { status: 500 });
  }
}

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
    await db`DELETE FROM wallpapers WHERE id=${id}`;
    publishChanges('wallpapers');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete wallpaper error:', error.message);
    return NextResponse.json({ error: 'Failed to delete wallpaper' }, { status: 500 });
  }
}

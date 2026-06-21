export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAdminAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { cacheInvalidate } from '@/lib/cache';

export async function POST(req) {
  const isAdmin = await getAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

  try {
    const { key, is_featured } = await req.json();
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    await db`
      UPDATE prompts SET is_featured = ${is_featured ? 1 : 0} WHERE prompt_key = ${key}
    `;

    try { revalidatePath('/', 'layout'); } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('toggle_featured error:', error);
    return NextResponse.json({ error: 'Failed to update featured status' }, { status: 500 });
  }
}

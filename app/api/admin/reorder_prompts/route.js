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
    const { orderedKeys } = await req.json();
    if (!Array.isArray(orderedKeys) || orderedKeys.length === 0) {
      return NextResponse.json({ error: 'orderedKeys must be a non-empty array' }, { status: 400 });
    }

    // Ensure sort_order column exists (auto-migrate)
    try {
      await db`ALTER TABLE prompts ADD COLUMN sort_order INT DEFAULT 0`;
    } catch (e) {
      // Column already exists — that's fine
    }

    // Update each prompt's sort_order in a loop
    for (let i = 0; i < orderedKeys.length; i++) {
      await db`UPDATE prompts SET sort_order = ${i} WHERE prompt_key = ${orderedKeys[i]}`;
    }

    // Invalidate caches so live site reflects new order
    cacheInvalidate('all_prompts_listing');
    try { revalidatePath('/', 'layout'); } catch (e) {}

    return NextResponse.json({ success: true, updated: orderedKeys.length });
  } catch (error) {
    console.error('reorder_prompts error:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}

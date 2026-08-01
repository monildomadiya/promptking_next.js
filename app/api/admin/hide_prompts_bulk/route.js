export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';

/**
 * Bulk hide/show, the other half of the dashboard's bulk toolbar that had no
 * route behind it.
 *
 * Hiding sets `is_draft`, which is the flag the dashboard already renders as a
 * DRAFT badge and filters by under "Status: draft", and the one the sitemap
 * already excludes.
 */
export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { keys, hide } = await req.json();
    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: 'keys must be a non-empty array' }, { status: 400 });
    }

    await db`UPDATE prompts SET is_draft = ${hide ? 1 : 0} WHERE prompt_key IN ${keys}`;
    publishChanges('prompts');

    return NextResponse.json({ success: true, updated: keys.length });
  } catch (error) {
    console.error('hide_prompts_bulk error:', error);
    return NextResponse.json({ error: 'Bulk visibility update failed' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';

/**
 * Bulk delete from the admin prompt table.
 *
 * The dashboard has been calling this endpoint since the bulk-select UI was
 * built, but the route never existed — the request 404'd and the toast said
 * "Bulk deletion failed" with nothing deleted.
 */
export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { keys } = await req.json();
    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: 'keys must be a non-empty array' }, { status: 400 });
    }

    await db`DELETE FROM prompts WHERE prompt_key IN ${keys}`;
    publishChanges('prompts');

    return NextResponse.json({ success: true, deleted: keys.length });
  } catch (error) {
    console.error('delete_prompts_bulk error:', error);
    return NextResponse.json({ error: 'Bulk delete failed' }, { status: 500 });
  }
}

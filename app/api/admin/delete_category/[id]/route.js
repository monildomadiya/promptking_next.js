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
    // Same reasoning as delete_wallpaper_category: no FK is clearing this for
    // us, so the prompts that pointed here would keep a category_id naming a
    // row that no longer exists. They'd still render — the home page shows
    // everything under "All" and only the AI Type chips filter on this column —
    // so the damage would be invisible: a prompt that looks fine while holding
    // an id no admin screen can display or correct, and a related-prompts query
    // on the prompt page that joins against nothing. Nulling it puts them back
    // in the uncategorised state the modal can actually edit.
    await db`UPDATE prompts SET category_id = NULL WHERE category_id = ${id}`;
    await db`DELETE FROM categories WHERE id = ${id}`;

    publishChanges('categories', 'prompts');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete category error:', error.message);
    return NextResponse.json({ error: 'Failed to delete AI Type' }, { status: 500 });
  }
}

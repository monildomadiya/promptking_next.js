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
    // This one does not get the null-the-reference treatment the other two
    // categories get, because here the reference is what decides what the row
    // *is*. A listicle is a prompt with website_category_id set — that is the
    // whole definition, and lib/data.js selects the home page with
    // `website_category_id IS NULL OR = ''`. So nulling the column would not
    // orphan those rows, it would convert them: every listicle under this
    // category would quietly reappear on the home page as an ordinary prompt,
    // rendered by a template that knows nothing about sub_prompts. Deleting
    // them instead would be worse. Refuse, say how many are in the way, and let
    // the admin move or delete them deliberately.
    const [usage] = await db`
      SELECT COUNT(*) AS total_listicles FROM prompts WHERE website_category_id = ${id}
    `;
    const inUse = parseInt(usage?.total_listicles) || 0;
    if (inUse > 0) {
      return NextResponse.json({
        error: `This category still holds ${inUse} listicle${inUse === 1 ? '' : 's'}. ` +
               `Move ${inUse === 1 ? 'it' : 'them'} to another category or delete ${inUse === 1 ? 'it' : 'them'} first.`
      }, { status: 409 });
    }

    await db`DELETE FROM website_categories WHERE id = ${id}`;

    publishChanges('websiteCategories', 'websiteCategoriesSsr', 'websiteCategoriesPage');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete website category error:', error.message);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

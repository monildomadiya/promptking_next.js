import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAdminAuth } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';

export async function DELETE(req, { params }) {
  const isAdmin = await getAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams.id;
  try {
    await db`DELETE FROM prompts WHERE prompt_key=${id}`;
    publishChanges('prompts');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete prompt error:', error);
    return NextResponse.json({ error: 'Failed to delete prompt' }, { status: 500 });
  }
}

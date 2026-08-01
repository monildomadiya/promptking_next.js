export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getAdminAuth } from '@/lib/auth';
import { publishChanges } from '@/lib/publish';

export async function POST(req) {
  const isAdmin = await getAdminAuth(req);
  if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 401 });

  try {
    const { key, field, value, pin } = await req.json();
    if (!key || !field) return NextResponse.json({ error: 'Key and field are required' }, { status: 400 });

    // Only allow safe fields to be toggled
    const allowedFields = ['is_premium', 'is_featured'];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Field not allowed' }, { status: 400 });
    }

    if (field === 'is_premium') {
      if (value && pin) {
        await db`UPDATE prompts SET is_premium = 1, password = ${pin} WHERE prompt_key = ${key}`;
      } else {
        await db`UPDATE prompts SET is_premium = ${value ? 1 : 0} WHERE prompt_key = ${key}`;
      }
    } else if (field === 'is_featured') {
      await db`UPDATE prompts SET is_featured = ${value ? 1 : 0} WHERE prompt_key = ${key}`;
    }

    // Same as toggle_featured: the cache import was here, the call was not, so
    // a premium/free flip kept serving the old flag until the TTL ran out.
    publishChanges('prompts');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('toggle_status error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(req) {
  const session = await getSession();
  const isAdmin = !!session?.isAdmin;
  return NextResponse.json({ isAdmin });
}

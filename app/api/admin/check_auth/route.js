export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/auth';

export async function GET(req) {
  const isAdmin = await getAdminAuth(req);
  return NextResponse.json({ isAdmin });
}

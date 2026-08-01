export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  return NextResponse.json([]);
}

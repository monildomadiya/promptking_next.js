export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const rows = await db`SELECT * FROM authors ORDER BY id DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json([]);
  }
}

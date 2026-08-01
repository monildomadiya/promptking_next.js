import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
export async function GET(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const rows = await db`DESCRIBE website_categories`;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}

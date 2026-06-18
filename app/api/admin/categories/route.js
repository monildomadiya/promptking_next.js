export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    const rows = await db`SELECT * FROM categories ORDER BY name ASC`;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json([]);
  }
}

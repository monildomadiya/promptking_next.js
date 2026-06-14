import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    const rows = await db`SELECT * FROM users ORDER BY id DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json([]);
  }
}

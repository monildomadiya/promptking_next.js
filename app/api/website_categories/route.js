import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    const rows = await db`SELECT * FROM website_categories ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Fetch website categories error:', error.message);
    return NextResponse.json([]);
  }
}

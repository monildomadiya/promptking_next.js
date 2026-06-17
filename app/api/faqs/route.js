import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    const rows = await db`SELECT * FROM faqs ORDER BY id DESC`;
    const response = NextResponse.json(rows);
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    return response;
  } catch (error) {
    console.error('DATABASE ERROR (fetch faqs):', error.message);
    return NextResponse.json([]);
  }
}

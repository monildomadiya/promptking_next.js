import { NextResponse } from 'next/server';
import db from '@/lib/db';
export async function GET() {
  try {
    const rows = await db`DESCRIBE website_categories`;
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: error.message });
  }
}

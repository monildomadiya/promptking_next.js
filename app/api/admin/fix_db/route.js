import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req) {
  try {
    const res = await db`SHOW TRIGGERS`;
    return NextResponse.json({ success: true, timestamp: Date.now(), res });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

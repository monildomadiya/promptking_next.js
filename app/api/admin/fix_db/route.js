import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const desc = await db`DESCRIBE prompts`;
    return NextResponse.json({ success: true, columns: desc.map(c => c.Field) });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

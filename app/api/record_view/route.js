import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    try {
      await db`UPDATE prompts SET view_count = COALESCE(view_count, 0) + 1 WHERE prompt_key = ${key}`;
      try {
        await db`INSERT INTO analytics_events (event_type, item_key) VALUES ('view', ${key})`;
      } catch (e) {
        // Fallback if schema doesn't match perfectly, ignore
      }
    } catch (colErr) {
      if (colErr.code !== 'ER_NO_SUCH_TABLE') throw colErr;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_view error:', error.message);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    try {
      await db`UPDATE prompts SET unlock_count = COALESCE(unlock_count, 0) + 1 WHERE prompt_key = ${key} OR slug = ${key}`;
      try {
        await db`INSERT INTO analytics_events (event_type, item_key) VALUES ('unlock', ${key})`;
      } catch (e) {
        // Fallback
      }
    } catch (colErr) {
      if (colErr.code !== 'ER_NO_SUCH_TABLE') throw colErr;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_unlock error:', error.message);
    return NextResponse.json({ error: 'Failed to record unlock' }, { status: 500 });
  }
}

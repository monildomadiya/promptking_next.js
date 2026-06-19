import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    // Update prompt copy counter
    await db`
      UPDATE prompts 
      SET copy_count = COALESCE(copy_count, 0) + 1 
      WHERE prompt_key = ${key} OR slug = ${key}
    `;

    // Try to insert into analytics_events (non-critical)
    try {
      await db`
        INSERT INTO analytics_events (event_type, item_key, created_at) 
        VALUES ('copy', ${key}, NOW())
      `;
    } catch (e) {
      // analytics_events table may not exist — that's ok
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_copy error:', error.message);
    return NextResponse.json({ error: 'Failed to record copy' }, { status: 500 });
  }
}

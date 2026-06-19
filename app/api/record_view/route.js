import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    // Update prompt view counter (match by prompt_key OR slug)
    const result = await db`
      UPDATE prompts 
      SET view_count = COALESCE(view_count, 0) + 1 
      WHERE prompt_key = ${key} OR slug = ${key}
    `;

    // Try to insert into analytics_events (non-critical)
    try {
      await db`
        INSERT INTO analytics_events (event_type, item_key, created_at) 
        VALUES ('view', ${key}, NOW())
      `;
    } catch (e) {
      // analytics_events table may not exist — that's ok, view_count is the source of truth
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_view error:', error.message);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}

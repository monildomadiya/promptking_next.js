import { NextResponse } from 'next/server';
import db from '@/lib/db';



export async function POST(req) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    // Update prompt view counter (match by prompt_key OR slug)
    await db`
      UPDATE prompts 
      SET view_count = COALESCE(view_count, 0) + 1 
      WHERE prompt_key = ${key} OR slug = ${key}
    `;

    // Record daily view in analytics_daily
    try {
      await db`
        INSERT INTO analytics_daily (date, views, copies, unlocks) 
        VALUES (CURDATE(), 1, 0, 0)
        ON DUPLICATE KEY UPDATE views = views + 1
      `;
    } catch (e) {
      console.warn('analytics_daily insert failed:', e.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_view error:', error.message);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}

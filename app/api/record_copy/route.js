import { NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureAnalyticsTable() {
  try {
    await db`
      CREATE TABLE IF NOT EXISTS analytics_daily (
        date DATE PRIMARY KEY,
        views INT DEFAULT 0,
        copies INT DEFAULT 0,
        unlocks INT DEFAULT 0
      )
    `;
  } catch (e) {}
}

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

    // Record daily copy in analytics_daily
    try {
      await ensureAnalyticsTable();
      await db`
        INSERT INTO analytics_daily (date, views, copies, unlocks) 
        VALUES (CURDATE(), 0, 1, 0)
        ON DUPLICATE KEY UPDATE copies = copies + 1
      `;
    } catch (e) {
      console.warn('analytics_daily insert failed:', e.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_copy error:', error.message);
    return NextResponse.json({ error: 'Failed to record copy' }, { status: 500 });
  }
}

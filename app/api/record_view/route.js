import { NextResponse } from 'next/server';
import db from '@/lib/db';

async function ensureAnalyticsTable() {
  try {
    await db`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        item_key VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at)
      )
    `;
  } catch (e) {
    // Ignore — table already exists or DB issue
  }
}

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

    // Insert into analytics_events (auto-create table if needed)
    try {
      await ensureAnalyticsTable();
      await db`
        INSERT INTO analytics_events (event_type, item_key, created_at) 
        VALUES ('view', ${key}, NOW())
      `;
    } catch (e) {
      console.warn('analytics_events insert failed:', e.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_view error:', error.message);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}

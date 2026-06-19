import { NextResponse } from 'next/server';
import db from '@/lib/db';

// Ensure the analytics_events table exists before writing
async function ensureAnalyticsTable() {
  try {
    await db`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        event_type  VARCHAR(20)  NOT NULL,
        item_key    VARCHAR(255) NOT NULL,
        created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at)
      )
    `;
  } catch (e) {
    // Ignore — table may already exist or DB may not support DDL
  }
}

export async function POST(req) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    // Update prompt counter
    await db`UPDATE prompts SET view_count = COALESCE(view_count, 0) + 1 WHERE prompt_key = ${key}`;

    // Insert analytics event (create table first if needed)
    try {
      await ensureAnalyticsTable();
      await db`INSERT INTO analytics_events (event_type, item_key) VALUES ('view', ${key})`;
    } catch (e) {
      // Non-critical — counter update above is the source of truth
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_view error:', error.message);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}

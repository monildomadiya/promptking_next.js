import { NextResponse } from 'next/server';
import db from '@/lib/db';

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
    // Ignore
  }
}

export async function POST(req) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    // Update prompt counter
    await db`UPDATE prompts SET copy_count = COALESCE(copy_count, 0) + 1 WHERE prompt_key = ${key} OR slug = ${key}`;

    // Insert analytics event
    try {
      await ensureAnalyticsTable();
      await db`INSERT INTO analytics_events (event_type, item_key) VALUES ('copy', ${key})`;
    } catch (e) {
      // Non-critical
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('record_copy error:', error.message);
    return NextResponse.json({ error: 'Failed to record copy' }, { status: 500 });
  }
}

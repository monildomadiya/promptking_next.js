import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await db`
        INSERT INTO site_settings (setting_key, setting_value) 
        VALUES (${key}, ${value})
        ON DUPLICATE KEY UPDATE setting_value = ${value}
      `;
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

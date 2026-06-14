import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    const rows = await db`SELECT * FROM site_settings`;
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Fetch settings error:', error.message);
    // Return empty settings so client components degrade gracefully
    return NextResponse.json({});
  }
}

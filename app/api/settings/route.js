import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheGet, cacheSet, CACHE_KEYS } from '@/lib/cache';
import { liveJson } from '@/lib/httpCache';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes; admin saves clear it immediately

export async function GET(req) {
  try {
    // Serve from cache if available
    const cached = cacheGet(CACHE_KEYS.settings);
    if (cached) return liveJson(req, cached, { headers: { 'X-Cache': 'HIT' } });

    const rows = await db`SELECT * FROM site_settings`;
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    cacheSet(CACHE_KEYS.settings, settings, CACHE_TTL);

    return liveJson(req, settings, { headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    console.error('Fetch settings error:', error.message);
    // Return empty settings so client components degrade gracefully
    return NextResponse.json({});
  }
}

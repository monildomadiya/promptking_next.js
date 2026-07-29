import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/cache';

const CACHE_KEY = 'api_settings';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes (settings rarely change)

export async function GET(req) {
  try {
    // Serve from cache if available
    const cached = cacheGet(CACHE_KEY);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');
      res.headers.set('X-Cache', 'HIT');
      return res;
    }

    const rows = await db`SELECT * FROM site_settings`;
    const settings = {};
    rows.forEach(r => { settings[r.setting_key] = r.setting_value; });

    cacheSet(CACHE_KEY, settings, CACHE_TTL);

    const res = NextResponse.json(settings);
    res.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');
    res.headers.set('X-Cache', 'MISS');
    return res;
  } catch (error) {
    console.error('Fetch settings error:', error.message);
    // Return empty settings so client components degrade gracefully
    return NextResponse.json({});
  }
}

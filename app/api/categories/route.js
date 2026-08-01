import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheGet, cacheSet, CACHE_KEYS } from '@/lib/cache';
import { liveJson } from '@/lib/httpCache';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes; admin saves clear it immediately

export async function GET(req) {
  try {
    // Serve from cache if available
    const cached = cacheGet(CACHE_KEYS.categories);
    if (cached) return liveJson(req, cached, { headers: { 'X-Cache': 'HIT' } });

    const rows = await db`SELECT id, name, slug FROM categories ORDER BY name ASC`;
    cacheSet(CACHE_KEYS.categories, rows, CACHE_TTL);

    return liveJson(req, rows, { headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    console.error('Fetch categories error:', error.message);
    return NextResponse.json([]);
  }
}

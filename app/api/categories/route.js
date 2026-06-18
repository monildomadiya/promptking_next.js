import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/cache';

const CACHE_KEY = 'api_categories';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(req) {
  try {
    // Serve from cache if available
    const cached = cacheGet(CACHE_KEY);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.headers.set('X-Cache', 'HIT');
      return res;
    }

    const rows = await db`SELECT id, name, slug FROM categories ORDER BY name ASC`;
    cacheSet(CACHE_KEY, rows, CACHE_TTL);

    const res = NextResponse.json(rows);
    res.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.headers.set('X-Cache', 'MISS');
    return res;
  } catch (error) {
    console.error('Fetch categories error:', error.message);
    return NextResponse.json([]);
  }
}

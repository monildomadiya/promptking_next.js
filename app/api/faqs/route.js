import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheGet, cacheSet, CACHE_KEYS } from '@/lib/cache';
import { liveJson } from '@/lib/httpCache';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes; admin saves clear it immediately

export async function GET(req) {
  try {
    const cached = cacheGet(CACHE_KEYS.faqs);
    if (cached) return liveJson(req, cached, { headers: { 'X-Cache': 'HIT' } });

    const rows = await db`SELECT * FROM faqs ORDER BY id DESC`;
    cacheSet(CACHE_KEYS.faqs, rows, CACHE_TTL);

    return liveJson(req, rows, { headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    console.error('DATABASE ERROR (fetch faqs):', error.message);
    return NextResponse.json([]);
  }
}

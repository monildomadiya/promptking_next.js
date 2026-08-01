import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cacheGet, cacheSet, CACHE_KEYS } from '@/lib/cache';
import { liveJson } from '@/lib/httpCache';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes; admin saves clear it immediately

export async function GET(req) {
  try {
    // Serve from cache if available
    const cached = cacheGet(CACHE_KEYS.websiteCategories);
    if (cached) return liveJson(req, cached, { headers: { 'X-Cache': 'HIT' } });

    const rows = await db`SELECT id, name, slug, image_url, tag FROM website_categories ORDER BY created_at DESC`;
    cacheSet(CACHE_KEYS.websiteCategories, rows, CACHE_TTL);

    return liveJson(req, rows, { headers: { 'X-Cache': 'MISS' } });
  } catch (error) {
    console.error('Fetch website categories error:', error.message);
    return NextResponse.json([]);
  }
}

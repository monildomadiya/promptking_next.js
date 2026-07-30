import { NextResponse } from 'next/server';
import { fetchAllData } from '@/lib/data';

export async function GET(req) {
  // ?light=1 omits prompt_text, which is ~82% of this payload (206 KB of 252 KB
  // across 102 prompts). Callers that only render cards — suggestion rails,
  // grids — should use it; only full-text search needs the bodies.
  const light = new URL(req.url).searchParams.get('light') === '1';
  const { prompts, categories } = await fetchAllData({ includePromptText: !light });
  const response = NextResponse.json({ prompts, likes: {}, categories });
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

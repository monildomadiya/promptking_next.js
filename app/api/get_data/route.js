import { fetchAllData } from '@/lib/data';
import { liveJson } from '@/lib/httpCache';

export async function GET(req) {
  // ?light=1 omits prompt_text, which is ~82% of this payload (206 KB of 252 KB
  // across 102 prompts). Callers that only render cards — suggestion rails,
  // grids — should use it; only full-text search needs the bodies.
  const light = new URL(req.url).searchParams.get('light') === '1';
  const { prompts, categories } = await fetchAllData({ includePromptText: !light });
  // Was `no-store`: correct about freshness, but it meant re-downloading the
  // whole library on every load. The conditional request costs one round trip
  // and returns 304 until something actually changes.
  return liveJson(req, { prompts, likes: {}, categories });
}

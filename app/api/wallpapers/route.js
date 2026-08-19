import { fetchWallpapers } from '@/lib/wallpapers';
import { liveJson } from '@/lib/httpCache';

export async function GET(req) {
  const wallpapers = await fetchWallpapers();
  return liveJson(req, { wallpapers });
}

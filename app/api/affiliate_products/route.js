import { NextResponse } from 'next/server';
import { fetchAffiliateProducts, getAffiliateSettings } from '@/lib/affiliate';
import { liveJson } from '@/lib/httpCache';

export const dynamic = 'force-dynamic';

/** Public listing for the client-side shelves (prompt pages). */
export async function GET(req) {
  try {
    const settings = await getAffiliateSettings();
    if (settings.affiliate_enabled !== '1') return liveJson(req, { enabled: false, products: [] });
    const products = await fetchAffiliateProducts();
    return liveJson(req, {
      enabled: true,
      showOnPrompts: settings.affiliate_show_on_prompts === '1',
      // Products mixed into each page of the home-page prompt grid; 0 is off.
      gridCount: [0, 4, 8].includes(Number(settings.affiliate_grid_count)) ? Number(settings.affiliate_grid_count) : 4,
      heading: settings.affiliate_prompt_heading,
      disclosure: settings.affiliate_disclosure,
      products,
    });
  } catch (error) {
    console.error('affiliate_products error:', error.message);
    return NextResponse.json({ enabled: false, products: [] });
  }
}

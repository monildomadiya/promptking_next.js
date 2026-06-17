import { NextResponse } from 'next/server';
import { fetchAllData } from '@/lib/data';

export async function GET(req) {
  const { prompts, categories } = await fetchAllData();
  const response = NextResponse.json({ prompts, likes: {}, categories });
  response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  return response;
}

import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';

export async function GET(req) {
  try {
    await clearSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}

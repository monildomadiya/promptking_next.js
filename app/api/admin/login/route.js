
import { NextResponse } from 'next/server';
import { setSession } from '@/lib/session';

export async function POST(req) {
  try {
    const body = await req.json();
    const { password } = body;
    if (password === (process.env.ADMIN_PASSWORD || 'admin')) {
      await setSession({ isAdmin: true });
      return NextResponse.json({ status: "success", token: "session-cookie-handles-this" });
    } else {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to parse body" }, { status: 400 });
  }
}

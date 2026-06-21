import { NextResponse } from 'next/server';
import { setSession, encrypt } from '@/lib/session';

export async function POST(req) {
  try {
    const body = await req.json();
    const { password } = body;
    if (password === (process.env.ADMIN_PASSWORD || 'admin')) {
      // Set cookie-based session
      await setSession({ isAdmin: true });
      // Also return a real JWT so the x-admin-token header can be verified on subsequent requests
      const token = await encrypt({ isAdmin: true });
      return NextResponse.json({ status: 'success', token });
    } else {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to parse body' }, { status: 400 });
  }
}

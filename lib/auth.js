import { getSession, encrypt } from '@/lib/session';

/**
 * Check admin auth from either:
 * 1. Session cookie (set on login)
 * 2. x-admin-token header (JWT token stored in localStorage)
 */
export async function getAdminAuth(req) {
  // 1. Try cookie session first
  try {
    const session = await getSession();
    if (session?.isAdmin) return true;
  } catch (e) {}

  // 2. Fall back to x-admin-token header (JWT signed with same secret)
  try {
    const token = req.headers.get('x-admin-token');
    if (token && token !== 'session-cookie-handles-this') {
      const { jwtVerify } = await import('jose');
      const secretKey = process.env.SESSION_SECRET || 'secret';
      const key = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      if (payload?.isAdmin) return true;
    }
  } catch (e) {}

  // 3. Check if ADMIN_PASSWORD matches the token directly (dev fallback)
  try {
    const token = req.headers.get('x-admin-token');
    if (token && token === process.env.ADMIN_PASSWORD) return true;
  } catch (e) {}

  return false;
}

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { publishChanges } from '@/lib/publish';
import { requireAdmin } from '@/lib/auth';

export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await db`
        INSERT INTO site_settings (setting_key, setting_value) 
        VALUES (${key}, ${value})
        ON DUPLICATE KEY UPDATE setting_value = ${value}
      `;
    }

    // Settings feed the header, footer, ad slots and social links, so the
    // rendered pages have to go too — clearing only the data cache left every
    // already-built page showing the old values.
    publishChanges('settings');

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

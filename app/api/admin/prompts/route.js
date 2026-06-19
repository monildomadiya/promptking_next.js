export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/session';

// Handles MariaDB tinyint(1) which can come back as Buffer, number, boolean, or string
const parseDbBool = (val) => {
  if (val === null || val === undefined) return false;
  if (Buffer.isBuffer(val)) return val[0] === 1;
  return val == 1 || val === true || val === 'true';
};

export async function GET(req) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  try {
    let rows;
    try {
      rows = await db`SELECT * FROM prompts WHERE website_category_id IS NULL OR website_category_id = '' ORDER BY sort_order ASC, prompt_key ASC`;
    } catch (colErr) {
      if (colErr.message.includes('Unknown column')) {
        rows = await db`SELECT * FROM prompts`;
      } else {
        throw colErr;
      }
    }
    const formatted = rows.map(r => ({
      ...r,
      copy_count:       Number(r.copy_count || 0),
      unlock_count:     Number(r.unlock_count || 0),
      like_count:       Number(r.like_count || 0),
      view_count:       Number(r.view_count || 0),
      correct_attempts: Number(r.correct_attempts || 0),
      wrong_attempts:   Number(r.wrong_attempts || 0),
      // Use parseDbBool to correctly handle MariaDB Buffer tinyint(1) values
      is_featured:      parseDbBool(r.is_featured),
      is_premium:       parseDbBool(r.is_premium),
      publish_date:     r.publish_date,
      metaTitle:        r.meta_title
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('ADMIN PROMPTS DB ERROR:', error.message);
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

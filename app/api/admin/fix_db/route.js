import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req) {
  try {
    let results = [];

    // Add author_id to prompts
    try {
      await db`ALTER TABLE prompts ADD COLUMN author_id INT DEFAULT NULL`;
      results.push("Added author_id to prompts table.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        results.push("author_id already exists in prompts.");
      } else {
        throw e;
      }
    }

    // Add author_id to blogs
    try {
      await db`ALTER TABLE blogs ADD COLUMN author_id INT DEFAULT NULL`;
      results.push("Added author_id to blogs table.");
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        results.push("author_id already exists in blogs.");
      } else {
        throw e;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('FIX DB ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

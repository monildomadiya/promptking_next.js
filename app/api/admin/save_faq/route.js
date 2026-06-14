import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, question, answer, order_num, is_active } = body;
    
    if (id) {
      await db`UPDATE faqs SET question=${question}, answer=${answer}, order_num=${order_num}, is_active=${is_active} WHERE id=${id}`;
    } else {
      await db`INSERT INTO faqs (question, answer, order_num, is_active) VALUES (${question}, ${answer}, ${order_num}, ${is_active})`;
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * Logo upload from the Branding panel — same shape as upload_image, but the
 * panel posts the file under `logo` and reads back `logoUrl`, and the route it
 * posts to was never created. Uploading a logo has always failed.
 */
export async function POST(req) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const formData = await req.formData();
    const file = formData.get('logo');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadToCloudinary(buffer, {
      folder: 'promptking/branding',
      resource_type: 'image',
    });

    return NextResponse.json({ status: 'success', logoUrl: result.secure_url });
  } catch (error) {
    console.error('upload_logo error:', error);
    return NextResponse.json({ error: 'Logo upload failed' }, { status: 500 });
  }
}

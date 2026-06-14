
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(req) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "Admin access required" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const result = await uploadToCloudinary(buffer, {
      folder: 'promptking/images',
      resource_type: 'image'
    });

    const imageUrl = result.secure_url;
    return NextResponse.json({ status: "success", imageUrl });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }
  
  const imagePath = path.join(process.cwd(), 'data', 'images', name);
  
  if (!fs.existsSync(imagePath)) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
  
  const imageBuffer = fs.readFileSync(imagePath);
  const ext = path.extname(name).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  
  return new NextResponse(imageBuffer, {
    headers: {
      'Content-Type': mimeTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

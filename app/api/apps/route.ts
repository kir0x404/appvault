import { NextRequest, NextResponse } from 'next/server';
import { getApps, saveApp } from '@/lib/store';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  const apps = getApps();
  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('x-admin-token');
  if (authHeader !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const app = {
    id: uuidv4(),
    name: body.name,
    description: body.description,
    image: body.image,
    downloadLink: body.downloadLink,
    category: body.category || 'General',
    version: body.version || '1.0',
    size: body.size || 'Unknown',
    downloads: 0,
    createdAt: new Date().toISOString(),
  };
  saveApp(app);
  return NextResponse.json(app, { status: 201 });
}

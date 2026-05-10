import { NextRequest, NextResponse } from 'next/server';

const DJANGO = process.env.DJANGO_API_URL ?? 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const djangoRes = await fetch(`${DJANGO}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await djangoRes.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
    }

    return NextResponse.json(data, { status: djangoRes.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

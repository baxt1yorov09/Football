import { NextRequest, NextResponse } from 'next/server';

const DJANGO = process.env.DJANGO_API_URL ?? 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization');
  console.log('Token received:', token ? token.substring(0, 30) + '...' : 'none');
  
  if (!token) {
    console.log('ERROR: No authorization token found');
    return NextResponse.json({ detail: 'Unauthorized - No token' }, { status: 401 });
  }
  
  // Ensure token has Bearer prefix
  if (!token.toLowerCase().startsWith('bearer ')) {
    console.log('ERROR: Token does not start with Bearer');
    return NextResponse.json({ detail: 'Unauthorized - Invalid token format' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') ?? '';

  try {
    // Body ni to'liq Buffer ga o'qiymiz — chunked encoding yo'qoladi
    const bodyBuffer = Buffer.from(await req.arrayBuffer());

    console.log('Content-Type:', contentType);
    console.log('Body size:', bodyBuffer.length, 'bytes');
    console.log('Token sent to Django:', token.substring(0, 30) + '...');

    const djangoRes = await fetch(`${DJANGO}/api/applications/`, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': contentType,        // boundary saqlanadi
        'Content-Length': String(bodyBuffer.length), // chunked emas
      },
      body: bodyBuffer,
    });

    const text = await djangoRes.text();
    console.log('Django status:', djangoRes.status);
    
    // Log 403 errors for debugging
    if (djangoRes.status === 403) {
      console.log('Django 403 response:', text);
      console.log('Token that was sent:', token.substring(0, 50) + '...');
    }
    console.log('Django response:', text.slice(0, 300));

    // Handle 403 Forbidden - check if it's a business logic error or token issue
    if (djangoRes.status === 403) {
      let errorData: any;
      try {
        errorData = JSON.parse(text);
      } catch {
        errorData = { error: text };
      }
      
      // Check if it's a pending application error (business logic)
      const isPendingError = errorData?.error?.includes?.('allaqachon kutilayotgan') || 
                            errorData?.error?.includes?.('pending');
      
      if (isPendingError) {
        // Pass through the original Django error message
        return NextResponse.json(
          { 
            error: errorData.error || 'Sizda allaqachon kutilayotgan ariza mavjud',
            code: 'PENDING_APPLICATION'
          },
          { status: 403 }
        );
      }
      
      // Otherwise assume token issue
      return NextResponse.json(
        { 
          error: 'Ruxsat yo\'q', 
          detail: errorData?.error || 'Token noto\'g\'ri yoki muddati o\'tgan.',
          code: 'TOKEN_INVALID'
        },
        { status: 403 }
      );
    }

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: 'Server xatosi', detail: text.slice(0, 200) },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: djangoRes.status });

  } catch (e: any) {
    console.error('Route error:', e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization');
  if (!token) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });
  }

  try {
    const djangoRes = await fetch(`${DJANGO}/api/applications/`, {
      headers: { Authorization: token },
      cache: 'no-store',
    });
    const data = await djangoRes.json();
    return NextResponse.json(data, { status: djangoRes.status });
  } catch {
    return NextResponse.json({ error: 'Server xatosi' }, { status: 502 });
  }
}

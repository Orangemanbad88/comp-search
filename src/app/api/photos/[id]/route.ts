import { NextRequest, NextResponse } from 'next/server';
import { retsGetPhoto } from '@/lib/retsClient';

/**
 * Photo proxy — fetches listing photos from RETS and serves them
 * with aggressive caching so we don't hammer the MLS.
 *
 * GET /api/photos/[id]?idx=0
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const idx = parseInt(request.nextUrl.searchParams.get('idx') || '0', 10);

  const retsUrl = process.env.MLS_RETS_URL;
  const username = process.env.MLS_USERNAME;
  const password = process.env.MLS_PASSWORD;

  if (!retsUrl || !username || !password) {
    return new NextResponse('MLS not configured', { status: 503 });
  }

  try {
    const result = await retsGetPhoto(
      {
        loginUrl: retsUrl,
        username,
        password,
        userAgent: process.env.MLS_USER_AGENT || 'CompSearch/1.0',
      },
      id,
      idx,
    );

    if (!result) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(result.data, {
      headers: {
        'Content-Type': result.contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error(`Photo fetch failed for ${id}:${idx}:`, error);
    return new NextResponse(null, { status: 502 });
  }
}

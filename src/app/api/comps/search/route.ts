import { NextRequest, NextResponse } from 'next/server';
import { getActivePropertyService } from '@/services/propertyService';
import { SubjectProperty, SearchMode } from '@/types/property';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject: SubjectProperty = body.subject;
    const mode: SearchMode = body.mode === 'active' ? 'active' : 'sold';

    if (!subject) {
      return NextResponse.json(
        { error: 'Missing subject property' },
        { status: 400 },
      );
    }

    const service = getActivePropertyService();
    const results = await service.searchComps(subject, mode);

    return NextResponse.json({ results, mode });
  } catch (error) {
    console.error('Comp search API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 },
    );
  }
}

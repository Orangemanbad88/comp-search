import { NextResponse } from 'next/server';
import { getMLSPropertyService } from '@/services/mlsPropertyService';

export async function GET() {
  try {
    const service = getMLSPropertyService();
    const listings = await service.getAllActive();
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Listings API error:', error);
    return NextResponse.json([], { status: 500 });
  }
}

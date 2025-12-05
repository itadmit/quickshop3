import { NextRequest, NextResponse } from 'next/server';
import { getStoreBySlug } from '@/lib/utils/store';

/**
 * API Route לקבלת locale של חנות
 * GET /api/stores/{slug}/locale
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  try {
    const store = await getStoreBySlug(slug);
    
    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      locale: store.locale || 'he-IL',
      currency: store.currency || 'ILS',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error loading store locale:', error);
    return NextResponse.json(
      { error: 'Failed to load store locale' },
      { status: 500 }
    );
  }
}


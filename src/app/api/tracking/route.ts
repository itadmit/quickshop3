import { NextRequest, NextResponse } from 'next/server';
import { getActivePixels, getActiveTrackingCodes } from '@/lib/tracking/pixels';
import { getStoreIdBySlug } from '@/lib/utils/store';

/**
 * API Route לטעינת פיקסלים וקודי מעקב
 * GET /api/tracking?storeId=1&placement=head
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeIdParam = searchParams.get('storeId');
  const storeSlug = searchParams.get('storeSlug');
  const placement = searchParams.get('placement') || 'head';

  let storeId: number | null = storeIdParam ? parseInt(storeIdParam) : null;

  // אם אין storeId אבל יש storeSlug, נסה לקבל storeId
  if (!storeId && storeSlug) {
    const id = await getStoreIdBySlug(storeSlug);
    storeId = id;
  }

  if (!storeId) {
    return NextResponse.json(
      { error: 'Store ID or slug required' },
      { status: 400 }
    );
  }

  try {
    const [pixels, codes] = await Promise.all([
      getActivePixels(storeId),
      getActiveTrackingCodes(storeId),
    ]);

    // סינון לפי placement
    const filteredPixels = pixels.filter((p) => p.placement === placement);
    const filteredCodes = codes.filter((c) => c.placement === placement);

    return NextResponse.json({
      pixels: filteredPixels,
      codes: filteredCodes,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error loading tracking:', error);
    return NextResponse.json(
      { error: 'Failed to load tracking' },
      { status: 500 }
    );
  }
}


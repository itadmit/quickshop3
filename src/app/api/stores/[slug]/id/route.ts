import { NextRequest, NextResponse } from 'next/server';
import { getStoreIdBySlug } from '@/lib/utils/store';

/**
 * GET /api/stores/[slug]/id
 * Returns store ID for a given slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const storeId = await getStoreIdBySlug(slug);

    if (!storeId) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ storeId });
  } catch (error: any) {
    console.error('Error getting store ID:', error);
    return NextResponse.json(
      { error: error.message || 'שגיאה בטעינת פרטי החנות' },
      { status: 500 }
    );
  }
}


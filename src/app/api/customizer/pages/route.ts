/**
 * Customizer Module - API Routes
 * GET /api/customizer/pages/:pageType
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPageConfig } from '@/lib/customizer/getPageConfig';
import { getUserFromRequest } from '@/lib/auth';
import { PageType } from '@/lib/customizer/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const storeId = user.store_id;
    const { searchParams } = new URL(request.url);
    
    const pageType = searchParams.get('pageType') as PageType;
    const pageHandle = searchParams.get('handle') || undefined;
    const useDraft = searchParams.get('draft') === 'true';

    if (!pageType) {
      return NextResponse.json(
        { error: 'pageType is required' },
        { status: 400 }
      );
    }

    const config = await getPageConfig(storeId, pageType, pageHandle, useDraft);

    if (!config) {
      return NextResponse.json(
        { error: 'Page config not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error getting page config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


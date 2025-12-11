import { NextRequest, NextResponse } from 'next/server';
import { getStoreBySlug } from '@/lib/utils/store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Store slug is required' },
        { status: 400 }
      );
    }

    const store = await getStoreBySlug(slug);

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        logo: store.logo,
        currency: store.currency,
        locale: store.locale,
      },
    });
  } catch (error: any) {
    console.error('Error fetching store:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store' },
      { status: 500 }
    );
  }
}




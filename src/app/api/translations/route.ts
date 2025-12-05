import { NextRequest, NextResponse } from 'next/server';
import { loadNamespaceTranslations } from '@/lib/i18n/translations';
import { getStoreBySlug } from '@/lib/utils/store';

/**
 * API Route לטעינת תרגומים
 * GET /api/translations?locale=he-IL&namespace=storefront&storeSlug=my-store
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') || 'he-IL';
  const namespace = searchParams.get('namespace') || 'common';
  const storeSlug = searchParams.get('storeSlug');
  
  try {
    // אם יש storeSlug, נסה לקבל locale מהחנות
    let finalLocale = locale;
    if (storeSlug) {
      const store = await getStoreBySlug(storeSlug);
      if (store?.locale) {
        finalLocale = store.locale;
      }
    }
    
    // טעינת תרגומים מ-JSON files
    const translations = await loadNamespaceTranslations(finalLocale, namespace);
    
    return NextResponse.json({
      translations,
      locale: finalLocale,
      namespace,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error loading translations:', error);
    return NextResponse.json(
      { error: 'Failed to load translations' },
      { status: 500 }
    );
  }
}


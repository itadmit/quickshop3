import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

interface GDPRSettings {
  enabled: boolean;
  useCustomText: boolean;
  customPolicyText: string;
  acceptButtonText: string;
  declineButtonText: string;
  bannerPosition: 'bottom' | 'top';
  bannerStyle: 'full-width' | 'box-right' | 'box-left';
  showDeclineButton: boolean;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
}

// GET /api/storefront/[storeSlug]/gdpr - Get GDPR settings for storefront
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;

    // Get store by slug
    const store = await queryOne<{ id: number }>(
      'SELECT id FROM stores WHERE slug = $1 AND is_active = true',
      [storeSlug]
    );

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Get settings from store_settings table
    const result = await queryOne<{ settings: any }>(
      'SELECT settings FROM store_settings WHERE store_id = $1',
      [store.id]
    );

    if (!result) {
      return NextResponse.json({ settings: null });
    }

    const settings = typeof result.settings === 'string' 
      ? JSON.parse(result.settings) 
      : result.settings;

    const gdprSettings = settings.gdprSettings as GDPRSettings | undefined;

    // Only return if enabled
    if (!gdprSettings || !gdprSettings.enabled) {
      return NextResponse.json({ settings: null, enabled: false });
    }

    return NextResponse.json({ 
      settings: gdprSettings,
      enabled: true
    });
  } catch (error: any) {
    console.error('Error fetching GDPR settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GDPR settings' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

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

// GET /api/settings/gdpr - Get GDPR settings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get settings from store_settings table
    const result = await queryOne<{ settings: any }>(
      'SELECT settings FROM store_settings WHERE store_id = $1',
      [user.store_id]
    );

    if (!result) {
      return NextResponse.json({ settings: null });
    }

    const settings = typeof result.settings === 'string' 
      ? JSON.parse(result.settings) 
      : result.settings;

    return NextResponse.json({ settings: settings.gdprSettings || null });
  } catch (error: any) {
    console.error('Error fetching GDPR settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GDPR settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/gdpr - Update GDPR settings
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const gdprSettings: GDPRSettings = await request.json();

    // Get existing settings
    const existing = await queryOne<{ settings: any }>(
      'SELECT settings FROM store_settings WHERE store_id = $1',
      [user.store_id]
    );

    const existingSettings = existing 
      ? (typeof existing.settings === 'string' ? JSON.parse(existing.settings) : existing.settings)
      : {};

    // Merge GDPR settings
    const mergedSettings = {
      ...existingSettings,
      gdprSettings,
    };

    // Update or insert
    await query(
      `INSERT INTO store_settings (store_id, settings, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (store_id) 
       DO UPDATE SET settings = $2, updated_at = now()`,
      [user.store_id, JSON.stringify(mergedSettings)]
    );

    return NextResponse.json({ success: true, settings: gdprSettings });
  } catch (error: any) {
    console.error('Error updating GDPR settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update GDPR settings' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

// GET /api/storefront/stores/[storeId]/settings - Get store settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params;
    const storeIdNum = parseInt(storeId);

    if (isNaN(storeIdNum)) {
      return NextResponse.json(
        { error: 'Invalid store ID' },
        { status: 400 }
      );
    }

    const storeSettings = await queryOne<{
      settings: any;
    }>(
      'SELECT settings FROM store_settings WHERE store_id = $1',
      [storeIdNum]
    );

    // Return default settings if none exist
    const settings = storeSettings?.settings || {
      show_id_number: false,
      show_birth_date: false,
    };

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Error fetching store settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch store settings' },
      { status: 500 }
    );
  }
}




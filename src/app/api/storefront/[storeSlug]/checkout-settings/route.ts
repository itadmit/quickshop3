/**
 * API Route: Get Checkout Settings for Storefront
 * מחזיר את הגדרות הצ'ק אאוט לחנות מסוימת
 */

import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getStoreIdBySlug } from '@/lib/utils/store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  try {
    const { storeSlug } = await params;

    if (!storeSlug) {
      return NextResponse.json({ error: 'storeSlug is required' }, { status: 400 });
    }

    const storeId = await getStoreIdBySlug(storeSlug);
    
    if (!storeId) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Default checkout settings
    const defaultSettings = {
      layout: {
        left_column_color: '#fafafa',
        right_column_color: '#ffffff'
      },
      button: {
        text: 'לתשלום',
        background_color: '#000000',
        text_color: '#ffffff',
        border_radius: '8'
      },
      fields_order: [
        'email',
        'first_name',
        'last_name',
        'phone',
        'city',
        'street',
        'apartment',
        'notes'
      ],
      custom_fields: [],
      show_order_notes: true,
      show_shipping_options: true,
      show_payment_methods: true
    };

    // Get checkout page layout and its sections
    const layoutResult = await query(
      `SELECT pl.id FROM page_layouts pl
       WHERE pl.store_id = $1 AND pl.page_type = 'checkout'
       ORDER BY pl.is_published DESC, pl.updated_at DESC LIMIT 1`,
      [storeId]
    );

    if (layoutResult.length === 0) {
      // Return default settings if no layout found
      return NextResponse.json({
        success: true,
        settings: defaultSettings
      });
    }

    const layoutId = layoutResult[0].id;

    // Get checkout_form section from page_sections
    const sectionResult = await query(
      `SELECT settings_json FROM page_sections 
       WHERE page_layout_id = $1 AND section_type = 'checkout_form'
       LIMIT 1`,
      [layoutId]
    );

    if (sectionResult.length > 0 && sectionResult[0].settings_json) {
      const sectionData = typeof sectionResult[0].settings_json === 'string'
        ? JSON.parse(sectionResult[0].settings_json)
        : sectionResult[0].settings_json;
      
      // settings_json contains { style, settings } - we need the settings part
      const checkoutSettings = sectionData.settings || sectionData;
      
      return NextResponse.json({
        success: true,
        settings: {
          ...defaultSettings,
          ...checkoutSettings
        }
      });
    }

    // Return default settings if no checkout_form section found
    return NextResponse.json({
      success: true,
      settings: defaultSettings
    });

  } catch (error) {
    console.error('Error fetching checkout settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


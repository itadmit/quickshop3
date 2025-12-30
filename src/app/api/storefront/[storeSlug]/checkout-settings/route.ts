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
      show_payment_methods: true,
      terms_checkbox: {
        enabled: false,
        text_before: 'קראתי ואני מסכים/ה ל',
        link_text: 'תקנון האתר',
        terms_page: 'terms',
        open_in: 'modal'
      }
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

    // ✅ קרא sections מ-JSON
    const layoutWithSections = await query<{
      sections_json: any;
    }>(
      `SELECT COALESCE(sections_json, '[]'::jsonb) as sections_json
       FROM page_layouts 
       WHERE id = $1`,
      [layoutId]
    );

    const sectionsJson = layoutWithSections[0]?.sections_json || [];
    const checkoutFormSection = sectionsJson.find((s: any) => s.type === 'checkout_form');

    if (checkoutFormSection && checkoutFormSection.settings) {
      const checkoutSettings = checkoutFormSection.settings;
      
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


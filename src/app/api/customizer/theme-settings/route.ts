/**
 * Customizer Module - Theme Settings API
 * GET/PUT /api/customizer/theme-settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

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

    const result = await query(
      `
      SELECT 
        draft_settings_json as settings_json,
        custom_css,
        custom_js
      FROM store_theme_settings
      WHERE store_id = $1
      `,
      [storeId]
    );

    if (result.length === 0) {
      // Return default settings
      return NextResponse.json({
        settings: {
          colors: {
            primary: '#000000',
            secondary: '#666666',
            accent: '#10B981',
            background: '#FFFFFF',
            text: '#000000',
          },
          typography: {
            headingFont: 'Heebo',
            bodyFont: 'Heebo',
            baseFontSize: 16,
          },
          layout: {
            containerMaxWidth: 1200,
            sectionSpacing: 64,
          },
        },
      });
    }

    return NextResponse.json({
      settings: result[0].settings_json,
      custom_css: result[0].custom_css,
      custom_js: result[0].custom_js,
    });
  } catch (error) {
    console.error('Error getting theme settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const storeId = user.store_id;

    const body = await request.json();
    const { settings, custom_css, custom_js } = body;

    // Update or insert
    await query(
      `
      INSERT INTO store_theme_settings (store_id, draft_settings_json, custom_css, custom_js)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (store_id) 
      DO UPDATE SET 
        draft_settings_json = EXCLUDED.draft_settings_json,
        custom_css = EXCLUDED.custom_css,
        custom_js = EXCLUDED.custom_js,
        updated_at = now()
      `,
      [storeId, JSON.stringify(settings || {}), custom_css || '', custom_js || '']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating theme settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


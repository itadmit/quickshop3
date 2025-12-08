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

    // Get theme settings
    const settingsQuery = `
      SELECT
        sts.*,
        tt.name as theme_name,
        tt.display_name as theme_display_name
      FROM store_theme_settings sts
      LEFT JOIN theme_templates tt ON sts.template_id = tt.id
      WHERE sts.store_id = $1
      LIMIT 1
    `;

    const settingsResult = await query(settingsQuery, [user.store_id]);

    if (settingsResult.rows.length === 0) {
      // Return default New York theme settings
      const defaultSettings = {
        theme: {
          name: 'new-york',
          display_name: 'ניו יורק'
        },
        settings: {
          colors: {
            primary: '#000000',
            secondary: '#666666',
            accent: '#10B981',
            background: '#FFFFFF',
            surface: '#F9FAFB',
            text: '#000000',
            muted: '#6B7280',
            border: '#E5E7EB',
            error: '#EF4444',
            success: '#10B981'
          },
          typography: {
            headingFont: 'Heebo',
            bodyFont: 'Heebo',
            baseFontSize: 16,
            lineHeight: 1.6,
            headingWeight: 700,
            bodyWeight: 400
          },
          layout: {
            containerMaxWidth: 1200,
            containerPadding: 24,
            sectionSpacing: 64,
            gridGap: 24
          },
          buttons: {
            borderRadius: 4,
            padding: '12px 24px',
            primaryStyle: 'solid',
            secondaryStyle: 'outline'
          },
          cards: {
            borderRadius: 8,
            shadow: 'sm',
            hoverEffect: 'lift'
          },
          animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-out'
          }
        },
        customCss: '',
        customJs: '',
        customHeadCode: '',
        isPublished: false
      };

      return NextResponse.json(defaultSettings);
    }

    const settings = settingsResult.rows[0];

    return NextResponse.json({
      theme: {
        name: settings.theme_name,
        display_name: settings.theme_display_name
      },
      settings: settings.draft_settings_json || settings.published_settings_json,
      customCss: settings.custom_css || '',
      customJs: settings.custom_js || '',
      customHeadCode: settings.custom_head_code || '',
      isPublished: settings.published_at !== null
    });
  } catch (error) {
    console.error('Error getting theme settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Update theme settings (changed from PUT to POST for consistency)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { settings, customCss, customJs, customHeadCode, isPublish = false } = body;

    if (!settings) {
      return NextResponse.json(
        { error: 'settings are required' },
        { status: 400 }
      );
    }

    // Get theme template ID
    const themeTemplate = await query(`
      SELECT id FROM theme_templates WHERE name = 'new-york' LIMIT 1
    `);

    const templateId = themeTemplate.rows[0]?.id || 1;

    // Check if theme settings exist
    const existingSettings = await query(`
      SELECT id FROM store_theme_settings WHERE store_id = $1
    `, [user.store_id]);

    if (existingSettings.rows.length > 0) {
      // Update existing settings
      await query(`
        UPDATE store_theme_settings
        SET draft_settings_json = $1,
            custom_css = $2,
            custom_js = $3,
            custom_head_code = $4,
            published_settings_json = CASE WHEN $5 THEN $1 ELSE published_settings_json END,
            published_at = CASE WHEN $5 THEN now() ELSE published_at END,
            updated_at = now()
        WHERE store_id = $6
      `, [
        JSON.stringify(settings),
        customCss || '',
        customJs || '',
        customHeadCode || '',
        isPublish,
        user.store_id
      ]);
    } else {
      // Create new settings
      await query(`
        INSERT INTO store_theme_settings (
          store_id, template_id, published_settings_json, draft_settings_json,
          custom_css, custom_js, custom_head_code, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        user.store_id,
        templateId,
        isPublish ? JSON.stringify(settings) : '{}',
        JSON.stringify(settings),
        customCss || '',
        customJs || '',
        customHeadCode || '',
        isPublish ? new Date() : null
      ]);
    }

    return NextResponse.json({
      success: true,
      message: isPublish ? 'הגדרות פורסמו בהצלחה' : 'הגדרות נשמרו כטיוטה'
    });
  } catch (error) {
    console.error('Error saving theme settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


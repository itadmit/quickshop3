/**
 * Theme Custom Code API
 * GET/POST /api/theme/custom-code
 * ניהול קוד מותאם אישית (CSS, headScripts, bodyScripts)
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

    // טען את הקוד המותאם אישית מ-store_theme_settings
    const result = await query<{
      custom_css: string;
      custom_js: string;
      custom_head_code: string;
    }>(
      `
      SELECT custom_css, custom_js, custom_head_code
      FROM store_theme_settings
      WHERE store_id = $1
      LIMIT 1
      `,
      [user.store_id]
    );

    if (result.length === 0) {
      return NextResponse.json({
        code: {
          css: '',
          headScripts: '',
          bodyScripts: ''
        }
      });
    }

    const settings = result[0];
    
    return NextResponse.json({
      code: {
        css: settings.custom_css || '',
        headScripts: settings.custom_head_code || '',
        bodyScripts: settings.custom_js || ''
      }
    });
  } catch (error) {
    console.error('Error getting custom code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'code is required' },
        { status: 400 }
      );
    }

    // בדוק אם יש הגדרות תבנית קיימות
    const existingSettings = await query(
      `SELECT id FROM store_theme_settings WHERE store_id = $1`,
      [user.store_id]
    );

    if (existingSettings.length > 0) {
      // עדכן את הקוד הקיים
      await query(
        `
        UPDATE store_theme_settings
        SET custom_css = $1,
            custom_head_code = $2,
            custom_js = $3,
            updated_at = now()
        WHERE store_id = $4
        `,
        [
          code.css || '',
          code.headScripts || '',
          code.bodyScripts || '',
          user.store_id
        ]
      );
    } else {
      // צור הגדרות חדשות עם הקוד
      const themeTemplate = await query(
        `SELECT id FROM theme_templates WHERE name = 'new-york' LIMIT 1`
      );
      const templateId = themeTemplate[0]?.id || 1;

      await query(
        `
        INSERT INTO store_theme_settings (
          store_id, template_id, custom_css, custom_head_code, custom_js,
          published_settings_json, draft_settings_json
        ) VALUES ($1, $2, $3, $4, $5, '{}', '{}')
        `,
        [
          user.store_id,
          templateId,
          code.css || '',
          code.headScripts || '',
          code.bodyScripts || ''
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'הקוד נשמר בהצלחה'
    });
  } catch (error) {
    console.error('Error saving custom code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


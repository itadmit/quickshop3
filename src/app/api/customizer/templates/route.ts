/**
 * Customizer Module - Templates API Route
 * GET /api/customizer/templates?type=product
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { TemplateType, PageTemplate, TemplateWidget } from '@/lib/customizer/types';
import { getTemplateConfig } from '@/lib/customizer/getPageConfig';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user.store_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const templateType = searchParams.get('type') as 'product' | 'collection';
    const templateName = searchParams.get('name') || 'default';

    if (!templateType) {
      return NextResponse.json(
        { error: 'template type is required' },
        { status: 400 }
      );
    }

    // קרא את ה-template config
    const config = await getTemplateConfig(
      user.store_id,
      templateType,
      templateName,
      true // useDraft
    );

    if (!config) {
      return NextResponse.json({
        template: null,
        widgets: [],
      });
    }

    return NextResponse.json({
      template: config.template,
      widgets: config.widgets,
    });
  } catch (error) {
    console.error('Error getting template:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

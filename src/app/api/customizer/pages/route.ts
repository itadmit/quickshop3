/**
 * Customizer Module - Pages API Route
 * GET /api/customizer/pages?pageType=home
 * POST /api/customizer/pages - Create/Update page layout
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { getSectionName } from '@/lib/customizer/sectionNames';
import { invalidateCache } from '@/lib/cache';

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
    const pageType = searchParams.get('pageType');
    const pageHandle = searchParams.get('pageHandle');

    if (!pageType) {
      return NextResponse.json(
        { error: 'pageType is required' },
        { status: 400 }
      );
    }

    // Get store information
    const storeQuery = `
      SELECT id, name, slug
      FROM stores
      WHERE id = $1
    `;
    const storeResult = await query(storeQuery, [user.store_id]);
    let store = storeResult[0] || { name: 'החנות שלי', slug: '', logo: null };
    
    // Try to get logo from store_settings
    try {
      const settingsResult = await query(`
        SELECT settings FROM store_settings WHERE store_id = $1
      `, [user.store_id]);
      
      if (settingsResult.length > 0 && settingsResult[0].settings) {
        const settings = typeof settingsResult[0].settings === 'string' 
          ? JSON.parse(settingsResult[0].settings) 
          : settingsResult[0].settings;
        
        if (settings?.logo) {
          store.logo = settings.logo;
        } else if (settings?.branding?.logo) {
          store.logo = settings.branding.logo;
        }
      }
    } catch (error: any) {
      // Silently ignore if store_settings table doesn't exist
      if (!error.message?.includes('does not exist')) {
        console.warn('Error fetching store logo:', error);
      }
    }

    // Get collections for navigation
    const collectionsQuery = `
      SELECT id, title as name, handle
      FROM product_collections
      WHERE store_id = $1 AND published_scope = 'web'
      ORDER BY created_at DESC
      LIMIT 20
    `;
    const collectionsResult = await query(collectionsQuery, [user.store_id]);
    const collections = collectionsResult.map((col: any) => ({
      id: col.id,
      name: col.name,
      handle: col.handle
    }));

    // Get page layout
    // For product/collection pages, we want to load the generic template (without handle)
    // This allows editing the template that applies to all products/collections
    const layoutQuery = `
      SELECT
        pl.*,
        tt.name as theme_name,
        tt.display_name as theme_display_name,
        CASE 
          WHEN pl.page_handle IS NULL THEN 1  -- Generic template gets priority in editor
          WHEN pl.page_handle = $3 THEN 2  -- Specific handle
          ELSE 3
        END as priority
      FROM page_layouts pl
      LEFT JOIN theme_templates tt ON pl.template_id = tt.id
      WHERE pl.store_id = $1
        AND pl.page_type = $2
        AND (pl.page_handle IS NULL OR pl.page_handle = $3)
      ORDER BY priority ASC, pl.is_published DESC, pl.created_at DESC
      LIMIT 1
    `;

    const layoutResult = await query(layoutQuery, [user.store_id, pageType, pageHandle || null]);

    if (layoutResult.length === 0) {
      return NextResponse.json({
        layout: null,
        sections: [],
        store: {
          name: store.name,
          slug: store.slug,
          logo: store.logo
        },
        collections
      });
    }

    const layout = layoutResult[0];

    // ✅ קרא sections מ-JSON (מהיר כמו Shopify!)
    const sectionsJson = layout.sections_json || [];
    
    const sections = sectionsJson.map((sectionData: any) => {
      return {
        id: sectionData.id || `section-${sectionData.type}`,
        type: sectionData.type,
        name: getSectionName(sectionData.type),
        visible: sectionData.visible !== false,
        order: sectionData.order || 0,
        locked: sectionData.locked || false,
        blocks: (sectionData.blocks || []).map((block: any) => ({
          id: block.id,
          type: block.type,
          content: block.content || {},
          style: block.style || {},
          settings: block.settings || {},
          is_visible: block.is_visible !== false
        })),
        style: sectionData.style || {},
        settings: sectionData.settings || {},
        custom_css: sectionData.custom_css || '',
        custom_classes: sectionData.custom_classes || ''
      };
    });

    return NextResponse.json({
      layout: {
        id: layout.id,
        pageType: layout.page_type,
        pageHandle: layout.page_handle,
        themeName: layout.theme_name,
        themeDisplayName: layout.theme_display_name,
        isPublished: layout.is_published,
        publishedAt: layout.published_at,
        edgeJsonUrl: layout.edge_json_url
      },
      sections,
      store: {
        name: store.name,
        slug: store.slug,
        logo: store.logo
      },
      collections
    });
  } catch (error) {
    console.error('Error getting page layout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update page layout
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
    const { pageType, pageHandle, sections, isPublished = false } = body;

    if (!pageType || !sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: 'pageType and sections array are required' },
        { status: 400 }
      );
    }

    console.log('[Customizer Save] Store ID:', user.store_id, 'Page Type:', pageType, 'Is Published:', isPublished);

    // Get theme template ID (default to New York)
    const themeTemplate = await query(`
      SELECT id FROM theme_templates WHERE name = 'new-york' LIMIT 1
    `);

    const templateId = themeTemplate[0]?.id || 1;

    // Check if page layout exists
    const existingLayout = await query(`
      SELECT id FROM page_layouts
      WHERE store_id = $1 AND page_type = $2 AND (($3::text IS NULL AND page_handle IS NULL) OR page_handle = $3)
    `, [user.store_id, pageType, pageHandle]);

    let layoutId;

    // ✅ מהיר כמו Shopify - שמור הכל כ-JSON אחד!
    // Prepare sections JSON (כל ה-sections עם ה-blocks שלהם)
    const sectionsJson = sections.map((section: any, index: number) => ({
      id: section.id,
      type: section.type,
      name: section.type, // Will be resolved by getSectionName on read
      visible: section.visible !== false,
      order: index,
      locked: section.locked || false,
      style: section.style || {},
      settings: section.settings || {},
      custom_css: section.custom_css || '',
      custom_classes: section.custom_classes || '',
      blocks: (section.blocks || []).map((block: any, blockIndex: number) => ({
        id: block.id,
        type: block.type,
        is_visible: block.is_visible !== false,
        content: block.content || {},
        style: block.style || {},
        settings: block.settings || {}
      }))
    }));

    if (existingLayout.length > 0) {
      // Update existing layout - UPDATE אחד בלבד!
      layoutId = existingLayout[0].id;
      await query(`
        UPDATE page_layouts
        SET 
          sections_json = $1::jsonb,
          is_published = $2, 
          published_at = CASE WHEN $2 THEN now() ELSE published_at END, 
          updated_at = now()
        WHERE id = $3
      `, [JSON.stringify(sectionsJson), isPublished, layoutId]);
    } else {
      // Create new layout - INSERT אחד בלבד!
      const newLayout = await query(`
        INSERT INTO page_layouts (
          store_id, template_id, page_type, page_handle, is_published, sections_json
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
        RETURNING id
      `, [user.store_id, templateId, pageType, pageHandle, isPublished, JSON.stringify(sectionsJson)]);

      layoutId = newLayout[0].id;
    }

    // ✅ לא צריך יותר למחוק sections ו-blocks - הכל ב-JSON!

    // ✅ Invalidate cache for this page layout
    await invalidateCache(`layout:${user.store_id}:${pageType}:*`);
    // Also invalidate the default layout pattern
    await invalidateCache(`layout:${user.store_id}:${pageType}:default`);
    // If editing home page, invalidate all pages (header/footer changes affect all)
    if (pageType === 'home') {
      await invalidateCache(`layout:${user.store_id}:*`);
    }

    return NextResponse.json({
      success: true,
      layoutId
    });
  } catch (error) {
    console.error('Error saving page layout:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
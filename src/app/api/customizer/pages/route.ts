/**
 * Customizer Module - Pages API Route
 * GET /api/customizer/pages?pageType=home
 * POST /api/customizer/pages - Create/Update page layout
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { getSectionName } from '@/lib/customizer/sectionNames';

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

    // Get sections for this layout
    const sectionsQuery = `
      SELECT
        ps.*,
        json_agg(
          json_build_object(
            'id', sb.block_id,
            'type', sb.block_type,
            'position', sb.position,
            'is_visible', sb.is_visible,
            'settings', sb.settings_json
          ) ORDER BY sb.position
        ) FILTER (WHERE sb.id IS NOT NULL) as blocks
      FROM page_sections ps
      LEFT JOIN section_blocks sb ON ps.id = sb.section_id
      WHERE ps.page_layout_id = $1
      GROUP BY ps.id
      ORDER BY ps.position ASC
    `;

    const sectionsResult = await query(sectionsQuery, [layout.id]);

    const sections = sectionsResult.map(section => {
      // Parse settings_json for section - it contains style and settings
      const sectionSettings = section.settings_json || {};
      
      // Parse blocks - settings_json contains content, style, and settings
      const parsedBlocks = (section.blocks || []).map((block: any) => {
        const blockSettings = block.settings || {};
        return {
          id: block.id,
          type: block.type,
          content: blockSettings.content || {},
          style: blockSettings.style || {},
          settings: blockSettings.settings || blockSettings,
          is_visible: block.is_visible !== false
        };
      });
      
      return {
        id: section.section_id,
        type: section.section_type,
        name: getSectionName(section.section_type),
        visible: section.is_visible,
        order: section.position,
        locked: section.is_locked,
        blocks: parsedBlocks,
        style: sectionSettings.style || {},
        settings: sectionSettings.settings || sectionSettings,
        custom_css: section.custom_css || '',
        custom_classes: section.custom_classes || ''
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

    if (existingLayout.length > 0) {
      // Update existing layout
      layoutId = existingLayout[0].id;
      await query(`
        UPDATE page_layouts
        SET is_published = $1, published_at = CASE WHEN $1 THEN now() ELSE published_at END, updated_at = now()
        WHERE id = $2
      `, [isPublished, layoutId]);
    } else {
      // Create new layout
      const newLayout = await query(`
        INSERT INTO page_layouts (store_id, template_id, page_type, page_handle, is_published)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [user.store_id, templateId, pageType, pageHandle, isPublished]);

      layoutId = newLayout[0].id;
    }

    // Delete existing sections and blocks
    await query(`DELETE FROM section_blocks WHERE section_id IN (SELECT id FROM page_sections WHERE page_layout_id = $1)`, [layoutId]);
    await query(`DELETE FROM page_sections WHERE page_layout_id = $1`, [layoutId]);

    // Insert new sections and blocks
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // Save the entire section structure (style and settings) in settings_json
      const sectionData = {
        style: section.style || {},
        settings: section.settings || {}
      };
      
      const newSection = await query(`
        INSERT INTO page_sections (
          page_layout_id, section_type, section_id, position, is_visible, is_locked,
          settings_json, custom_css, custom_classes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        layoutId,
        section.type,
        section.id,
        i,
        section.visible !== false,
        section.locked || false,
        JSON.stringify(sectionData),
        section.custom_css || '',
        section.custom_classes || ''
      ]);

      const sectionDbId = newSection[0].id;

      // Insert blocks for this section
      if (section.blocks && Array.isArray(section.blocks)) {
        for (let j = 0; j < section.blocks.length; j++) {
          const block = section.blocks[j];
          // Save the entire block structure (content, style, settings) in settings_json
          const blockData = {
            content: block.content || {},
            style: block.style || {},
            settings: block.settings || {}
          };
          await query(`
            INSERT INTO section_blocks (
              section_id, block_type, block_id, position, is_visible, settings_json
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            sectionDbId,
            block.type,
            block.id,
            j,
            block.is_visible !== false,
            JSON.stringify(blockData)
          ]);
        }
      }
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
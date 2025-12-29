/**
 * Customizer - Get Page Configuration
 * מקבל את הגדרות העמוד מהמסד נתונים
 */

import { query } from '@/lib/db';
import { PageTemplate, TemplateWidget } from './types';
import { getSectionName } from './sectionNames';
import { getCached } from '@/lib/cache';

export async function getTemplateConfig(
  storeId: number,
  templateType: string,
  templateName?: string,
  useDraft: boolean = false
): Promise<{ template: PageTemplate | null; widgets: TemplateWidget[] }> {
  try {
    // Get page template
    const templateQuery = `
      SELECT
        pt.*,
        tt.name as theme_name,
        tt.display_name as theme_display_name
      FROM page_templates pt
      LEFT JOIN theme_templates tt ON pt.template_id = tt.id
      WHERE pt.store_id = $1
        AND pt.template_type = $2
        AND ($3::text IS NULL OR pt.name = $3)
        AND pt.is_published = true
      ORDER BY pt.is_default DESC, pt.created_at DESC
      LIMIT 1
    `;

    const templateResult = await query(templateQuery, [storeId, templateType, templateName]);

    if (templateResult.length === 0) {
      return { template: null, widgets: [] };
    }

    const templateRow = templateResult[0];

    // Get template widgets
    const widgetsQuery = `
      SELECT *
      FROM template_widgets
      WHERE template_id = $1
      ORDER BY position ASC
    `;

    const widgetsResult = await query(widgetsQuery, [templateRow.id]);

    // Build template object
    const template: PageTemplate = {
      id: templateRow.id,
      store_id: templateRow.store_id,
      page_type: templateRow.template_type,
      name: templateRow.name,
      description: templateRow.description || '',
      sections: [], // Will be populated from page_layouts
      theme_settings: {
        colors: {
          primary: '#000000',
          secondary: '#666666',
          accent: '#10B981',
          background: '#FFFFFF',
          text: '#000000',
          text_light: '#6B7280',
          border: '#E5E7EB'
        },
        typography: {
          font_family_heading: 'Heebo',
          font_family_body: 'Heebo',
          font_size_base: '16px',
          line_height_base: '1.6'
        },
        layout: {
          max_width: '1200px',
          container_padding: '24px',
          border_radius: '4px'
        },
        animations: {
          enabled: true,
          duration: '300ms'
        }
      },
      is_default: templateRow.is_default,
      is_active: templateRow.is_published,
      created_at: templateRow.created_at,
      updated_at: templateRow.updated_at,
      version: 1
    };

    // Convert widgets to TemplateWidget format
    const widgets: TemplateWidget[] = widgetsResult.map(row => ({
      id: row.widget_id,
      name: row.widget_type,
      description: row.widget_type,
      category: 'content',
      section_types: [templateType],
      default_settings: {
        id: row.widget_id,
        type: row.widget_type as any,
        name: row.widget_type,
        visible: row.is_visible,
        order: row.position,
        blocks: [],
        style: {},
        settings: row.settings_json || {}
      },
      is_premium: false
    }));

    return { template, widgets };
  } catch (error) {
    console.error('Error getting template config:', error);
    return { template: null, widgets: [] };
  }
}

export async function getPageLayout(storeId: number, pageType: string, pageHandle?: string): Promise<any> {
  const cacheKey = `layout:${storeId}:${pageType}:${pageHandle || 'default'}`;
  
  return getCached(
    cacheKey,
    async () => {
      // ✅ ONE QUERY - Join everything!
      const layoutQuery = `
        SELECT
          pl.*,
          tt.name as theme_name,
          tt.display_name as theme_display_name,
          CASE 
            WHEN pl.page_handle = $3 THEN 1
            WHEN pl.page_handle IS NULL THEN 2
            ELSE 3
          END as priority,
          (
            SELECT json_agg(
              json_build_object(
                'id', ps.section_id,
                'type', ps.section_type,
                'name', ps.section_type,
                'visible', ps.is_visible,
                'order', ps.position,
                'locked', ps.is_locked,
                'settings_json', ps.settings_json,
                'blocks', (
                  SELECT COALESCE(json_agg(
                    json_build_object(
                      'id', sb.block_id,
                      'type', sb.block_type,
                      'is_visible', sb.is_visible,
                      'settings_json', sb.settings_json
                    )
                    ORDER BY sb.position ASC
                  ), '[]'::json)
                  FROM section_blocks sb
                  WHERE sb.section_id = ps.id
                )
              )
              ORDER BY ps.position ASC
            )
            FROM page_sections ps
            WHERE ps.page_layout_id = pl.id
          ) as sections_data
        FROM page_layouts pl
        LEFT JOIN theme_templates tt ON pl.template_id = tt.id
        WHERE pl.store_id = $1
          AND pl.page_type = $2
          AND (pl.page_handle = $3 OR pl.page_handle IS NULL)
        ORDER BY priority ASC, pl.is_published DESC, pl.created_at DESC
        LIMIT 1
      `;

      try {
        const layoutResult = await query(layoutQuery, [storeId, pageType, pageHandle || null]);

        if (layoutResult.length === 0) {
          return null;
        }

        const layout = layoutResult[0];
        const sectionsData = layout.sections_data || [];

        // Parse sections and blocks
        const sections = sectionsData.map((sectionData: any) => {
          const sectionSettings = sectionData.settings_json || {};
          
          const parsedBlocks = (sectionData.blocks || []).map((block: any) => {
            const blockSettings = block.settings_json || {};
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
            id: sectionData.id,
            type: sectionData.type,
            name: getSectionName(sectionData.type),
            visible: sectionData.visible,
            order: sectionData.order,
            locked: sectionData.locked,
            blocks: parsedBlocks,
            style: sectionSettings.style || {},
            settings: sectionSettings.settings || sectionSettings
          };
        });

        return {
          layout,
          sections
        };
      } catch (error) {
        console.error('Error getting page layout:', error);
        return null;
      }
    },
    120 // 2 minutes cache - layouts don't change often
  );
}
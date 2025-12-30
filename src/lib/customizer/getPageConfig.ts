/**
 * Customizer - Get Page Configuration
 * מקבל את הגדרות העמוד מהמסד נתונים
 */

import { query } from '@/lib/db';
import { PageTemplate, TemplateWidget } from './types';
import { getSectionName } from './sectionNames';

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

/**
 * Get page config for publishing - מחזיר את הקונפיג בפורמט PageConfig
 */
export async function getPageConfig(
  storeId: number,
  pageType: string,
  pageHandle?: string,
  useDraft: boolean = false
): Promise<any> {
  try {
    // טען את ה-layout עם ה-sections_json
    const layoutQuery = `
      SELECT 
        pl.*,
        COALESCE(pl.sections_json, '[]'::jsonb) as sections_json
      FROM page_layouts pl
      WHERE pl.store_id = $1
        AND pl.page_type = $2
        AND (pl.page_handle = $3 OR pl.page_handle IS NULL)
      ORDER BY 
        CASE WHEN pl.page_handle = $3 THEN 1 ELSE 2 END,
        pl.is_published DESC,
        pl.created_at DESC
      LIMIT 1
    `;

    const layoutResult = await query(layoutQuery, [storeId, pageType, pageHandle || null]);

    if (layoutResult.length === 0) {
      return null;
    }

    const layout = layoutResult[0];
    const sectionsJson = layout.sections_json || [];

    // המר ל-PageConfig format
    const sections: Record<string, any> = {};
    const section_order: string[] = [];

    for (const sectionData of sectionsJson as any[]) {
      const sectionId = sectionData.id || `section-${sectionData.type}`;
      section_order.push(sectionId);

      sections[sectionId] = {
        type: sectionData.type,
        name: getSectionName(sectionData.type),
        visible: sectionData.visible !== false,
        position: sectionData.order || 0,
        is_locked: sectionData.locked || false,
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
    }

    return {
      page_type: pageType,
      page_handle: pageHandle,
      sections,
      section_order,
      theme_settings: {},
      version: 1
    };
  } catch (error) {
    console.error('Error getting page config:', error);
    return null;
  }
}

export async function getPageLayout(storeId: number, pageType: string, pageHandle?: string): Promise<any> {
  // ✅ מהיר כמו Shopify - query אחד בלבד עם JSON!
  const layoutQuery = `
    SELECT 
      pl.*,
      COALESCE(pl.sections_json, '[]'::jsonb) as sections_json
    FROM page_layouts pl
    WHERE pl.store_id = $1
      AND pl.page_type = $2
      AND (pl.page_handle = $3 OR pl.page_handle IS NULL)
    ORDER BY 
      CASE WHEN pl.page_handle = $3 THEN 1 ELSE 2 END,
      pl.is_published DESC,
      pl.created_at DESC
    LIMIT 1
  `;

  try {
    const layoutResult = await query(layoutQuery, [storeId, pageType, pageHandle || null]);

    if (layoutResult.length === 0) {
      return null;
    }

    const layout = layoutResult[0];
    const sectionsJson = layout.sections_json || [];

    // Parse sections from JSON (מהיר מאוד - אין queries נוספים!)
    const sections = (sectionsJson as any[]).map((sectionData: any) => {
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

    return {
      layout: {
        id: layout.id,
        store_id: layout.store_id,
        template_id: layout.template_id,
        page_type: layout.page_type,
        page_handle: layout.page_handle,
        is_published: layout.is_published,
        published_at: layout.published_at,
        edge_json_url: layout.edge_json_url,
        created_at: layout.created_at,
        updated_at: layout.updated_at
      },
      sections
    };
  } catch (error) {
    console.error('Error getting page layout:', error);
    return null;
  }
}
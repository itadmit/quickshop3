/**
 * Customizer Module - Get Page Configuration
 * קריאת הגדרות עמוד מ-Edge או מ-DB
 */

import { query } from '@/lib/db';
import { PageConfig, PageType, PageLayout, PageSection, SectionBlock } from './types';

const EDGE_BASE_URL = process.env.EDGE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || '';

/**
 * קריאת הגדרות עמוד - נסיון ראשון מ-Edge, fallback ל-DB
 */
export async function getPageConfig(
  storeId: number,
  pageType: PageType,
  pageHandle?: string,
  useDraft: boolean = false
): Promise<PageConfig | null> {
  // אם לא draft, נסה Edge cache קודם
  if (!useDraft) {
    const edgeConfig = await getPageConfigFromEdge(storeId, pageType, pageHandle);
    if (edgeConfig) {
      return edgeConfig;
    }
  }

  // Fallback ל-DB
  return await getPageConfigFromDB(storeId, pageType, pageHandle, useDraft);
}

/**
 * קריאה מ-Edge JSON (Production)
 */
async function getPageConfigFromEdge(
  storeId: number,
  pageType: PageType,
  pageHandle?: string
): Promise<PageConfig | null> {
  if (!EDGE_BASE_URL) {
    return null;
  }

  const fileName = pageHandle ? `${pageType}-${pageHandle}.json` : `${pageType}.json`;
  const edgeUrl = `${EDGE_BASE_URL}/config/${storeId}/${fileName}`;

  try {
    const response = await fetch(edgeUrl, {
      next: { revalidate: 60 }, // ISR - revalidate every 60 seconds
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate',
      },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log('Edge cache miss, falling back to DB:', error);
  }

  return null;
}

/**
 * קריאה מ-DB (Draft או Published)
 */
async function getPageConfigFromDB(
  storeId: number,
  pageType: PageType,
  pageHandle?: string,
  useDraft: boolean = false
): Promise<PageConfig | null> {
  // 1. קרא את ה-page_layout
  const layoutResult = await query<PageLayout>(
    `
    SELECT * FROM page_layouts
    WHERE store_id = $1 
      AND page_type = $2 
      AND (page_handle = $3 OR ($3 IS NULL AND page_handle IS NULL))
    ORDER BY page_handle DESC NULLS LAST
    LIMIT 1
    `,
    [storeId, pageType, pageHandle || null]
  );

  if (layoutResult.length === 0) {
    return null;
  }

  const layout = layoutResult[0];

  // 2. קרא את הסקשנים
  const sectionsResult = await query<PageSection>(
    `
    SELECT * FROM page_sections
    WHERE page_layout_id = $1 AND is_visible = true
    ORDER BY position ASC
    `,
    [layout.id]
  );

  const sections = sectionsResult;

  // 3. קרא את הבלוקים לכל סקשן
  const sectionsWithBlocks = await Promise.all(
    sections.map(async (section) => {
      const blocksResult = await query<SectionBlock>(
        `
        SELECT * FROM section_blocks
        WHERE section_id = $1 AND is_visible = true
        ORDER BY position ASC
        `,
        [section.id]
      );

      return {
        ...section,
        blocks: blocksResult,
      };
    })
  );

  // 4. קרא את הגדרות התבנית הגלובליות
  const themeSettingsResult = await query(
    `
    SELECT 
      ${useDraft ? 'draft_settings_json' : 'published_settings_json'} as settings_json,
      custom_css,
      custom_js
    FROM store_theme_settings
    WHERE store_id = $1
    `,
    [storeId]
  );

  const themeSettings = themeSettingsResult[0] || {
    settings_json: {},
    custom_css: '',
    custom_js: '',
  };

  // 5. בנה את ה-config
  const sectionOrder = sectionsWithBlocks
    .sort((a, b) => a.position - b.position)
    .map((s) => s.section_id);

  const sectionsConfig: Record<string, any> = {};
  sectionsWithBlocks.forEach((section) => {
    sectionsConfig[section.section_id] = {
      type: section.section_type,
      position: section.position,
      settings: section.settings_json,
      blocks: section.blocks.map((block) => ({
        id: block.block_id,
        type: block.block_type,
        settings: block.settings_json,
      })),
      custom_classes: section.custom_classes,
    };
  });

  return {
    version: '1.0.0',
    generated_at: new Date().toISOString(),
    page_type: pageType,
    global_settings: themeSettings.settings_json as any,
    sections: sectionsConfig,
    section_order: sectionOrder,
    custom_css: themeSettings.custom_css,
    custom_js: themeSettings.custom_js,
  };
}

/**
 * קבלת Template Config (לעמודי לופ)
 */
export async function getTemplateConfig(
  storeId: number,
  templateType: 'product' | 'collection',
  templateName: string = 'default',
  useDraft: boolean = false
) {
    const templateResult = await query(
    `
    SELECT * FROM page_templates
    WHERE store_id = $1 
      AND template_type = $2 
      AND name = $3
    `,
    [storeId, templateType, templateName]
  );

      if (templateResult.length === 0) {
        return null;
      }

      const template = templateResult[0];

  // קרא את ה-widgets
      const widgetsResult = await query(
    `
    SELECT * FROM template_widgets
    WHERE template_id = $1 AND is_visible = true
    ORDER BY position ASC
    `,
    [template.id]
  );

      return {
        template,
        widgets: widgetsResult,
      };
}


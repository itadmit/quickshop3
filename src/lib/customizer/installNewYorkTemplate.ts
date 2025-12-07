/**
 * Customizer Module - Install New York Template
 * התקנת תבנית New York ברירת מחדל לחנות חדשה
 */

import { query } from '@/lib/db';

export interface InstallTemplateOptions {
  storeId: number;
}

/**
 * התקנת תבנית New York - מבנה ברירת מחדל לכל העמודים
 */
export async function installNewYorkTemplate({ storeId }: InstallTemplateOptions) {
  try {
    // 1. צור theme template
    const templateResult = await query(
      `
      INSERT INTO theme_templates (name, display_name, description, is_default, is_active)
      VALUES ('new_york', 'New York', 'תבנית ברירת מחדל נקייה ומינימליסטית', true, true)
      ON CONFLICT (name) DO NOTHING
      RETURNING id
      `
    );

    const templateId = templateResult[0]?.id || (
      await query<{ id: number }>(
        `SELECT id FROM theme_templates WHERE name = 'new_york'`
      )
    )[0]?.id;

    if (!templateId) {
      throw new Error('Failed to create or find New York template');
    }

    // 2. צור store_theme_settings
    await query(
      `
      INSERT INTO store_theme_settings (
        store_id, template_id,
        draft_settings_json, published_settings_json,
        custom_css, custom_js
      )
      VALUES (
        $1, $2,
        '{"colors":{"primary":"#000000","secondary":"#666666","background":"#FFFFFF","text":"#000000"},"typography":{"font_family":"Open Sans Hebrew","heading_font":"Open Sans Hebrew"},"layout":{"container_width":1200,"spacing":20}}'::jsonb,
        '{"colors":{"primary":"#000000","secondary":"#666666","background":"#FFFFFF","text":"#000000"},"typography":{"font_family":"Open Sans Hebrew","heading_font":"Open Sans Hebrew"},"layout":{"container_width":1200,"spacing":20}}'::jsonb,
        '',
        ''
      )
      ON CONFLICT (store_id) DO UPDATE SET template_id = $2
      `,
      [storeId, templateId]
    );

    // 3. צור page layouts לכל סוגי העמודים
    const pageTypes = ['home', 'product', 'collection', 'cart', 'checkout'] as const;

    for (const pageType of pageTypes) {
      // צור draft layout
      const draftLayoutResult = await query(
        `
        INSERT INTO page_layouts (
          store_id, page_type, page_handle, template_id, is_published
        )
        VALUES ($1, $2, NULL, $3, false)
        ON CONFLICT (store_id, page_type, page_handle) DO NOTHING
        RETURNING id
        `,
        [storeId, pageType, templateId]
      );

      const draftLayoutId = draftLayoutResult[0]?.id || (
        await query<{ id: number }>(
          `
          SELECT id FROM page_layouts
          WHERE store_id = $1 AND page_type = $2 AND page_handle IS NULL AND is_published = false
          `,
          [storeId, pageType]
        )
      )[0]?.id;

      if (draftLayoutId) {
        await createDefaultSectionsForPage(draftLayoutId, pageType);
      }

      // צור published layout
      const publishedLayoutResult = await query(
        `
        INSERT INTO page_layouts (
          store_id, page_type, page_handle, template_id, is_published
        )
        VALUES ($1, $2, NULL, $3, true)
        ON CONFLICT (store_id, page_type, page_handle) DO NOTHING
        RETURNING id
        `,
        [storeId, pageType, templateId]
      );

      const publishedLayoutId = publishedLayoutResult[0]?.id || (
        await query<{ id: number }>(
          `
          SELECT id FROM page_layouts
          WHERE store_id = $1 AND page_type = $2 AND page_handle IS NULL AND is_published = true
          `,
          [storeId, pageType]
        )
      )[0]?.id;

      if (publishedLayoutId) {
        await createDefaultSectionsForPage(publishedLayoutId, pageType);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error installing New York template:', error);
    throw error;
  }
}

/**
 * יצירת סקשנים ברירת מחדל לעמוד
 */
async function createDefaultSectionsForPage(layoutId: number, pageType: string) {
  const defaultSections: Array<{ type: string; position: number; settings: any }> = [];

  if (pageType === 'home') {
    // עמוד בית - מבנה מלא
    defaultSections.push(
      {
        type: 'announcement_bar',
        position: 0,
        settings: {
          text: 'ברוכים הבאים לחנות שלנו!',
          background_color: '#000000',
          text_color: '#FFFFFF',
          enabled: true,
        },
      },
      {
        type: 'slideshow',
        position: 1,
        settings: {
          autoplay: true,
          autoplay_speed: 5000,
          slides: [
            {
              image: '',
              heading: 'ברוכים הבאים',
              subheading: 'גלה את הקולקציה החדשה שלנו',
              button_text: 'קנה עכשיו',
              button_link: '/collections/all',
            },
          ],
        },
      },
      {
        type: 'collection_list',
        position: 2,
        settings: {
          title: 'קטגוריות',
          collections_per_row: 3,
          show_description: true,
        },
      },
      {
        type: 'product_grid',
        position: 3,
        settings: {
          title: 'מוצרים מומלצים',
          products_per_row: 4,
          limit: 8,
          collection_id: null,
        },
      }
    );
  } else if (pageType === 'product') {
    // עמוד מוצר - רק announcement
    defaultSections.push({
      type: 'announcement_bar',
      position: 0,
      settings: {
        text: '',
        background_color: '#000000',
        text_color: '#FFFFFF',
        enabled: false,
      },
    });
  } else if (pageType === 'collection') {
    // עמוד קטגוריה - announcement + product grid
    defaultSections.push(
      {
        type: 'announcement_bar',
        position: 0,
        settings: {
          text: '',
          background_color: '#000000',
          text_color: '#FFFFFF',
          enabled: false,
        },
      },
      {
        type: 'product_grid',
        position: 1,
        settings: {
          title: '',
          products_per_row: 4,
          limit: 24,
          collection_id: null, // דינמי
        },
      }
    );
  } else {
    // עמודים אחרים - רק announcement
    defaultSections.push({
      type: 'announcement_bar',
      position: 0,
      settings: {
        text: '',
        background_color: '#000000',
        text_color: '#FFFFFF',
        enabled: false,
      },
    });
  }

  // הוסף את הסקשנים
  for (const section of defaultSections) {
    const sectionId = `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await query(
      `
      INSERT INTO page_sections (
        page_layout_id, section_type, section_id, position,
        is_visible, settings_json
      )
      VALUES ($1, $2, $3, $4, true, $5)
      `,
      [
        layoutId,
        section.type,
        sectionId,
        section.position,
        JSON.stringify(section.settings),
      ]
    );
  }
}


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
    // 1. מצא או צור theme template (התבנית כבר נוצרת בסיד)
    const templateResult = await query<{ id: number }>(
      `SELECT id FROM theme_templates WHERE name = 'new-york' LIMIT 1`
    );

    let templateId = templateResult[0]?.id;

    // אם התבנית לא קיימת, צור אותה
    if (!templateId) {
      const insertResult = await query<{ id: number }>(
        `
        INSERT INTO theme_templates (
          name, display_name, description, is_default, 
          available_sections, default_settings_schema
        )
        VALUES (
          'new-york',
          'ניו יורק',
          'תבנית מודרנית ומינימליסטית בהשראת עיצוב נקי',
          true,
          '[
            "announcement_bar",
            "header",
            "slideshow",
            "hero_banner",
            "collection_list",
            "featured_collection",
            "featured_product",
            "product_grid",
            "new_arrivals",
            "best_sellers",
            "image_with_text",
            "image_with_text_overlay",
            "rich_text",
            "video",
            "testimonials",
            "faq",
            "newsletter",
            "trust_badges",
            "footer",
            "mobile_sticky_bar",
            "custom_html"
          ]'::jsonb,
          '{
            "colors": {
              "primary": "#000000",
              "secondary": "#666666",
              "accent": "#10B981",
              "background": "#FFFFFF",
              "surface": "#F9FAFB",
              "text": "#000000",
              "muted": "#6B7280",
              "border": "#E5E7EB",
              "error": "#EF4444",
              "success": "#10B981"
            },
            "typography": {
              "headingFont": "Heebo",
              "bodyFont": "Heebo",
              "baseFontSize": 16,
              "lineHeight": 1.6,
              "headingWeight": 700,
              "bodyWeight": 400
            },
            "layout": {
              "containerMaxWidth": 1200,
              "containerPadding": 24,
              "sectionSpacing": 64,
              "gridGap": 24
            },
            "buttons": {
              "borderRadius": 4,
              "padding": "12px 24px",
              "primaryStyle": "solid",
              "secondaryStyle": "outline"
            },
            "cards": {
              "borderRadius": 8,
              "shadow": "sm",
              "hoverEffect": "lift"
            },
            "animations": {
              "enabled": true,
              "duration": 300,
              "easing": "ease-out"
            }
          }'::jsonb
        )
        RETURNING id
        `
      );
      templateId = insertResult[0]?.id;
    }

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


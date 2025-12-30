/**
 * Customizer Module - Server Actions
 * פעולות מהירות מהשרת לקסטומייזר
 */

'use server';

import { query } from '@/lib/db';
import { eventBus } from '@/lib/events/eventBus';
import { getUserFromRequest } from '@/lib/auth';
import { cookies } from 'next/headers';
import {
  SavePageDraftRequest,
  PublishPageRequest,
  AddSectionRequest,
  UpdateSectionRequest,
  AddBlockRequest,
  UpdateBlockRequest,
  PageType,
  SectionType,
  BlockType,
  PageConfig,
} from '@/lib/customizer/types';
import { generateConfigJSON } from '@/lib/customizer/generateJSON';
import { uploadToEdge } from '@/lib/customizer/edgeStorage';
import { revalidatePath } from 'next/cache';

/**
 * Helper function לקבלת storeId ו-userId מ-request
 */
async function getAuthInfo() {
  const cookieStore = await cookies();
  const token = cookieStore.get('quickshop3_session')?.value;
  
  if (!token) {
    throw new Error('Unauthorized');
  }

  const { verifyToken } = await import('@/lib/auth');
  const user = await verifyToken(token);
  
  if (!user || !user.store_id) {
    throw new Error('Unauthorized');
  }

  return {
    storeId: user.store_id,
    userId: user.id,
  };
}

/**
 * Helper: טען sections מ-JSON
 */
async function getLayoutSections(layoutId: number): Promise<any[]> {
  const result = await query<{ sections_json: any }>(
    `SELECT COALESCE(sections_json, '[]'::jsonb) as sections_json FROM page_layouts WHERE id = $1`,
    [layoutId]
  );
  return result[0]?.sections_json || [];
}

/**
 * Helper: שמור sections כ-JSON
 */
async function saveLayoutSections(layoutId: number, sections: any[]): Promise<void> {
  await query(
    `UPDATE page_layouts SET sections_json = $1::jsonb, updated_at = now() WHERE id = $2`,
    [JSON.stringify(sections), layoutId]
  );
}

/**
 * Helper: מצא layout ID לפי pageType ו-pageHandle
 */
async function findLayoutId(storeId: number, pageType: PageType, pageHandle?: string): Promise<number | null> {
  const result = await query<{ id: number }>(
    `SELECT id FROM page_layouts 
     WHERE store_id = $1 AND page_type = $2 
     AND (page_handle = $3 OR ($3 IS NULL AND page_handle IS NULL))
     LIMIT 1`,
    [storeId, pageType, pageHandle || null]
  );
  return result[0]?.id || null;
}

/**
 * שמירת שינויים כ-Draft
 */
export async function savePageDraft(data: SavePageDraftRequest) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // 1. מצא או צור page_layout
    const layoutResult = await query(
      `
      INSERT INTO page_layouts (store_id, page_type, page_handle, is_published, sections_json)
      VALUES ($1, $2, $3, false, '[]'::jsonb)
      ON CONFLICT (store_id, page_type, page_handle) 
      DO UPDATE SET updated_at = now()
      RETURNING id
      `,
      [storeId, data.page_type, data.page_handle || null]
    );

    const layoutId = layoutResult[0]?.id;
    if (!layoutId) {
      return { success: false, error: 'Failed to create layout' };
    }

    // 2. שמור סקשנים כ-JSON אחד (מהיר כמו Shopify!)
    const sectionsJson = data.sections.map((section: any, index: number) => ({
      id: section.section_id,
      type: section.section_type,
      name: section.section_type,
      visible: section.is_visible !== false,
      order: section.position !== undefined ? section.position : index,
      locked: section.is_locked || false,
      style: (section.settings_json?.style) || {},
      settings: (section.settings_json?.settings) || section.settings_json || {},
      custom_css: section.custom_css || '',
      custom_classes: section.custom_classes || '',
      blocks: (section.blocks || []).map((block: any, blockIndex: number) => ({
        id: block.block_id,
        type: block.block_type,
        is_visible: block.is_visible !== false,
        content: (block.settings_json?.content) || {},
        style: (block.settings_json?.style) || {},
        settings: (block.settings_json?.settings) || block.settings_json || {}
      }))
    }));

    // עדכן את ה-layout עם ה-JSON
    await saveLayoutSections(layoutId, sectionsJson);

    // 4. עדכן custom_css אם קיים
    if (data.custom_css) {
      await query(
        `
        UPDATE store_theme_settings
        SET draft_settings_json = jsonb_set(
          COALESCE(draft_settings_json, '{}'::jsonb),
          '{custom_css}',
          $2::jsonb
        )
        WHERE store_id = $1
        `,
        [storeId, JSON.stringify(data.custom_css)]
      );
    }

    // ✅ פליטת אירוע
    await eventBus.emit(
      'customizer.page.draft_saved',
      {
        store_id: storeId,
        page_type: data.page_type,
        page_handle: data.page_handle,
      },
      {
        store_id: storeId,
        source: 'dashboard',
        user_id: userId,
      }
    );

    return { success: true, layoutId };
  } catch (error) {
    console.error('Error saving page draft:', error);
    return { success: false, error: 'Failed to save draft' };
  }
}

/**
 * פרסום עמוד
 */
export async function publishPage(data: PublishPageRequest) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // 1. קרא את ה-draft config
    const { getPageConfig } = await import('@/lib/customizer/getPageConfig');
    const draftConfig = await getPageConfig(storeId, data.page_type, data.page_handle, true);

    if (!draftConfig) {
      return { success: false, error: 'No draft found' };
    }

    // 2. Generate JSON file
    const jsonContent = generateConfigJSON(draftConfig);

    // 3. Upload to Edge storage
    const fileName = data.page_handle
      ? `${data.page_type}-${data.page_handle}.json`
      : `${data.page_type}.json`;
    const edgeUrl = await uploadToEdge(storeId, fileName, jsonContent);

    // 4. עדכן DB (mark as published)
    await query(
      `
      UPDATE page_layouts 
      SET is_published = true,
          published_at = now(),
          edge_json_url = $3
      WHERE store_id = $1 
        AND page_type = $2 
        AND (page_handle = $4 OR ($4 IS NULL AND page_handle IS NULL))
      `,
      [storeId, data.page_type, edgeUrl, data.page_handle || null]
    );

    // 5. העתק draft settings ל-published
    await query(
      `
      UPDATE store_theme_settings
      SET published_settings_json = draft_settings_json,
          published_at = now(),
          edge_json_url = $2
      WHERE store_id = $1
      `,
      [storeId, edgeUrl]
    );

    // 6. Invalidate ISR cache
    const storeResult = await query<{ slug: string }>('SELECT slug FROM stores WHERE id = $1', [storeId]);
    const storeSlug = storeResult[0]?.slug;
    if (storeSlug) {
      revalidatePath(`/shops/${storeSlug}`);
      revalidatePath(`/shops/${storeSlug}/${data.page_type}`);
    }

    // 7. צור version snapshot
    await createVersionSnapshot(storeId, data.page_type, data.page_handle, draftConfig);

    // ✅ פליטת אירוע
    await eventBus.emit(
      'customizer.page.published',
      {
        store_id: storeId,
        page_type: data.page_type,
        page_handle: data.page_handle,
        edge_json_url: edgeUrl,
      },
      {
        store_id: storeId,
        source: 'dashboard',
        user_id: userId,
      }
    );

    return { success: true, edgeUrl };
  } catch (error) {
    console.error('Error publishing page:', error);
    return { success: false, error: 'Failed to publish page' };
  }
}

/**
 * שחזור לפורסם (discard draft)
 */
export async function discardDraft(pageType: PageType, pageHandle?: string) {
  try {
    const { storeId } = await getAuthInfo();

    // מחק את ה-draft layout
    await query(
      `
      DELETE FROM page_layouts
      WHERE store_id = $1 
        AND page_type = $2 
        AND (page_handle = $3 OR ($3 IS NULL AND page_handle IS NULL))
        AND is_published = false
      `,
      [storeId, pageType, pageHandle || null]
    );

    return { success: true };
  } catch (error) {
    console.error('Error discarding draft:', error);
    return { success: false, error: 'Failed to discard draft' };
  }
}

/**
 * איפוס דף - מחיקת כל הסקשנים והבלוקים
 */
export async function resetPage(pageType: PageType, pageHandle?: string) {
  try {
    const { storeId } = await getAuthInfo();

    // ✅ פשוט - מחק את ה-layout (ה-JSON נמחק אוטומטית)
    await query(
      `DELETE FROM page_layouts
       WHERE store_id = $1 AND page_type = $2
       AND (page_handle = $3 OR ($3 IS NULL AND page_handle IS NULL))`,
      [storeId, pageType, pageHandle || null]
    );

    return { success: true };
  } catch (error) {
    console.error('Error resetting page:', error);
    return { success: false, error: 'Failed to reset page' };
  }
}

/**
 * הוספת סקשן
 */
export async function addSection(data: AddSectionRequest) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // מצא את ה-layout או צור אחד חדש
    let layoutResult = await query(
      `
      SELECT id FROM page_layouts
      WHERE store_id = $1 
        AND page_type = $2 
        AND (page_handle = $3 OR ($3 IS NULL AND page_handle IS NULL))
        AND is_published = false
      LIMIT 1
      `,
      [storeId, data.page_type, data.page_handle || null]
    );

    let layoutId: number;
    if (layoutResult.length === 0) {
      // צור layout חדש
      const newLayoutResult = await query(
        `
        INSERT INTO page_layouts (store_id, page_type, page_handle, is_published)
        VALUES ($1, $2, $3, false)
        RETURNING id
        `,
        [storeId, data.page_type, data.page_handle || null]
      );
      layoutId = newLayoutResult[0].id;
    } else {
      layoutId = layoutResult[0].id;
    }

    // ✅ טען sections קיימים מ-JSON
    const sections = await getLayoutSections(layoutId);
    
    const sectionId = `section_${Date.now()}`;

    // הגדרות ברירת מחדל לפי סוג הסקשן
    let defaultSettings = data.settings_json || {};
    
    // הגדרות לסקשנים חדשים
    if (data.section_type === 'announcement_bar') {
      defaultSettings = {
        text: 'משלוח חינם בקנייה מעל 299₪',
        link_text: '',
        link_url: '/categories/all',
        text_align: 'center',
        height: 'auto',
        show_dismiss: true,
        scrolling_text: false,
        scroll_speed: 'normal',
        ...defaultSettings
      };
    }

    if (data.section_type === 'custom_html') {
      defaultSettings = {
        html_content: "<div style='padding: 40px; text-align: center; background: #f9fafb; border-radius: 8px;'>\n  <h2 style='font-size: 24px; margin-bottom: 16px;'>קוד מותאם אישית</h2>\n  <p>הוסף כאן את ה-HTML שלך</p>\n</div>",
        container_width: 'container',
        ...defaultSettings
      };
    }

    if (data.section_type === 'collage') {
      defaultSettings = {
        title: 'הקולקציה החדשה',
        title_align: 'center',
        layout: 'left-large',
        gap: 'medium',
        image_border_radius: '8px',
        ...defaultSettings
      };
    }

    if (data.section_type === 'multicolumn') {
      defaultSettings = {
        title: 'למה לבחור בנו?',
        title_align: 'center',
        columns_desktop: 3,
        columns_mobile: 1,
        text_align: 'center',
        column_gap: 'medium',
        image_ratio: 'square',
        image_border_radius: '8px',
        image_border: false,
        ...defaultSettings
      };
    }

    if (data.section_type === 'logo_list') {
      defaultSettings = {
        heading: 'המותגים שלנו',
        subheading: 'אנחנו עובדים עם המותגים המובילים בעולם',
        items_per_row_desktop: 4,
        items_per_row_mobile: 2,
        logo_width: 150,
        logo_height: 80,
        grayscale_enabled: false,
        ...defaultSettings
      };
    }

    // הוסף בלוקים ברירת מחדל לפי סוג הסקשן
    let defaultBlocks: any[] = [];
    
    if (data.section_type === 'slideshow') {
      defaultBlocks = [{
        id: 'slide_1',
        type: 'image_slide',
        is_visible: true,
        content: {},
        style: {},
        settings: {
          image: '',
          heading: 'ברוכים הבאים',
          description: 'גלה את הקולקציה החדשה שלנו',
          button_text: 'קנה עכשיו',
          button_link: '/categories/all'
        }
      }];
    }

    // 4 לוגואים ברירת מחדל לסקשן לוגואים
    if (data.section_type === 'logo_list') {
      defaultBlocks = Array.from({ length: 4 }, (_, i) => ({
        id: `logo_${i + 1}`,
        type: 'image',
        is_visible: true,
        content: {},
        style: {},
        settings: {
          image_url: '',
          title: '',
          description: '',
          link_url: ''
        }
      }));
    }

    // 3 עמודות ברירת מחדל לסקשן עמודות מרובות
    if (data.section_type === 'multicolumn') {
      const defaultColumns = [
        { title: 'משלוח מהיר', text: 'משלוח עד הבית תוך 3 ימי עסקים לכל חלקי הארץ.' },
        { title: 'החזרות חינם', text: 'לא מרוצים? ניתן להחזיר את המוצר תוך 30 יום ולקבל זיכוי מלא.' },
        { title: 'שירות לקוחות', text: 'צוות התמיכה שלנו זמין עבורכם לכל שאלה או התייעצות.' }
      ];
      
      defaultBlocks = defaultColumns.map((col, i) => ({
        id: `col_${i + 1}`,
        type: 'column',
        is_visible: true,
        content: {},
        style: {},
        settings: {
          title: col.title,
          text: col.text,
          image_url: '',
          link_label: '',
          link: ''
        }
      }));
    }

    // 3 תמונות ברירת מחדל לקולאז'
    if (data.section_type === 'collage') {
      defaultBlocks = Array.from({ length: 3 }, (_, i) => ({
        id: `collage_item_${i + 1}`,
        type: 'image',
        is_visible: true,
        content: {},
        style: {},
        settings: {
          type: 'image',
          image_url: '',
          heading: '',
          link: ''
        }
      }));
    }

    // צור section חדש
    const newSection = {
      id: sectionId,
      type: data.section_type,
      name: data.section_type,
      visible: true,
      order: data.position !== undefined ? data.position : sections.length,
      locked: false,
      style: {},
      settings: defaultSettings,
      custom_css: '',
      custom_classes: '',
      blocks: defaultBlocks
    };

    // הוסף ל-sections
    sections.push(newSection);
    
    // שמור בחזרה
    await saveLayoutSections(layoutId, sections);

    // ✅ פליטת אירוע
    await eventBus.emit(
      'customizer.section.added',
      {
        store_id: storeId,
        page_type: data.page_type,
        section_type: data.section_type,
        section_id: sectionId,
      },
      {
        store_id: storeId,
        source: 'dashboard',
        user_id: userId,
      }
    );

    return { success: true, sectionId };
  } catch (error) {
    console.error('Error adding section:', error);
    return { success: false, error: 'Failed to add section' };
  }
}

/**
 * עדכון סקשן - עובד עם JSON
 */
export async function updateSection(data: UpdateSectionRequest) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // מצא את ה-layout
    const layoutId = await findLayoutId(storeId, data.page_type, data.page_handle);
    if (!layoutId) {
      return { success: false, error: 'Layout not found' };
    }

    // טען sections
    const sections = await getLayoutSections(layoutId);
    
    // מצא את ה-section לעדכון
    const sectionIndex = sections.findIndex((s: any) => s.id === data.section_id);
    if (sectionIndex === -1) {
      return { success: false, error: 'Section not found' };
    }

    // עדכן את ה-section
    if (data.settings !== undefined) {
      sections[sectionIndex].settings = data.settings;
    }
    if (data.custom_css !== undefined) {
      sections[sectionIndex].custom_css = data.custom_css;
    }
    if (data.custom_classes !== undefined) {
      sections[sectionIndex].custom_classes = data.custom_classes;
    }
    if (data.position !== undefined) {
      sections[sectionIndex].order = data.position;
      // מיין מחדש לפי order
      sections.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    }
    if (data.is_visible !== undefined) {
      sections[sectionIndex].visible = data.is_visible;
    }

    // שמור בחזרה
    await saveLayoutSections(layoutId, sections);

    // ✅ פליטת אירוע
    eventBus.emit(
      'customizer.section.updated',
      {
        store_id: storeId,
        section_id: data.section_id,
        changes: data,
      },
      {
        store_id: storeId,
        source: 'dashboard',
        user_id: userId,
      }
    ).catch(err => console.error('Event emission error:', err));

    return { success: true };
  } catch (error) {
    console.error('Error updating section:', error);
    return { success: false, error: 'Failed to update section' };
  }
}

/**
 * מחיקת סקשן - עובד עם JSON
 */
export async function deleteSection(data: { section_id: string; page_type: PageType; page_handle?: string }) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // מצא את ה-layout
    const layoutId = await findLayoutId(storeId, data.page_type, data.page_handle);
    if (!layoutId) {
      return { success: false, error: 'Layout not found' };
    }

    // טען sections
    const sections = await getLayoutSections(layoutId);
    
    // מחק את ה-section
    const filteredSections = sections.filter((s: any) => s.id !== data.section_id);
    
    // שמור בחזרה
    await saveLayoutSections(layoutId, filteredSections);

    // ✅ פליטת אירוע
    await eventBus.emit(
      'customizer.section.deleted',
      {
        store_id: storeId,
        section_id: data.section_id,
      },
      {
        store_id: storeId,
        source: 'dashboard',
        user_id: userId,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error deleting section:', error);
    return { success: false, error: 'Failed to delete section' };
  }
}

/**
 * יצירת version snapshot
 */
async function createVersionSnapshot(
  storeId: number,
  pageType: PageType,
  pageHandle: string | undefined,
  config: any,
  userId?: number,
  notes?: string
) {
  try {
    const layoutResult = await query<{ id: number }>(
      `
      SELECT id FROM page_layouts
      WHERE store_id = $1 AND page_type = $2
        AND (page_handle = $3 OR ($3 IS NULL AND page_handle IS NULL))
      `,
      [storeId, pageType, pageHandle || null]
    );

    if (layoutResult.length === 0) {
      return;
    }

    const layoutId = layoutResult[0].id;

    // מצא את הגרסה האחרונה
    const versionResult = await query<{ max_version: number }>(
      `
      SELECT MAX(version_number) as max_version
      FROM page_layout_versions
      WHERE page_layout_id = $1
      `,
      [layoutId]
    );

    const nextVersion = (versionResult[0]?.max_version || 0) + 1;

    await query(
      `
      INSERT INTO page_layout_versions (
        page_layout_id, version_number, snapshot_json, created_by, notes
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [layoutId, nextVersion, JSON.stringify(config), userId || null, notes || null]
    );
  } catch (error) {
    console.error('Error creating version snapshot:', error);
  }
}

/**
 * הוספת בלוק לסקשן - עובד עם JSON
 */
export async function addBlock(data: AddBlockRequest & { page_type: PageType; page_handle?: string }) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // מצא את ה-layout
    const layoutId = await findLayoutId(storeId, data.page_type, data.page_handle);
    if (!layoutId) {
      return { success: false, error: 'Layout not found' };
    }

    // טען sections
    const sections = await getLayoutSections(layoutId);
    
    // מצא את ה-section
    const sectionIndex = sections.findIndex((s: any) => s.id === data.section_id);
    if (sectionIndex === -1) {
      return { success: false, error: 'Section not found' };
    }

    const blockId = `block_${Date.now()}`;
    const newBlock = {
      id: blockId,
      type: data.block_type,
      is_visible: true,
      content: {},
      style: {},
      settings: data.settings || {}
    };

    // הוסף את ה-block ל-section
    if (!sections[sectionIndex].blocks) {
      sections[sectionIndex].blocks = [];
    }
    sections[sectionIndex].blocks.push(newBlock);
    
    // שמור בחזרה
    await saveLayoutSections(layoutId, sections);

    return { success: true, blockId };
  } catch (error) {
    console.error('Error adding block:', error);
    return { success: false, error: 'Failed to add block' };
  }
}

/**
 * עדכון בלוק - עובד עם JSON
 */
export async function updateBlock(data: UpdateBlockRequest & { page_type: PageType; page_handle?: string; section_id: string }) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // מצא את ה-layout
    const layoutId = await findLayoutId(storeId, data.page_type, data.page_handle);
    if (!layoutId) {
      return { success: false, error: 'Layout not found' };
    }

    // טען sections
    const sections = await getLayoutSections(layoutId);
    
    // מצא את ה-section וה-block
    const sectionIndex = sections.findIndex((s: any) => s.id === data.section_id);
    if (sectionIndex === -1) {
      return { success: false, error: 'Section not found' };
    }

    const section = sections[sectionIndex];
    const blockIndex = section.blocks?.findIndex((b: any) => b.id === data.block_id);
    if (blockIndex === undefined || blockIndex === -1) {
      return { success: false, error: 'Block not found' };
    }

    // עדכן את ה-block
    if (data.settings !== undefined) {
      sections[sectionIndex].blocks[blockIndex].settings = data.settings;
    }
    if (data.position !== undefined) {
      // מיין מחדש את ה-blocks לפי position
      sections[sectionIndex].blocks.sort((a: any, b: any) => {
        if (a.id === data.block_id) return data.position;
        if (b.id === data.block_id) return -data.position;
        return 0;
      });
    }
    if (data.is_visible !== undefined) {
      sections[sectionIndex].blocks[blockIndex].is_visible = data.is_visible;
    }

    // שמור בחזרה
    await saveLayoutSections(layoutId, sections);

    return { success: true };
  } catch (error) {
    console.error('Error updating block:', error);
    return { success: false, error: 'Failed to update block' };
  }
}

/**
 * מחיקת בלוק - עובד עם JSON
 */
export async function deleteBlock(data: { block_id: string; section_id: string; page_type: PageType; page_handle?: string }) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // מצא את ה-layout
    const layoutId = await findLayoutId(storeId, data.page_type, data.page_handle);
    if (!layoutId) {
      return { success: false, error: 'Layout not found' };
    }

    // טען sections
    const sections = await getLayoutSections(layoutId);
    
    // מצא את ה-section
    const sectionIndex = sections.findIndex((s: any) => s.id === data.section_id);
    if (sectionIndex === -1) {
      return { success: false, error: 'Section not found' };
    }

    // מחק את ה-block
    if (sections[sectionIndex].blocks) {
      sections[sectionIndex].blocks = sections[sectionIndex].blocks.filter((b: any) => b.id !== data.block_id);
    }

    // שמור בחזרה
    await saveLayoutSections(layoutId, sections);

    return { success: true };
  } catch (error) {
    console.error('Error deleting block:', error);
    return { success: false, error: 'Failed to delete block' };
  }
}

/**
 * שחזור גרסה קודמת
 */
export async function restoreVersion(
  pageType: PageType,
  versionId: number,
  pageHandle?: string
) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // 1. מצא את ה-version
    const versionResult = await query<{
      page_layout_id: number;
      snapshot_json: any;
    }>(
      `
      SELECT plv.page_layout_id, plv.snapshot_json
      FROM page_layout_versions plv
      JOIN page_layouts pl ON pl.id = plv.page_layout_id
      WHERE plv.id = $1 
        AND pl.store_id = $2
        AND pl.page_type = $3
        AND plv.is_restorable = true
      `,
      [versionId, storeId, pageType]
    );

    if (versionResult.length === 0) {
      return { success: false, error: 'Version not found or not restorable' };
    }

    const { page_layout_id, snapshot_json } = versionResult[0];

    // 2. שחזר את הסקשנים מה-snapshot - עובד עם JSON!
    const config = snapshot_json as PageConfig;

    // 3. המר את ה-config ל-sections JSON format
    const sectionsJson: any[] = [];
    
    for (let i = 0; i < config.section_order.length; i++) {
      const sectionId = config.section_order[i];
      const sectionData = config.sections[sectionId];

      if (!sectionData) continue;

      sectionsJson.push({
        id: sectionId,
        type: sectionData.type,
        name: sectionData.type,
        visible: sectionData.visible !== false,
        order: sectionData.position !== undefined ? sectionData.position : i,
        locked: sectionData.is_locked || false,
        style: sectionData.style || {},
        settings: sectionData.settings || {},
        custom_css: sectionData.custom_css || '',
        custom_classes: sectionData.custom_classes || '',
        blocks: (sectionData.blocks || []).map((block: any, blockIndex: number) => ({
          id: block.id,
          type: block.type,
          is_visible: block.is_visible !== false,
          content: block.content || {},
          style: block.style || {},
          settings: block.settings || {}
        }))
      });
    }

    // 4. שמור כ-JSON אחד (מהיר!)
    await saveLayoutSections(page_layout_id, sectionsJson);

    // ✅ פליטת אירוע
    await eventBus.emit(
      'customizer.version.restored',
      {
        store_id: storeId,
        page_type: pageType,
        version_id: versionId,
      },
      {
        store_id: storeId,
        source: 'dashboard',
        user_id: userId,
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Error restoring version:', error);
    return { success: false, error: 'Failed to restore version' };
  }
}

/**
 * יצירת snapshot ידני
 */
export async function createManualSnapshot(
  pageType: PageType,
  notes: string,
  pageHandle?: string
) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // קרא את ה-draft config
    const { getPageConfig } = await import('@/lib/customizer/getPageConfig');
    const draftConfig = await getPageConfig(storeId, pageType, pageHandle, true);

    if (!draftConfig) {
      return { success: false, error: 'No draft found' };
    }

    // צור snapshot
    await createVersionSnapshot(storeId, pageType, pageHandle, draftConfig, userId, notes);

    return { success: true };
  } catch (error) {
    console.error('Error creating manual snapshot:', error);
    return { success: false, error: 'Failed to create snapshot' };
  }
}


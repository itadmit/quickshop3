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
 * שמירת שינויים כ-Draft
 */
export async function savePageDraft(data: SavePageDraftRequest) {
  try {
    const { storeId, userId } = await getAuthInfo();

    // 1. מצא או צור page_layout
    const layoutResult = await query(
      `
      INSERT INTO page_layouts (store_id, page_type, page_handle, is_published)
      VALUES ($1, $2, $3, false)
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

    // 2. מחק סקשנים קיימים (נשמור מחדש)
    await query(
      `DELETE FROM page_sections WHERE page_layout_id = $1`,
      [layoutId]
    );

    // 3. שמור סקשנים חדשים
    for (let i = 0; i < data.sections.length; i++) {
      const section = data.sections[i] as any; // Temporary type assertion
      const sectionResult = await query(
        `
        INSERT INTO page_sections (
          page_layout_id, section_type, section_id, position,
          is_visible, is_locked, settings_json, custom_css, custom_classes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
        `,
        [
          layoutId,
          section.section_type,
          section.section_id,
          section.position,
          section.is_visible,
          section.is_locked,
          JSON.stringify(section.settings_json),
          section.custom_css || '',
          section.custom_classes || '',
        ]
      );

      const sectionId = sectionResult[0]?.id;
      if (!sectionId) {
        continue;
      }

      // שמור בלוקים
      if (section.blocks && Array.isArray(section.blocks)) {
        for (let j = 0; j < section.blocks.length; j++) {
          const block = section.blocks[j];
          await query(
            `
            INSERT INTO section_blocks (
              section_id, block_type, block_id, position,
              is_visible, settings_json
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            `,
            [
              sectionId,
              block.block_type,
              block.block_id,
              block.position,
              block.is_visible,
              JSON.stringify(block.settings_json),
            ]
          );
        }
      }
    }

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

    const sectionId = `section_${Date.now()}`;

    // הוסף סקשן
    const sectionResult = await query(
      `
      INSERT INTO page_sections (
        page_layout_id, section_type, section_id, position,
        is_visible, settings_json
      )
      VALUES ($1, $2, $3, $4, true, $5)
      RETURNING id
      `,
      [
        layoutId,
        data.section_type,
        sectionId,
        data.position,
        JSON.stringify(data.settings_json || {}),
      ]
    );

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

    return { success: true, sectionId: sectionResult[0]?.id };
  } catch (error) {
    console.error('Error adding section:', error);
    return { success: false, error: 'Failed to add section' };
  }
}

/**
 * עדכון סקשן
 */
export async function updateSection(data: UpdateSectionRequest) {
  try {
    const { storeId, userId } = await getAuthInfo();

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.settings !== undefined) {
      updates.push(`settings_json = $${paramIndex}`);
      values.push(JSON.stringify(data.settings));
      paramIndex++;
    }

    if (data.custom_css !== undefined) {
      updates.push(`custom_css = $${paramIndex}`);
      values.push(data.custom_css);
      paramIndex++;
    }

    if (data.custom_classes !== undefined) {
      updates.push(`custom_classes = $${paramIndex}`);
      values.push(data.custom_classes);
      paramIndex++;
    }

    if (data.position !== undefined) {
      updates.push(`position = $${paramIndex}`);
      values.push(data.position);
      paramIndex++;
    }

    if (data.is_visible !== undefined) {
      updates.push(`is_visible = $${paramIndex}`);
      values.push(data.is_visible);
      paramIndex++;
    }

    if (updates.length === 0) {
      return { success: false, error: 'No updates provided' };
    }

    updates.push(`updated_at = now()`);
    values.push(data.section_id);

    await query(
      `
      UPDATE page_sections
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      `,
      values
    );

    // ✅ פליטת אירוע
    await eventBus.emit(
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
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating section:', error);
    return { success: false, error: 'Failed to update section' };
  }
}

/**
 * מחיקת סקשן
 */
export async function deleteSection(sectionId: number) {
  try {
    const { storeId, userId } = await getAuthInfo();

    await query(`DELETE FROM page_sections WHERE id = $1`, [sectionId]);

    // ✅ פליטת אירוע
    await eventBus.emit(
      'customizer.section.deleted',
      {
        store_id: storeId,
        section_id: sectionId,
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
  config: any
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
        page_layout_id, version_number, snapshot_json
      )
      VALUES ($1, $2, $3)
      `,
      [layoutId, nextVersion, JSON.stringify(config)]
    );
  } catch (error) {
    console.error('Error creating version snapshot:', error);
  }
}


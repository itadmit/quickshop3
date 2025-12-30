-- Migration: Add sections_json to page_layouts
-- הוספת שדה sections_json JSONB ל-page_layouts לשמירת כל ה-layout כ-JSON אחד (כמו Shopify)

-- 1. הוסף את השדה החדש
ALTER TABLE page_layouts 
ADD COLUMN IF NOT EXISTS sections_json JSONB DEFAULT '[]'::jsonb;

-- 2. צור index על ה-JSONB (לחיפוש מהיר)
CREATE INDEX IF NOT EXISTS idx_page_layouts_sections_json_gin 
ON page_layouts USING GIN (sections_json);

-- 3. העתק נתונים קיימים מ-page_sections ו-section_blocks ל-sections_json
-- זה יעבוד רק אם יש נתונים קיימים
DO $$
DECLARE
  layout_rec RECORD;
  sections_array JSONB := '[]'::jsonb;
  section_obj JSONB;
  blocks_array JSONB;
  block_obj JSONB;
BEGIN
  -- עבור כל layout קיים
  FOR layout_rec IN 
    SELECT id FROM page_layouts WHERE sections_json = '[]'::jsonb OR sections_json IS NULL
  LOOP
    sections_array := '[]'::jsonb;
    
    -- טען את כל ה-sections עם ה-blocks שלהם
    FOR section_obj IN
      SELECT 
        jsonb_build_object(
          'id', ps.section_id,
          'type', ps.section_type,
          'name', ps.section_type,
          'visible', ps.is_visible,
          'order', ps.position,
          'locked', ps.is_locked,
          'style', COALESCE((ps.settings_json->>'style')::jsonb, '{}'::jsonb),
          'settings', COALESCE((ps.settings_json->>'settings')::jsonb, ps.settings_json),
          'custom_css', COALESCE(ps.custom_css, ''),
          'custom_classes', COALESCE(ps.custom_classes, ''),
          'blocks', COALESCE(
            (
              SELECT jsonb_agg(
                jsonb_build_object(
                  'id', sb.block_id,
                  'type', sb.block_type,
                  'is_visible', sb.is_visible,
                  'content', COALESCE((sb.settings_json->>'content')::jsonb, '{}'::jsonb),
                  'style', COALESCE((sb.settings_json->>'style')::jsonb, '{}'::jsonb),
                  'settings', COALESCE((sb.settings_json->>'settings')::jsonb, sb.settings_json)
                ) ORDER BY sb.position ASC
              )
              FROM section_blocks sb
              WHERE sb.section_id = ps.id
            ),
            '[]'::jsonb
          )
        ) as section_data
      FROM page_sections ps
      WHERE ps.page_layout_id = layout_rec.id
      ORDER BY ps.position ASC
    LOOP
      sections_array := sections_array || jsonb_build_array(section_obj);
    END LOOP;
    
    -- עדכן את ה-layout עם ה-JSON
    UPDATE page_layouts
    SET sections_json = sections_array
    WHERE id = layout_rec.id;
  END LOOP;
END $$;

-- 4. הערה: הטבלאות page_sections ו-section_blocks נשארות לתאימות לאחור
-- אבל אפשר להשתמש רק ב-sections_json מהיום והלאה


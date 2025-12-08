-- Reset Customizer Data
-- מחיקת כל הנתונים של הקסטומייזר להתחלה מחדש

-- מחיקת בלוקים קודם (foreign key constraints)
DELETE FROM section_blocks;

-- מחיקת סקשנים
DELETE FROM page_sections;

-- מחיקת layouts
DELETE FROM page_layouts;

-- Reset sequences if needed
-- ALTER SEQUENCE page_layouts_id_seq RESTART WITH 1;
-- ALTER SEQUENCE page_sections_id_seq RESTART WITH 1;
-- ALTER SEQUENCE section_blocks_id_seq RESTART WITH 1;

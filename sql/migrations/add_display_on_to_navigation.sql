-- Add display_on column to navigation_menus table
-- This column determines where the menu should be displayed: desktop, mobile, or both

ALTER TABLE navigation_menus 
ADD COLUMN IF NOT EXISTS display_on VARCHAR(20) DEFAULT 'both' CHECK (display_on IN ('desktop', 'mobile', 'both'));

-- Update existing menus to have 'both' as default
UPDATE navigation_menus SET display_on = 'both' WHERE display_on IS NULL;


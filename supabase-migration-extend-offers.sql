-- Migration: Extend angebotskalender_items table for combo offers
-- Run this with admin/owner permissions in Supabase SQL Editor

-- Add columns for custom combo offers to angebotskalender_items table
ALTER TABLE angebotskalender_items 
ADD COLUMN custom_name text,
ADD COLUMN custom_description text,
ADD COLUMN base_price numeric(10,2);

-- Add constraint: either menu_item_id OR custom_name must be present
ALTER TABLE angebotskalender_items 
ADD CONSTRAINT check_item_reference 
CHECK (
  (menu_item_id IS NOT NULL AND custom_name IS NULL) OR 
  (menu_item_id IS NULL AND custom_name IS NOT NULL)
);

-- Add comments to document the table structure
COMMENT ON TABLE angebotskalender_items IS 'Special offer items - can reference menu_items OR be custom combo items';
COMMENT ON COLUMN angebotskalender_items.custom_name IS 'Name for combo/special items not in menu_items table';
COMMENT ON COLUMN angebotskalender_items.custom_description IS 'Description for combo items (e.g., "mit Pommes und Salat")';
COMMENT ON COLUMN angebotskalender_items.base_price IS 'Original price before discount (for custom items only)';
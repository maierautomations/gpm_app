-- Insert missing combo offers from Weekly_offers.md
-- Run this AFTER the table extension migration

-- Get week IDs for reference
-- Schweine Woche (week 4)
INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Maier''s Schaschlik mit Speck, Paprika, Zwiebeln und Pommes', 'Komplett mit Beilagen', 7.90, 9.50
FROM angebotskalender_weeks WHERE week_number = 4;

-- Hähnchen Woche (need to add this week first - it's missing!)
-- First, add Hähnchen Woche to angebotskalender_weeks
INSERT INTO angebotskalender_weeks (week_number, week_theme, description) 
VALUES (8, 'Hähnchen Woche', 'Knusprige Hähnchen Spezialitäten');

-- Now add Hähnchen Woche items
INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, '1/2 Brat-Hähnchen mit knusprigen Pommes', 'Komplette Portion mit Beilage', 8.90, 10.50
FROM angebotskalender_weeks WHERE week_theme = 'Hähnchen Woche';

INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Chicken Nuggets Lady Portion (1 Dip)', 'Mit knusprigen Pommes & Cole Slaw Salat', 6.20, 7.90
FROM angebotskalender_weeks WHERE week_theme = 'Hähnchen Woche';

INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Chicken Nuggets Männer Portion (2 Dip)', 'Mit knusprigen Pommes & Cole Slaw Salat', 9.90, 12.90
FROM angebotskalender_weeks WHERE week_theme = 'Hähnchen Woche';

INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Chicken Nuggets "The Rock" Portion (3 Dip)', 'Mit knusprigen Pommes & Cole Slaw Salat', 11.90, 15.50
FROM angebotskalender_weeks WHERE week_theme = 'Hähnchen Woche';

-- Fleisch Teller Woche (week 5) - Add missing combos
INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Balkanteller mit 10 Cevapcici', 'Mit lecker Pommes und Salat', 11.90, 14.90
FROM angebotskalender_weeks WHERE week_number = 5;

INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Maier''s Kombiteller', '3 Soßen nach Dipliste, 4 Chicken Wings & 4 Chicken Nuggets & 4 Cevapcici', 11.50, 15.90
FROM angebotskalender_weeks WHERE week_number = 5;

-- Wurst Woche (week 6) - Add missing items with sides
INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Maier''s Bockwurst-Knacker mit Pommes', 'Mit Pommes oder Kartoffel- oder Nudelsalat', 6.50, 8.50
FROM angebotskalender_weeks WHERE week_number = 6;

INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, '4 Mini Würstchen mit Pommes', 'Mit Pommes oder Kartoffel- oder Nudelsalat', 6.50, 8.20
FROM angebotskalender_weeks WHERE week_number = 6;

-- Burger Woche (week 1) - Add missing combo
INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Riesen Hot Dog', 'Große Portion', 5.50, 6.90
FROM angebotskalender_weeks WHERE week_number = 1;

-- Croque Woche (week 7) - Add missing combo items
INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, '"Langer Rehm" mit Schinken und Ananas', 'Premium Croque mit Ananas', 8.90, 10.50
FROM angebotskalender_weeks WHERE week_number = 7;

-- Boxen Woche (week 3) - Update existing with proper names
-- These already exist, but let's add the normal size versions
INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Dönerbox Normal (2 Dips)', 'Pommes oder Salat', 4.40, 6.20
FROM angebotskalender_weeks WHERE week_number = 3;

INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Gyrosbox Normal (2 Dips)', 'Pommes oder Salat', 4.40, 6.20
FROM angebotskalender_weeks WHERE week_number = 3;

INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Currybox Normal (2 Dips)', 'Pommes oder Salat', 4.40, 6.20
FROM angebotskalender_weeks WHERE week_number = 3;

INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Nuggetsbox Normal (2 Dips)', 'Pommes oder Salat', 4.40, 6.20
FROM angebotskalender_weeks WHERE week_number = 3;

INSERT INTO angebotskalender_items (week_id, custom_name, custom_description, special_price, base_price)
SELECT id, 'Griechenbox Normal mit Cevapcici (2 Dips)', 'Pommes oder Salat', 4.40, 6.20
FROM angebotskalender_weeks WHERE week_number = 3;
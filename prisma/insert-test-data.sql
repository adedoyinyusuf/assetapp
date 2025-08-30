-- Insert categories
INSERT INTO categories (name, description, created_at, updated_at)
VALUES 
  ('Computers', 'Desktop and laptop computers', NOW(), NOW()),
  ('Furniture', 'Office furniture and fixtures', NOW(), NOW()),
  ('Vehicles', 'Official vehicles', NOW(), NOW()),
  ('Electronics', 'Electronic equipment', NOW(), NOW()),
  ('Office Equipment', 'General office equipment', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert Nigerian states (abbreviated list for example)
INSERT INTO states (name, code, created_at, updated_at)
VALUES 
  ('Abia', 'AB', NOW(), NOW()),
  ('Lagos', 'LA', NOW(), NOW()),
  ('Rivers', 'RI', NOW(), NOW()),
  ('Kano', 'KN', NOW(), NOW()),
  ('Federal Capital Territory', 'FC', NOW(), NOW())
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name;

-- Insert sample LGAs
WITH state_ids AS (SELECT id, code FROM states)
INSERT INTO lgas (name, state_id, created_at, updated_at)
SELECT 'Main City', id, NOW(), NOW() FROM state_ids
ON CONFLICT (name, state_id) DO NOTHING;

-- Insert sample assets
WITH 
  category_ids AS (SELECT id FROM categories WHERE name = 'Computers' LIMIT 1),
  state_ids AS (SELECT id FROM states WHERE code = 'FC' LIMIT 1),
  lga_ids AS (SELECT id FROM lgas WHERE name = 'Main City' AND state_id = (SELECT id FROM state_ids) LIMIT 1)
INSERT INTO assets (
  name, 
  description, 
  purchase_value, 
  purchase_date, 
  useful_life, 
  salvage_value, 
  current_value, 
  category_id, 
  state_id, 
  lga_id, 
  created_at, 
  updated_at
)
SELECT 
  'Dell OptiPlex 7070', 
  'Office desktop computer', 
  150000.00, 
  '2023-01-15'::date, 
  4, 
  30000.00, 
  120000.00, 
  (SELECT id FROM category_ids), 
  (SELECT id FROM state_ids), 
  (SELECT id FROM lga_ids), 
  NOW(), 
  NOW()
FROM category_ids, state_ids, lga_ids
WHERE EXISTS (SELECT 1 FROM category_ids) 
  AND EXISTS (SELECT 1 FROM state_ids)
  AND EXISTS (SELECT 1 FROM lga_ids);

-- Verify the inserted data
SELECT 'Categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 'States', COUNT(*) FROM states
UNION ALL
SELECT 'LGAs', COUNT(*) FROM lgas
UNION ALL
SELECT 'Assets', COUNT(*) FROM assets;

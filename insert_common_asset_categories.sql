-- Common Asset Categories for Organizations
-- This script adds a comprehensive list of asset categories to the database

-- First, update the schema if needed (idempotent)
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS default_useful_life_years INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Clear existing categories (optional - uncomment if needed)
-- TRUNCATE TABLE categories CASCADE;

-- First insert main categories
WITH main_cats AS (
  INSERT INTO categories (name, description, default_useful_life_years) VALUES
  ('IT Equipment', 'Computers, networking, and related technology', 3),
  ('Office Equipment', 'Furniture and general office items', 7),
  ('Vehicles', 'Company vehicles and transportation', 5),
  ('Machinery & Equipment', 'Industrial and manufacturing equipment', 8),
  ('Property', 'Real estate and land assets', 39),  -- 39 years for property
  ('Software', 'Digital assets and licenses', 5),
  ('Miscellaneous', 'Other asset categories', 5)
  RETURNING id, name
)
-- Now insert subcategories with their parent IDs
-- IT Equipment Subcategories
INSERT INTO categories (name, parent_id, default_useful_life_years, description)
SELECT subcat.name, mc.id, subcat.life_years, subcat.description
FROM (VALUES 
  ('Laptops', 3, 'Portable computers'),
  ('Desktops', 4, 'Desktop computers and workstations'),
  ('Monitors', 5, 'Computer displays'),
  ('Printers', 5, 'Printing and scanning devices'),
  ('Scanners', 5, 'Document scanning devices'),
  ('Servers', 5, 'Network servers and storage'),
  ('Network Equipment', 5, 'Routers, switches, and networking gear'),
  ('Telephones', 4, 'Office phone systems'),
  ('Mobile Devices', 2, 'Smartphones and tablets'),
  ('Projectors', 5, 'Presentation and display projectors')
) AS subcat(name, life_years, description)
CROSS JOIN main_cats mc WHERE mc.name = 'IT Equipment';

-- Office Equipment Subcategories
INSERT INTO categories (name, parent_id, default_useful_life_years, description)
SELECT subcat.name, mc.id, subcat.life_years, subcat.description
FROM (VALUES 
  ('Office Furniture', 10, 'Desks, chairs, and workstations'),
  ('Filing Cabinets', 15, 'Document storage'),
  ('Safes', 20, 'Secure storage for valuables'),
  ('Air Conditioners', 10, 'Cooling systems'),
  ('Heaters', 10, 'Heating systems'),
  ('Office Partitions', 10, 'Workspace dividers'),
  ('Whiteboards', 10, 'Writing and presentation boards')
) AS subcat(name, life_years, description)
CROSS JOIN main_cats mc WHERE mc.name = 'Office Equipment';

-- Vehicle Subcategories
INSERT INTO categories (name, parent_id, default_useful_life_years, description)
SELECT subcat.name, mc.id, subcat.life_years, subcat.description
FROM (VALUES 
  ('Cars', 5, 'Passenger vehicles'),
  ('Trucks', 7, 'Light and heavy trucks'),
  ('Vans', 7, 'Passenger and cargo vans'),
  ('Forklifts', 10, 'Material handling equipment'),
  ('Motorcycles', 5, 'Two-wheeled vehicles')
) AS subcat(name, life_years, description)
CROSS JOIN main_cats mc WHERE mc.name = 'Vehicles';

-- Machinery & Equipment Subcategories
INSERT INTO categories (name, parent_id, default_useful_life_years, description)
SELECT subcat.name, mc.id, subcat.life_years, subcat.description
FROM (VALUES 
  ('Manufacturing Equipment', 10, 'Production line machinery'),
  ('Power Tools', 5, 'Electric and pneumatic tools'),
  ('Hand Tools', 7, 'Manual tools'),
  ('Generators', 10, 'Power generation equipment'),
  ('HVAC Systems', 15, 'Heating, ventilation, and air conditioning')
) AS subcat(name, life_years, description)
CROSS JOIN main_cats mc WHERE mc.name = 'Machinery & Equipment';

-- Property Subcategories
INSERT INTO categories (name, parent_id, default_useful_life_years, description)
SELECT subcat.name, mc.id, subcat.life_years, subcat.description
FROM (VALUES 
  ('Buildings', 39, 'Commercial and office buildings'),
  ('Land', 0, 'Undeveloped land (no depreciation)'),
  ('Leasehold Improvements', 15, 'Building improvements')
) AS subcat(name, life_years, description)
CROSS JOIN main_cats mc WHERE mc.name = 'Property';

-- Software Subcategories
INSERT INTO categories (name, parent_id, default_useful_life_years, description)
SELECT subcat.name, mc.id, subcat.life_years, subcat.description
FROM (VALUES 
  ('Software Licenses', 3, 'Perpetual and term licenses'),
  ('Cloud Services', 1, 'Subscription-based cloud services'),
  ('Digital Assets', 3, 'Other digital properties')
) AS subcat(name, life_years, description)
CROSS JOIN main_cats mc WHERE mc.name = 'Software';

-- Miscellaneous Subcategories
INSERT INTO categories (name, parent_id, default_useful_life_years, description)
SELECT subcat.name, mc.id, subcat.life_years, subcat.description
FROM (VALUES 
  ('Security Systems', 10, 'Surveillance and access control'),
  ('Medical Equipment', 8, 'Healthcare devices'),
  ('Laboratory Equipment', 10, 'Scientific instruments'),
  ('Kitchen Equipment', 10, 'Food preparation appliances'),
  ('Cleaning Equipment', 7, 'Maintenance and cleaning tools')
) AS subcat(name, life_years, description)
CROSS JOIN main_cats mc WHERE mc.name = 'Miscellaneous';

-- Verify the inserted categories with hierarchy
WITH RECURSIVE category_hierarchy AS (
  SELECT id, name, parent_id, default_useful_life_years, description, 0 as level
  FROM categories
  WHERE parent_id IS NULL
  
  UNION ALL
  
  SELECT c.id, c.name, c.parent_id, c.default_useful_life_years, c.description, ch.level + 1
  FROM categories c
  JOIN category_hierarchy ch ON c.parent_id = ch.id
)
SELECT 
  REPEAT('  ', level) || name as category,
  default_useful_life_years as "Useful Life (Years)",
  description
FROM category_hierarchy
ORDER BY level, name;

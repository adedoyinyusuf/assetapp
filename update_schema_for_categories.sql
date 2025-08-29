-- Add parent_id for subcategories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS default_useful_life_years INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for better performance with parent-child queries
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

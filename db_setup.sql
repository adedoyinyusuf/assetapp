-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_value DECIMAL(10, 2) NOT NULL,
    salvage_value DECIMAL(10, 2) NOT NULL,
    useful_life INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    state_id INTEGER NOT NULL,
    lga_id INTEGER NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Create states table
CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Create LGAs table
CREATE TABLE IF NOT EXISTS lgas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state_id INTEGER NOT NULL,
    UNIQUE(name, state_id)
);

-- Create asset_movements table
CREATE TABLE IF NOT EXISTS asset_movements (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    move_date DATE NOT NULL,
    notes TEXT
);

-- Add foreign key constraints
DO $$ BEGIN
  ALTER TABLE assets
    ADD CONSTRAINT fk_category FOREIGN KEY (category_id)
    REFERENCES categories(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE assets
    ADD CONSTRAINT fk_state FOREIGN KEY (state_id)
    REFERENCES states(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE assets
    ADD CONSTRAINT fk_lga FOREIGN KEY (lga_id)
    REFERENCES lgas(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE lgas
    ADD CONSTRAINT fk_state FOREIGN KEY (state_id)
    REFERENCES states(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE asset_movements
    ADD CONSTRAINT fk_asset FOREIGN KEY (asset_id)
    REFERENCES assets(id) ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_lgas_state_id ON lgas(state_id);
CREATE INDEX IF NOT EXISTS idx_assets_state_id ON assets(state_id);
CREATE INDEX IF NOT EXISTS idx_assets_lga_id ON assets(lga_id);

-- Insert some initial data

-- Categories
INSERT INTO categories (name) VALUES
('Fixed Assets: Buildings'),
('Fixed Assets: Land'),
('Fixed Assets: Machinery'),
('Fixed Assets: Vehicles'),
('Fixed Assets: Office Equipment');

-- States
INSERT INTO states (name) VALUES
('ABIA'),
('ADAMAWA'),
('AKWA IBOM'),
('ANAMBRA'),
('BAUCHI');

-- LGAs (sample for ABIA state)
INSERT INTO lgas (name, state_id) VALUES
('ABA NORTH', 1),
('ABA SOUTH', 1),
('AROCHUKWU', 1),
('BENDE', 1),
('IKWUANO', 1);

-- LGAs (sample for ADAMAWA state)
INSERT INTO lgas (name, state_id) VALUES
('DEMSA', 2),
('FUFURE', 2),
('GANYE', 2),
('GAYUK', 2),
('GOMBI', 2);

-- You can add more sample data as needed


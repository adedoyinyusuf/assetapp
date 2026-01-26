-- Mobile Device Management (MDM) Module - Database Migration
-- This migration creates all tables needed for the MDM module
-- Safe to run - does not modify existing tables

BEGIN;

-- ===================================
-- 1. Staff Users Table
-- ===================================
CREATE TABLE IF NOT EXISTS staff_users (
  id SERIAL PRIMARY KEY,
  staff_id VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(20),
  department VARCHAR(100),
  position VARCHAR(100),
  state_id INTEGER REFERENCES states(id),
  lga_id INTEGER REFERENCES lgas(id),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_users_staff_id ON staff_users(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_status ON staff_users(status);

-- ===================================
-- 2. Mobile Devices Table
-- ===================================
CREATE TABLE IF NOT EXISTS mobile_devices (
  id SERIAL PRIMARY KEY,
  
  -- Device Identity
  imei_1 VARCHAR(15) UNIQUE NOT NULL,
  imei_2 VARCHAR(15) UNIQUE,
  device_name VARCHAR(255),
  serial_number VARCHAR(100),
  
  -- Device Details
  manufacturer VARCHAR(100),
  model VARCHAR(100),
  os_type VARCHAR(50), -- 'iOS', 'Android', 'Other'
  os_version VARCHAR(50),
  
  -- Purchase & Warranty
  purchase_date DATE,
  purchase_value DECIMAL(12, 2),
  warranty_expiry DATE,
  carrier VARCHAR(100),
  
  -- Current Status
  status VARCHAR(50) DEFAULT 'AVAILABLE', -- AVAILABLE, ASSIGNED, REPAIR, RETIRED
  health_status VARCHAR(50), -- GOOD, NEEDS_ATTENTION, CRITICAL
  battery_level INTEGER,
  storage_used_gb DECIMAL(8, 2),
  storage_total_gb DECIMAL(8, 2),
  
  -- Location
  last_location_lat DECIMAL(10, 8),
  last_location_lng DECIMAL(11, 8),
  last_location_updated TIMESTAMP,
  
  -- MDM Control
  is_enrolled BOOLEAN DEFAULT false,
  enrollment_date TIMESTAMP,
  is_locked BOOLEAN DEFAULT false,
  is_lost_mode BOOLEAN DEFAULT false,
  fcm_token TEXT, -- For push notifications (Android)
  apns_token TEXT, -- For push notifications (iOS)
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_devices_imei_1 ON mobile_devices(imei_1);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_imei_2 ON mobile_devices(imei_2);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_status ON mobile_devices(status);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_os_type ON mobile_devices(os_type);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_is_enrolled ON mobile_devices(is_enrolled);

-- ===================================
-- 3. Device Assignments Table
-- ===================================
CREATE TABLE IF NOT EXISTS device_assignments (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  staff_id INTEGER NOT NULL REFERENCES staff_users(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP DEFAULT NOW(),
  returned_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, RETURNED, LOST
  notes TEXT,
  assigned_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_assignments_device_id ON device_assignments(device_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_staff_id ON device_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_device_assignments_status ON device_assignments(status);

-- ===================================
-- 4. SIM Cards Table
-- ===================================
CREATE TABLE IF NOT EXISTS sim_cards (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES mobile_devices(id) ON DELETE SET NULL,
  sim_number VARCHAR(20) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  carrier VARCHAR(100),
  plan_type VARCHAR(100),
  monthly_cost DECIMAL(10, 2),
  data_limit_gb DECIMAL(8, 2),
  activation_date DATE,
  status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sim_cards_device_id ON sim_cards(device_id);
CREATE INDEX IF NOT EXISTS idx_sim_cards_sim_number ON sim_cards(sim_number);
CREATE INDEX IF NOT EXISTS idx_sim_cards_phone_number ON sim_cards(phone_number);
CREATE INDEX IF NOT EXISTS idx_sim_cards_status ON sim_cards(status);

-- ===================================
-- 5. Device Commands Table
-- ===================================
CREATE TABLE IF NOT EXISTS device_commands (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  command_type VARCHAR(50) NOT NULL, -- LOCK, WIPE, LOCATE, ALARM, UNLOCK
  status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, SENT, EXECUTED, FAILED
  initiated_by VARCHAR(255) NOT NULL,
  initiated_at TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  response_data JSONB,
  error_message TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_device_commands_device_id ON device_commands(device_id);
CREATE INDEX IF NOT EXISTS idx_device_commands_command_type ON device_commands(command_type);
CREATE INDEX IF NOT EXISTS idx_device_commands_status ON device_commands(status);
CREATE INDEX IF NOT EXISTS idx_device_commands_initiated_at ON device_commands(initiated_at DESC);

-- ===================================
-- 6. Device Maintenance Table
-- ===================================
CREATE TABLE IF NOT EXISTS device_maintenance (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES mobile_devices(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100), -- REPAIR, SCREEN_REPLACEMENT, BATTERY_REPLACEMENT
  issue_description TEXT,
  repair_cost DECIMAL(10, 2),
  vendor VARCHAR(255),
  start_date DATE,
  completion_date DATE,
  status VARCHAR(50) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED, CANCELLED
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_maintenance_device_id ON device_maintenance(device_id);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_status ON device_maintenance(status);

-- ===================================
-- 7. Create Update Trigger Function
-- ===================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that need auto-update timestamps
DROP TRIGGER IF EXISTS update_staff_users_updated_at ON staff_users;
CREATE TRIGGER update_staff_users_updated_at 
  BEFORE UPDATE ON staff_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mobile_devices_updated_at ON mobile_devices;
CREATE TRIGGER update_mobile_devices_updated_at 
  BEFORE UPDATE ON mobile_devices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sim_cards_updated_at ON sim_cards;
CREATE TRIGGER update_sim_cards_updated_at 
  BEFORE UPDATE ON sim_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'MDM Module tables created successfully!';
END $$;

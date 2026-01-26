-- MDM Module Rollback Script
-- This script safely removes all MDM tables
-- WARNING: This will delete all MDM data!

BEGIN;

-- Drop triggers first
DROP TRIGGER IF EXISTS update_staff_users_updated_at ON staff_users;
DROP TRIGGER IF EXISTS update_mobile_devices_updated_at ON mobile_devices;
DROP TRIGGER IF EXISTS update_sim_cards_updated_at ON sim_cards;

-- Drop tables in reverse order (respecting foreign key dependencies)
DROP TABLE IF EXISTS device_maintenance CASCADE;
DROP TABLE IF EXISTS device_commands CASCADE;
DROP TABLE IF EXISTS sim_cards CASCADE;
DROP TABLE IF EXISTS device_assignments CASCADE;
DROP TABLE IF EXISTS mobile_devices CASCADE;
DROP TABLE IF EXISTS staff_users CASCADE;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'MDM Module tables removed successfully!';
END $$;

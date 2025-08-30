-- Insert roles if they don't exist
INSERT INTO user_roles (name, description, created_at, updated_at)
VALUES 
  ('VIEWER', 'Can view assets and basic reports', NOW(), NOW()),
  ('OPERATOR', 'Can manage assets and view reports', NOW(), NOW()),
  ('MANAGER', 'Can manage assets, categories, and view all reports', NOW(), NOW()),
  ('ADMIN', 'Full access to all features', NOW(), NOW()),
  ('SUPER_ADMIN', 'Full system access including user management', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert users with hashed passwords (password is 'password' hashed with bcrypt)
-- You can generate your own hashes at: https://bcrypt-generator.com/
WITH inserted_roles AS (
  SELECT id, name FROM user_roles
)
INSERT INTO users (email, first_name, last_name, hashed_password, role_id, is_active, created_at, updated_at)
VALUES 
  ('super.admin@npopc.gov.ng', 'Super', 'Admin', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
   (SELECT id FROM inserted_roles WHERE name = 'SUPER_ADMIN'), true, NOW(), NOW()),
  
  ('admin@npopc.gov.ng', 'Admin', 'User', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
   (SELECT id FROM inserted_roles WHERE name = 'ADMIN'), true, NOW(), NOW()),
  
  ('manager@npopc.gov.ng', 'Department', 'Manager', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
   (SELECT id FROM inserted_roles WHERE name = 'MANAGER'), true, NOW(), NOW()),
  
  ('operator@npopc.gov.ng', 'Asset', 'Operator', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
   (SELECT id FROM inserted_roles WHERE name = 'OPERATOR'), true, NOW(), NOW()),
  
  ('viewer@npopc.gov.ng', 'Read-Only', 'User', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
   (SELECT id FROM inserted_roles WHERE name = 'VIEWER'), true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE 
SET 
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  hashed_password = EXCLUDED.hashed_password,
  role_id = EXCLUDED.role_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verify the inserted users
SELECT u.id, u.email, u.first_name, u.last_name, r.name as role, u.is_active
FROM users u
JOIN user_roles r ON u.role_id = r.id
ORDER BY r.id;

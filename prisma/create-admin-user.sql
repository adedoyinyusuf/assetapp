-- First, ensure the ADMIN role exists
INSERT INTO user_roles (name, description, created_at, updated_at)
VALUES ('ADMIN', 'Administrator with full access', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Create a new admin user with a hashed password (password: Admin@123)
INSERT INTO users (
  email, 
  hashed_password, 
  first_name, 
  last_name, 
  role_id, 
  is_active, 
  created_at, 
  updated_at
)
VALUES (
  'admin@npopc.gov.ng', 
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',  -- hashed 'Admin@123'
  'System', 
  'Administrator', 
  (SELECT id FROM user_roles WHERE name = 'ADMIN' LIMIT 1), 
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  hashed_password = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  is_active = true,
  updated_at = NOW()
RETURNING *;

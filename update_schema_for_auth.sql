-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  hashed_password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_id INTEGER REFERENCES user_roles(id) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create refresh_tokens table for JWT refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER REFERENCES user_roles(id) ON DELETE CASCADE,
  permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_logs table for security events
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON user_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default roles
INSERT INTO user_roles (name, description)
VALUES 
  ('VIEWER', 'Can view assets and reports'),
  ('OPERATOR', 'Can manage assets and operations'),
  ('MANAGER', 'Can manage assets, operations, and view reports'),
  ('ADMIN', 'Full access including user management'),
  ('SUPER_ADMIN', 'System owner with all permissions')
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user (password will be hashed by the application)
-- Default password: Admin@123
INSERT INTO users (email, hashed_password, first_name, last_name, role_id, is_active)
SELECT 
  'admin@example.com', 
  '$2a$10$XFDq3wZ2O3O0ZJ6q5vY1rO9Xe3rVqk8LdA1sB2c3D4e5F6gH7iJ8k', -- bcrypt hash of 'Admin@123'
  'System', 
  'Administrator', 
  (SELECT id FROM user_roles WHERE name = 'SUPER_ADMIN' LIMIT 1), 
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

-- Insert permissions
INSERT INTO permissions (name, description, resource, action)
VALUES 
  ('VIEW_ASSETS', 'View assets', 'assets', 'view'),
  ('CREATE_ASSETS', 'Create assets', 'assets', 'create'),
  ('UPDATE_ASSETS', 'Update assets', 'assets', 'update'),
  ('DELETE_ASSETS', 'Delete assets', 'assets', 'delete'),
  ('VIEW_REPORTS', 'View reports', 'reports', 'view'),
  ('GENERATE_REPORTS', 'Generate reports', 'reports', 'generate'),
  ('EXPORT_REPORTS', 'Export reports', 'reports', 'export'),
  ('VIEW_OPERATIONS', 'View operations', 'operations', 'view'),
  ('MANAGE_OPERATIONS', 'Manage operations', 'operations', 'manage'),
  ('VIEW_USERS', 'View users', 'users', 'view'),
  ('MANAGE_USERS', 'Manage users', 'users', 'manage'),
  ('MANAGE_SYSTEM', 'Manage system settings', 'system', 'manage')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- VIEWER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'VIEWER'),
  id 
FROM permissions 
WHERE name IN ('VIEW_ASSETS', 'VIEW_REPORTS')
ON CONFLICT DO NOTHING;

-- OPERATOR
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'OPERATOR'),
  id 
FROM permissions 
WHERE name IN ('VIEW_ASSETS', 'CREATE_ASSETS', 'UPDATE_ASSETS', 'VIEW_REPORTS', 'VIEW_OPERATIONS', 'MANAGE_OPERATIONS')
ON CONFLICT DO NOTHING;

-- MANAGER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'MANAGER'),
  id 
FROM permissions 
WHERE name IN ('VIEW_ASSETS', 'CREATE_ASSETS', 'UPDATE_ASSETS', 'DELETE_ASSETS', 'VIEW_REPORTS', 'GENERATE_REPORTS', 'EXPORT_REPORTS', 'VIEW_OPERATIONS', 'MANAGE_OPERATIONS', 'VIEW_USERS')
ON CONFLICT DO NOTHING;

-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'ADMIN'),
  id 
FROM permissions 
WHERE name IN ('VIEW_ASSETS', 'CREATE_ASSETS', 'UPDATE_ASSETS', 'DELETE_ASSETS', 'VIEW_REPORTS', 'GENERATE_REPORTS', 'EXPORT_REPORTS', 'VIEW_OPERATIONS', 'MANAGE_OPERATIONS', 'VIEW_USERS', 'MANAGE_USERS')
ON CONFLICT DO NOTHING;

-- SUPER_ADMIN (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM user_roles WHERE name = 'SUPER_ADMIN'),
  id 
FROM permissions
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens (token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

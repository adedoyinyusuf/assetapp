-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER REFERENCES user_roles(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

-- Insert basic permissions for each resource and action
INSERT INTO permissions (name, description, resource, action) VALUES
    -- Asset permissions
    ('CREATE_ASSET', 'Create new assets', 'ASSET', 'CREATE'),
    ('READ_ASSET', 'View assets', 'ASSET', 'READ'),
    ('UPDATE_ASSET', 'Modify assets', 'ASSET', 'UPDATE'),
    ('DELETE_ASSET', 'Delete assets', 'ASSET', 'DELETE'),
    
    -- Movement permissions
    ('CREATE_MOVEMENT', 'Create asset movements', 'MOVEMENT', 'CREATE'),
    ('READ_MOVEMENT', 'View asset movements', 'MOVEMENT', 'READ'),
    ('UPDATE_MOVEMENT', 'Modify asset movements', 'MOVEMENT', 'UPDATE'),
    ('DELETE_MOVEMENT', 'Delete asset movements', 'MOVEMENT', 'DELETE'),
    
    -- Report permissions
    ('READ_REPORT', 'View reports', 'REPORT', 'READ'),
    ('CREATE_REPORT', 'Create reports', 'REPORT', 'CREATE'),
    ('EXPORT_REPORT', 'Export reports', 'REPORT', 'EXPORT'),
    
    -- Analytics permissions
    ('READ_ANALYTICS', 'View analytics', 'ANALYTICS', 'READ'),
    ('EXPORT_ANALYTICS', 'Export analytics data', 'ANALYTICS', 'EXPORT'),
    
    -- Search permissions
    ('USE_SEARCH', 'Use advanced search', 'SEARCH', 'USE'),
    ('SAVE_SEARCH', 'Save search queries', 'SEARCH', 'SAVE'),
    
    -- User management permissions
    ('CREATE_USER', 'Create new users', 'USER', 'CREATE'),
    ('READ_USER', 'View user information', 'USER', 'READ'),
    ('UPDATE_USER', 'Modify user information', 'USER', 'UPDATE'),
    ('DELETE_USER', 'Delete users', 'USER', 'DELETE'),
    
    -- System permissions
    ('MANAGE_SYSTEM', 'Manage system settings', 'SYSTEM', 'MANAGE'),
    ('VIEW_LOGS', 'View system logs', 'SYSTEM', 'VIEW')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles based on their level
-- VIEWER: Basic read access
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, permissions p
WHERE r.name = 'VIEWER' 
  AND p.name IN ('READ_ASSET', 'READ_MOVEMENT', 'READ_REPORT')
ON CONFLICT DO NOTHING;

-- OPERATOR: Asset management + basic reports
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, permissions p
WHERE r.name = 'OPERATOR' 
  AND p.name IN ('CREATE_ASSET', 'READ_ASSET', 'UPDATE_ASSET', 'CREATE_MOVEMENT', 'READ_MOVEMENT', 'READ_REPORT')
ON CONFLICT DO NOTHING;

-- MANAGER: Full asset management + reports + analytics
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, permissions p
WHERE r.name = 'MANAGER' 
  AND p.name IN ('CREATE_ASSET', 'READ_ASSET', 'UPDATE_ASSET', 'DELETE_ASSET', 
                 'CREATE_MOVEMENT', 'READ_MOVEMENT', 'UPDATE_MOVEMENT', 'DELETE_MOVEMENT',
                 'READ_REPORT', 'CREATE_REPORT', 'EXPORT_REPORT', 'READ_ANALYTICS', 'USE_SEARCH')
ON CONFLICT DO NOTHING;

-- ADMIN: Full access except user management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, permissions p
WHERE r.name = 'ADMIN' 
  AND p.name NOT IN ('CREATE_USER', 'DELETE_USER', 'MANAGE_SYSTEM')
ON CONFLICT DO NOTHING;

-- SUPER_ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM user_roles r, permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT DO NOTHING;

-- Verify the permissions setup
SELECT r.name as role, COUNT(rp.permission_id) as permission_count
FROM user_roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.id;

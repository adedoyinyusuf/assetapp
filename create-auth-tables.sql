-- Create basic authentication tables for testing
CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role_id INTEGER REFERENCES user_roles(id),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert basic roles
INSERT INTO user_roles (name, description) VALUES
    ('VIEWER', 'Can view assets and basic reports'),
    ('OPERATOR', 'Can manage assets and view reports'),
    ('MANAGER', 'Can manage assets, categories, and view all reports'),
    ('ADMIN', 'Full access to all features'),
    ('SUPER_ADMIN', 'Full system access including user management')
ON CONFLICT (name) DO NOTHING;

-- Insert test users (password is 'password' hashed with bcrypt)
INSERT INTO users (email, first_name, last_name, hashed_password, role_id, is_active) VALUES
    ('super.admin@npopc.gov.ng', 'Super', 'Admin', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
     (SELECT id FROM user_roles WHERE name = 'SUPER_ADMIN'), true),
    
    ('admin@npopc.gov.ng', 'Admin', 'User', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
     (SELECT id FROM user_roles WHERE name = 'ADMIN'), true),
    
    ('manager@npopc.gov.ng', 'Department', 'Manager', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
     (SELECT id FROM user_roles WHERE name = 'MANAGER'), true),
    
    ('operator@npopc.gov.ng', 'Asset', 'Operator', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
     (SELECT id FROM user_roles WHERE name = 'OPERATOR'), true),
    
    ('viewer@npopc.gov.ng', 'Read-Only', 'User', '$2a$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
     (SELECT id FROM user_roles WHERE name = 'VIEWER'), true)
ON CONFLICT (email) DO UPDATE 
SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    hashed_password = EXCLUDED.hashed_password,
    role_id = EXCLUDED.role_id,
    is_active = EXCLUDED.is_active,
    updated_at = CURRENT_TIMESTAMP;

-- Verify the inserted data
SELECT u.id, u.email, u.first_name, u.last_name, r.name as role, u.is_active
FROM users u
JOIN user_roles r ON u.role_id = r.id
ORDER BY r.id;

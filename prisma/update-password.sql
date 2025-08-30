-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Update the password for the super admin user
UPDATE users 
SET password = crypt('password', gen_salt('bf')) 
WHERE email = 'super.admin@npopc.gov.ng';

-- Verify the update
SELECT email, password FROM users WHERE email = 'super.admin@npopc.gov.ng';

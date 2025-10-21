-- Create test admin account in profiles table
-- The user will need to register through the UI with email: admin@parley.test
-- This migration just ensures the profile exists with admin role

-- First, let's make sure bartek@dajer.pl is admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'bartek@dajer.pl';

-- Insert test admin profile (will be linked after user registers)
-- Email: admin@parley.test
-- Password: Admin123!
INSERT INTO profiles (id, email, role, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@parley.test',
  'admin',
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';

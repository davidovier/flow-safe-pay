-- Validation script to check user role assignment
-- Run this in Supabase SQL editor to validate the fix

-- Check current user roles distribution
SELECT 
  role,
  COUNT(*) as count,
  ARRAY_AGG(email ORDER BY created_at DESC) as sample_emails
FROM users 
GROUP BY role
ORDER BY role;

-- Check if any users have incorrect roles vs their intended role
-- (This assumes you have some way to track intended vs actual roles)
SELECT 
  u.email,
  u.role as current_role,
  u.first_name,
  u.last_name,
  u.created_at,
  -- Try to extract any metadata that might hint at intended role
  CASE 
    WHEN u.email LIKE '%brand%' OR u.email LIKE '%company%' THEN 'Should likely be BRAND'
    WHEN u.email LIKE '%creator%' OR u.email LIKE '%artist%' THEN 'Should likely be CREATOR' 
    ELSE 'Unclear intended role'
  END as role_hint
FROM users u
ORDER BY u.created_at DESC
LIMIT 20;

-- Check the current handle_new_user function definition
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'handle_new_user';

-- Test data to verify the fix would work
-- (Don't actually run the INSERT unless you want test data)
/*
-- This would simulate what happens during signup with role selection
INSERT INTO auth.users (
  id,
  email,
  raw_user_meta_data,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test-brand@example.com',
  '{"role": "BRAND", "first_name": "Test", "last_name": "Brand"}',
  now(),
  now(),
  now()
);
*/
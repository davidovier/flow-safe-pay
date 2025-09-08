-- Script to fix existing users who may have been assigned wrong roles
-- Run this AFTER applying the migration fix

-- First, let's see what users we have and their current roles
SELECT 
  u.id,
  u.email,
  u.role as current_role,
  u.first_name,
  u.last_name,
  u.created_at,
  -- Try to infer correct role from email patterns
  CASE 
    WHEN u.email LIKE '%brand%' OR u.email LIKE '%company%' OR u.email LIKE '%business%' THEN 'BRAND'
    WHEN u.email LIKE '%creator%' OR u.email LIKE '%artist%' OR u.email LIKE '%content%' THEN 'CREATOR'
    ELSE u.role -- Keep current role if we can't infer
  END as suggested_role
FROM users u
ORDER BY u.created_at DESC;

-- Update specific known test accounts to have correct roles
-- Only update if the suggested role is different from current role

-- Fix brand test account
UPDATE users 
SET role = 'BRAND'::user_role
WHERE email = 'brand@test.com' 
  AND role != 'BRAND';

-- Fix any other accounts that seem to be misassigned based on email
UPDATE users 
SET role = 'BRAND'::user_role 
WHERE (email LIKE '%brand%' OR email LIKE '%company%' OR email LIKE '%business%')
  AND role != 'BRAND';

UPDATE users 
SET role = 'CREATOR'::user_role 
WHERE (email LIKE '%creator%' OR email LIKE '%artist%' OR email LIKE '%content%')
  AND role != 'CREATOR';

-- Log these corrections for audit
INSERT INTO events (type, actor_user_id, payload) 
VALUES (
  'system.user_role_correction',
  NULL, -- system operation
  jsonb_build_object(
    'description', 'Corrected user roles for accounts that were misassigned due to database trigger bug',
    'corrected_accounts', (
      SELECT json_agg(email) 
      FROM users 
      WHERE email IN ('brand@test.com') OR email LIKE '%brand%' OR email LIKE '%creator%'
    ),
    'timestamp', now(),
    'reason', 'handle_new_user trigger was hardcoding role as CREATOR'
  )
);

-- Verify the corrections
SELECT 
  'After Fix' as status,
  role,
  COUNT(*) as count,
  ARRAY_AGG(email ORDER BY created_at DESC) as emails
FROM users 
GROUP BY role
ORDER BY role;
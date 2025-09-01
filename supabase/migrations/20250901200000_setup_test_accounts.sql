-- Setup verified test accounts for development
-- This migration ensures test accounts exist with email verification

DO $$
DECLARE
  test_brand_id UUID;
  test_creator_id UUID;
  test_project_id UUID;
  test_deal_id UUID;
  test_milestone_id UUID;
BEGIN
  -- Insert test brand user if not exists
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'brand@test.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Test", "last_name": "Brand", "role": "BRAND"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE
  )
  ON CONFLICT (email) DO UPDATE SET
    email_confirmed_at = NOW(),
    raw_user_meta_data = '{"first_name": "Test", "last_name": "Brand", "role": "BRAND"}'
  RETURNING id INTO test_brand_id;

  -- Insert test creator user if not exists
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'creator@test.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    NOW(),
    '',
    NOW(),
    '',
    NULL,
    '',
    '',
    NULL,
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"first_name": "Test", "last_name": "Creator", "role": "CREATOR"}',
    FALSE,
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NULL,
    '',
    0,
    NULL,
    '',
    NULL,
    FALSE
  )
  ON CONFLICT (email) DO UPDATE SET
    email_confirmed_at = NOW(),
    raw_user_meta_data = '{"first_name": "Test", "last_name": "Creator", "role": "CREATOR"}'
  RETURNING id INTO test_creator_id;

  -- Get the IDs for existing users if they exist
  IF test_brand_id IS NULL THEN
    SELECT id INTO test_brand_id FROM auth.users WHERE email = 'brand@test.com';
  END IF;

  IF test_creator_id IS NULL THEN
    SELECT id INTO test_creator_id FROM auth.users WHERE email = 'creator@test.com';
  END IF;

  -- Insert or update brand user profile
  INSERT INTO public.users (id, email, role, first_name, last_name, country, kyc_status)
  VALUES (
    test_brand_id,
    'brand@test.com',
    'BRAND',
    'Test',
    'Brand',
    'US',
    'approved'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'BRAND',
    first_name = 'Test',
    last_name = 'Brand',
    country = 'US',
    kyc_status = 'approved';

  -- Insert or update creator user profile
  INSERT INTO public.users (id, email, role, first_name, last_name, country, kyc_status)
  VALUES (
    test_creator_id,
    'creator@test.com',
    'CREATOR',
    'Test',
    'Creator',
    'US',
    'approved'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'CREATOR',
    first_name = 'Test',
    last_name = 'Creator',
    country = 'US',
    kyc_status = 'approved';

  -- Create a test project for the brand
  INSERT INTO public.projects (id, brand_id, title, description, status)
  VALUES (
    gen_random_uuid(),
    test_brand_id,
    'Sample Brand Campaign',
    'A test project for development purposes featuring product reviews and social media content.',
    'active'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO test_project_id;

  -- Get project ID if it already exists
  IF test_project_id IS NULL THEN
    SELECT id INTO test_project_id 
    FROM public.projects 
    WHERE brand_id = test_brand_id 
    AND title = 'Sample Brand Campaign'
    LIMIT 1;
  END IF;

  -- Create a test deal
  INSERT INTO public.deals (id, project_id, creator_id, currency, amount_total, state)
  VALUES (
    gen_random_uuid(),
    test_project_id,
    test_creator_id,
    'usd',
    500000, -- $5000 in cents
    'FUNDED'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO test_deal_id;

  -- Get deal ID if it already exists
  IF test_deal_id IS NULL THEN
    SELECT id INTO test_deal_id 
    FROM public.deals 
    WHERE project_id = test_project_id 
    AND creator_id = test_creator_id
    LIMIT 1;
  END IF;

  -- Create test milestones
  INSERT INTO public.milestones (id, deal_id, title, amount, due_at, state)
  VALUES (
    gen_random_uuid(),
    test_deal_id,
    'Content Creation',
    300000, -- $3000 in cents
    NOW() + INTERVAL '14 days',
    'PENDING'
  ),
  (
    gen_random_uuid(),
    test_deal_id,
    'Performance Report',
    200000, -- $2000 in cents
    NOW() + INTERVAL '30 days',
    'PENDING'
  )
  ON CONFLICT DO NOTHING;

END $$;
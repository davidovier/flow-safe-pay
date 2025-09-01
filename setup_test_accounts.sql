-- Setup verified test accounts for development
-- Run this script in Supabase SQL Editor to ensure test accounts are email verified

-- Update existing test accounts to be email verified, or create them if they don't exist
-- Note: This approach works with the existing Supabase auth system

DO $$
DECLARE
  test_brand_email text := 'brand@test.com';
  test_creator_email text := 'creator@test.com';
  test_brand_id uuid;
  test_creator_id uuid;
  test_project_id uuid;
  test_deal_id uuid;
BEGIN
  -- Check if brand account exists and update email verification
  SELECT id INTO test_brand_id FROM auth.users WHERE email = test_brand_email;
  
  IF test_brand_id IS NOT NULL THEN
    -- Update existing brand account to be email verified
    UPDATE auth.users 
    SET 
      email_confirmed_at = NOW(),
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'),
        '{first_name}', 
        '"Test"'
      ) || jsonb_set(
        COALESCE(raw_user_meta_data, '{}'),
        '{last_name}', 
        '"Brand"'
      )
    WHERE id = test_brand_id;
    
    -- Update or insert user profile
    INSERT INTO public.users (id, email, role, first_name, last_name, country, kyc_status)
    VALUES (test_brand_id, test_brand_email, 'BRAND', 'Test', 'Brand', 'US', 'approved')
    ON CONFLICT (id) DO UPDATE SET
      role = 'BRAND',
      first_name = 'Test',
      last_name = 'Brand',
      country = 'US',
      kyc_status = 'approved';
      
    RAISE NOTICE 'Updated existing brand account: %', test_brand_id;
  ELSE
    RAISE NOTICE 'Brand account % does not exist. Please create it through the normal signup process first.', test_brand_email;
  END IF;
  
  -- Check if creator account exists and update email verification
  SELECT id INTO test_creator_id FROM auth.users WHERE email = test_creator_email;
  
  IF test_creator_id IS NOT NULL THEN
    -- Update existing creator account to be email verified
    UPDATE auth.users 
    SET 
      email_confirmed_at = NOW(),
      raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'),
        '{first_name}', 
        '"Test"'
      ) || jsonb_set(
        COALESCE(raw_user_meta_data, '{}'),
        '{last_name}', 
        '"Creator"'
      )
    WHERE id = test_creator_id;
    
    -- Update or insert user profile
    INSERT INTO public.users (id, email, role, first_name, last_name, country, kyc_status)
    VALUES (test_creator_id, test_creator_email, 'CREATOR', 'Test', 'Creator', 'US', 'approved')
    ON CONFLICT (id) DO UPDATE SET
      role = 'CREATOR',
      first_name = 'Test',
      last_name = 'Creator',  
      country = 'US',
      kyc_status = 'approved';
      
    RAISE NOTICE 'Updated existing creator account: %', test_creator_id;
  ELSE
    RAISE NOTICE 'Creator account % does not exist. Please create it through the normal signup process first.', test_creator_email;
  END IF;
  
  -- If both accounts exist, create test project and deal
  IF test_brand_id IS NOT NULL AND test_creator_id IS NOT NULL THEN
    -- Create test project
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
    
    -- Create test deal
    IF test_project_id IS NOT NULL THEN
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
      
      -- Create test milestones if deal was created
      IF test_deal_id IS NOT NULL THEN
        INSERT INTO public.milestones (deal_id, title, amount, due_at, state)
        VALUES 
        (test_deal_id, 'Content Creation', 300000, NOW() + INTERVAL '14 days', 'PENDING'),
        (test_deal_id, 'Performance Report', 200000, NOW() + INTERVAL '30 days', 'PENDING')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Created test deal and milestones';
      END IF;
    END IF;
  END IF;
  
END $$;

-- Verify the setup
SELECT 
  u.email,
  u.role,
  u.first_name,
  u.last_name,
  u.kyc_status,
  au.email_confirmed_at IS NOT NULL as email_verified
FROM public.users u
JOIN auth.users au ON u.id = au.id  
WHERE u.email IN ('brand@test.com', 'creator@test.com')
ORDER BY u.role;
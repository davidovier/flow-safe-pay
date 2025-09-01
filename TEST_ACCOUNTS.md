# Test Accounts Setup

This document explains how to set up verified test accounts for FlowPay development.

## Test Account Credentials

### Brand Account
- **Email**: `brand@test.com`
- **Password**: `testpassword123`
- **Role**: BRAND
- **Name**: Test Brand
- **KYC Status**: Approved

### Creator Account  
- **Email**: `creator@test.com`
- **Password**: `testpassword123`
- **Role**: CREATOR
- **Name**: Test Creator
- **KYC Status**: Approved

## Setup Methods

### Method 1: Manual Signup (Recommended for first-time setup)

1. Go to your FlowPay application
2. Sign up with the test account credentials above
3. After signup, use one of the methods below to verify the email addresses

### Method 2: SQL Script (Supabase SQL Editor)

1. Open the Supabase dashboard for your project
2. Go to SQL Editor
3. Copy and paste the contents of `setup_test_accounts.sql`
4. Run the script
5. This will verify existing accounts or provide instructions for creating them

### Method 3: TypeScript Script (With Service Role Key)

1. Obtain your Supabase service role key from the Supabase dashboard
2. Set the environment variable: `export SUPABASE_SERVICE_ROLE_KEY="your_service_key"`
3. Run the setup script:
   ```bash
   npx tsx src/scripts/setupTestAccounts.ts
   ```

## What Gets Created

When the setup is complete, you'll have:

1. **Two verified user accounts** with email confirmation
2. **User profiles** in the public.users table with approved KYC status
3. **A test project** called "Sample Brand Campaign" owned by the brand
4. **A test deal** between the brand and creator worth $5,000
5. **Two milestones**:
   - Content Creation ($3,000) - due in 14 days
   - Performance Report ($2,000) - due in 30 days

## Verification

After running the setup, you should be able to:

1. Log in to both accounts without email verification prompts
2. See the test project in the brand dashboard
3. See the test deal in both brand and creator dashboards
4. Access all protected features without KYC verification issues

## Notes

- The accounts use the same password for simplicity in development
- KYC status is pre-approved to avoid verification flows during testing
- The deal is pre-funded to test milestone and payout workflows
- Both accounts are set to US country for consistent currency/legal handling

## Security Warning

🚨 **These are development-only credentials. Never use these accounts or this setup in production!**
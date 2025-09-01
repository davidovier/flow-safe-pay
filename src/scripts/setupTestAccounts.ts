/**
 * Script to setup test accounts with email verification
 * Run this script to ensure test accounts are properly configured
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vncpvmndkdzcdberruxv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Need service role key for admin operations

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTestAccounts() {
  console.log('Setting up test accounts...');
  
  const testAccounts = [
    {
      email: 'brand@test.com',
      password: 'testpassword123',
      role: 'BRAND',
      first_name: 'Test',
      last_name: 'Brand'
    },
    {
      email: 'creator@test.com', 
      password: 'testpassword123',
      role: 'CREATOR',
      first_name: 'Test',
      last_name: 'Creator'
    }
  ];
  
  for (const account of testAccounts) {
    try {
      // Check if user already exists by listing all users and filtering
      const { data: allUsers } = await supabase.auth.admin.listUsers();
      const existingUser = allUsers?.users?.find((u: any) => u.email === account.email);
      
      if (existingUser) {
        console.log(`User ${account.email} already exists, updating email verification...`);
        
        // Update user to be email verified
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          {
            email_confirm: true,
            user_metadata: {
              first_name: account.first_name,
              last_name: account.last_name,
              role: account.role
            }
          }
        );
        
        if (updateError) {
          console.error(`Error updating user ${account.email}:`, updateError.message);
        } else {
          console.log(`✅ Updated ${account.email} - email verified`);
        }
        
        // Update user profile in public.users table
        const { error: profileError } = await supabase
          .from('users')
          .upsert({
            id: existingUser.id,
            email: account.email,
            role: account.role as 'BRAND' | 'CREATOR',
            first_name: account.first_name,
            last_name: account.last_name,
            country: 'US',
            kyc_status: 'approved'
          });
          
        if (profileError) {
          console.error(`Error updating profile for ${account.email}:`, profileError.message);
        } else {
          console.log(`✅ Updated profile for ${account.email}`);
        }
        
      } else {
        console.log(`Creating new user ${account.email}...`);
        
        // Create new user with email already confirmed
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            first_name: account.first_name,
            last_name: account.last_name,
            role: account.role
          }
        });
        
        if (createError) {
          console.error(`Error creating user ${account.email}:`, createError.message);
        } else if (newUser.user) {
          console.log(`✅ Created ${account.email} - email pre-verified`);
          
          // The trigger should automatically create the profile, but let's ensure it's correct
          const { error: profileError } = await supabase
            .from('users')
            .upsert({
              id: newUser.user.id,
              email: account.email,
              role: account.role as 'BRAND' | 'CREATOR',
              first_name: account.first_name,
              last_name: account.last_name,
              country: 'US',
              kyc_status: 'approved'
            });
            
          if (profileError) {
            console.error(`Error creating profile for ${account.email}:`, profileError.message);
          } else {
            console.log(`✅ Created profile for ${account.email}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing ${account.email}:`, error);
    }
  }
  
  // Verify the setup
  console.log('\nVerifying test accounts...');
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      email,
      role,
      first_name,
      last_name,
      kyc_status
    `)
    .in('email', ['brand@test.com', 'creator@test.com']);
    
  if (error) {
    console.error('Error verifying accounts:', error.message);
  } else {
    console.table(users);
  }
  
  console.log('✅ Test account setup complete!');
}

// Run the setup
setupTestAccounts().catch(console.error);
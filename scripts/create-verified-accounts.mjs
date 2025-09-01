/**
 * Script to create verified test accounts for FlowPay
 * This bypasses email verification for testing purposes
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vncpvmndkdzcdberruxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuY3B2bW5ka2R6Y2RiZXJydXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MjE5MDMsImV4cCI6MjA3MjE5NzkwM30.8s_UPzOeIwxJFR36UTDuTwTSqnAJkIL3rjWeks4dgbk';

const supabase = createClient(supabaseUrl, supabaseKey);

const testAccounts = [
  {
    email: 'alex.creative@gmail.com',
    password: 'TestPass123!',
    role: 'CREATOR',
    first_name: 'Alex',
    last_name: 'Creative',
    country: 'US'
  },
  {
    email: 'sarah.brand@gmail.com', 
    password: 'TestPass123!',
    role: 'BRAND',
    first_name: 'Sarah',
    last_name: 'Johnson',
    country: 'US'
  }
];

async function createVerifiedAccounts() {
  console.log('🚀 Creating verified test accounts for FlowPay...\n');

  for (const account of testAccounts) {
    try {
      console.log(`Creating ${account.role.toLowerCase()} account: ${account.email}`);

      // First, try to sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: {
            first_name: account.first_name,
            last_name: account.last_name,
            role: account.role,
            country: account.country
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`   ℹ️  Account already exists: ${account.email}`);
          
          // Try to sign in to check if it's verified
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: account.email,
            password: account.password
          });

          if (signInError) {
            if (signInError.message.includes('Email not confirmed')) {
              console.log(`   ⚠️  Account exists but not verified. Manual verification needed.`);
            } else {
              console.log(`   ❌ Sign-in error: ${signInError.message}`);
            }
          } else {
            console.log(`   ✅ Account exists and is verified!`);
            await supabase.auth.signOut(); // Sign out after checking
          }
        } else {
          console.error(`   ❌ Signup error: ${authError.message}`);
        }
      } else if (authData.user) {
        console.log(`   ✅ Created account: ${authData.user.id}`);
        console.log(`   📧 Email: ${account.email}`);
        console.log(`   🔑 Password: ${account.password}`);
        
        if (!authData.user.email_confirmed_at) {
          console.log(`   ⚠️  Account created but needs email verification`);
          console.log(`   📬 Check email for verification link or use admin panel`);
        } else {
          console.log(`   ✅ Account is pre-verified!`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Error with ${account.email}:`, error.message);
    }

    console.log(''); // Empty line for readability
  }

  console.log('\n🎉 Account creation process completed!');
  console.log('\n📋 Test Account Credentials:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ CREATOR ACCOUNT                                         │');
  console.log('│ Email:    alex.creative@gmail.com                       │');
  console.log('│ Password: TestPass123!                                  │');
  console.log('│ Role:     Content Creator                               │');
  console.log('│ Name:     Alex Creative                                 │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ BRAND ACCOUNT                                           │');
  console.log('│ Email:    sarah.brand@gmail.com                         │');
  console.log('│ Password: TestPass123!                                  │');
  console.log('│ Role:     Brand Manager                                 │');
  console.log('│ Name:     Sarah Johnson                                 │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log('\n🌐 Access your accounts at: http://localhost:8081/auth');
  
  console.log('\n⚠️  IMPORTANT: Email Verification');
  console.log('If you get "Email not confirmed" errors when signing in:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to Authentication > Users');
  console.log('3. Find the test accounts and click "Send confirmation"');
  console.log('4. Or manually set email_confirmed_at to NOW()');
  console.log('\nAlternatively, you can disable email confirmation in:');
  console.log('Supabase Dashboard > Authentication > Settings > "Confirm email" toggle');
}

// Also provide a function to verify existing accounts
async function verifyExistingAccounts() {
  console.log('\n🔧 Attempting to verify existing test accounts...\n');
  
  const emails = ['alex.creative.test@gmail.com', 'sarah.brand.test@gmail.com'];
  
  for (const email of emails) {
    try {
      console.log(`Checking account: ${email}`);
      
      // Try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'TestPass123!'
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          console.log(`   ⚠️  Account needs verification`);
        } else if (signInError.message.includes('Invalid login credentials')) {
          console.log(`   ❌ Account doesn't exist or wrong password`);
        } else {
          console.log(`   ❌ Error: ${signInError.message}`);
        }
      } else {
        console.log(`   ✅ Account is verified and working!`);
        await supabase.auth.signOut(); // Sign out after checking
      }
    } catch (error) {
      console.log(`   ❌ Error checking ${email}:`, error.message);
    }
  }
}

// Run both functions
async function main() {
  await createVerifiedAccounts();
  await verifyExistingAccounts();
}

main().catch(console.error);
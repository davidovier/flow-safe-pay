/**
 * Script to create test accounts for FlowPay
 * Run with: node scripts/create-test-accounts.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vncpvmndkdzcdberruxv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuY3B2bW5ka2R6Y2RiZXJydXh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MjE5MDMsImV4cCI6MjA3MjE5NzkwM30.8s_UPzOeIwxJFR36UTDuTwTSqnAJkIL3rjWeks4dgbk';

const supabase = createClient(supabaseUrl, supabaseKey);

const testAccounts = [
  {
    email: 'alex.creative.test@gmail.com',
    password: 'TestPass123!',
    role: 'CREATOR',
    first_name: 'Alex',
    last_name: 'Creative',
    country: 'US'
  },
  {
    email: 'sarah.brand.test@gmail.com', 
    password: 'TestPass123!',
    role: 'BRAND',
    first_name: 'Sarah',
    last_name: 'Johnson',
    country: 'US'
  }
];

async function createTestAccounts() {
  console.log('🚀 Creating test accounts for FlowPay...\n');

  for (const account of testAccounts) {
    try {
      console.log(`Creating ${account.role.toLowerCase()} account: ${account.email}`);

      // Sign up the user
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
        } else {
          console.error(`   ❌ Error: ${authError.message}`);
        }
      } else if (authData.user) {
        console.log(`   ✅ Created account: ${authData.user.id}`);
        console.log(`   📧 Email: ${account.email}`);
        console.log(`   🔑 Password: ${account.password}`);
      }

    } catch (error) {
      console.error(`   ❌ Error creating ${account.email}:`, error.message);
    }

    console.log(''); // Empty line for readability
  }

  console.log('\n🎉 Test account creation completed!');
  console.log('\n📋 Test Account Credentials:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ CREATOR ACCOUNT                                         │');
  console.log('│ Email:    alex.creative.test@gmail.com                  │');
  console.log('│ Password: TestPass123!                                  │');
  console.log('│ Role:     Content Creator                               │');
  console.log('│ Name:     Alex Creative                                 │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ BRAND ACCOUNT                                           │');
  console.log('│ Email:    sarah.brand.test@gmail.com                    │');
  console.log('│ Password: TestPass123!                                  │');
  console.log('│ Role:     Brand Manager                                 │');
  console.log('│ Name:     Sarah Johnson                                 │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log('\n🌐 Access your accounts at: http://localhost:8081/auth');
  console.log('\n💡 You may need to verify your email in your email client!');
  console.log('   (Check your email for verification links)');
}

// Run the script
createTestAccounts().catch(console.error);
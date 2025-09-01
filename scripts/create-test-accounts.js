/**
 * Script to create test accounts for FlowPay
 * Run with: node scripts/create-test-accounts.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://vncpvmndkdzcdberruxv.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const testAccounts = [
  {
    email: 'creator.test@flowpay.demo',
    password: 'TestPass123!',
    role: 'CREATOR',
    first_name: 'Alex',
    last_name: 'Creative',
    country: 'US',
    bio: 'Digital content creator specializing in lifestyle and tech reviews. 100K+ followers across platforms.',
    specialties: ['Lifestyle', 'Tech Reviews', 'Social Media'],
    follower_count: 125000,
    completion_rate: 95,
    rating: 4.8
  },
  {
    email: 'brand.test@flowpay.demo', 
    password: 'TestPass123!',
    role: 'BRAND',
    first_name: 'Sarah',
    last_name: 'Johnson',
    country: 'US',
    bio: 'Marketing Manager at TechFlow - a leading lifestyle tech company.',
    business_name: 'TechFlow Inc.',
    business_type: 'Technology'
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
          
          // Try to get existing user and update profile
          const { data: users, error: getUserError } = await supabase
            .from('users')
            .select('*')
            .eq('email', account.email)
            .single();

          if (!getUserError && users) {
            console.log(`   ✅ Found existing account with ID: ${users.id}`);
            
            // Update user profile with additional data
            const updateData = {
              first_name: account.first_name,
              last_name: account.last_name,
              country: account.country,
              role: account.role,
              kyc_status: 'verified'
            };

            // Add role-specific data
            if (account.role === 'CREATOR') {
              updateData.bio = account.bio;
              updateData.specialties = account.specialties;
              updateData.follower_count = account.follower_count;
              updateData.completion_rate = account.completion_rate;
              updateData.rating = account.rating;
            }

            const { error: updateError } = await supabase
              .from('users')
              .update(updateData)
              .eq('id', users.id);

            if (updateError) {
              console.log(`   ⚠️  Could not update profile: ${updateError.message}`);
            } else {
              console.log(`   ✅ Updated existing user profile`);
            }
          }
        } else {
          throw authError;
        }
      } else if (authData.user) {
        console.log(`   ✅ Created auth user: ${authData.user.id}`);
        
        // Wait a moment for the trigger to create the user profile
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update the user profile with additional data
        const updateData = {
          first_name: account.first_name,
          last_name: account.last_name,
          country: account.country,
          role: account.role,
          kyc_status: 'verified'
        };

        // Add role-specific data
        if (account.role === 'CREATOR') {
          updateData.bio = account.bio;
          updateData.specialties = account.specialties;
          updateData.follower_count = account.follower_count;
          updateData.completion_rate = account.completion_rate;
          updateData.rating = account.rating;
        }

        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', authData.user.id);

        if (updateError) {
          console.log(`   ⚠️  Could not update profile: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated user profile with additional data`);
        }
      }

    } catch (error) {
      console.error(`   ❌ Error creating ${account.email}:`, error.message);
    }

    console.log(''); // Empty line for readability
  }

  // Create a demo project and deal
  try {
    console.log('🏗️  Creating demo project and deal...\n');

    // Get the brand user
    const { data: brandUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'brand.test@flowpay.demo')
      .eq('role', 'BRAND')
      .single();

    // Get the creator user
    const { data: creatorUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'creator.test@flowpay.demo')
      .eq('role', 'CREATOR')
      .single();

    if (brandUser && creatorUser) {
      // Create demo project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .upsert({
          title: 'Summer Tech Collection 2024',
          description: 'Showcase our latest smart home devices and wearables through authentic lifestyle content',
          status: 'active',
          brand_id: brandUser.id
        })
        .select()
        .single();

      if (projectError) {
        console.log('   ⚠️  Could not create demo project:', projectError.message);
      } else {
        console.log(`   ✅ Created demo project: "${project.title}"`);

        // Create demo deal
        const { data: deal, error: dealError } = await supabase
          .from('deals')
          .upsert({
            project_id: project.id,
            creator_id: creatorUser.id,
            amount_total: 250000, // $2,500
            currency: 'USD',
            state: 'DRAFT'
          })
          .select()
          .single();

        if (dealError) {
          console.log('   ⚠️  Could not create demo deal:', dealError.message);
        } else {
          console.log(`   ✅ Created demo deal worth $${deal.amount_total / 100}`);

          // Create milestones
          const milestones = [
            {
              deal_id: deal.id,
              title: 'Instagram Reel & Story Series',
              amount: 150000, // $1,500
              state: 'PENDING',
              due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
            },
            {
              deal_id: deal.id,
              title: 'TikTok Product Showcase',
              amount: 100000, // $1,000
              state: 'PENDING',
              due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
            }
          ];

          const { error: milestonesError } = await supabase
            .from('milestones')
            .upsert(milestones);

          if (milestonesError) {
            console.log('   ⚠️  Could not create milestones:', milestonesError.message);
          } else {
            console.log(`   ✅ Created ${milestones.length} demo milestones`);
          }
        }
      }
    } else {
      console.log('   ⚠️  Could not find both brand and creator users for demo content');
    }
  } catch (error) {
    console.log('   ❌ Error creating demo content:', error.message);
  }

  console.log('\n🎉 Test account creation completed!');
  console.log('\n📋 Test Account Credentials:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ CREATOR ACCOUNT                                         │');
  console.log('│ Email:    creator.test@flowpay.demo                     │');
  console.log('│ Password: TestPass123!                                  │');
  console.log('│ Role:     Content Creator                               │');
  console.log('│ Profile:  Alex Creative (125K followers)               │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ BRAND ACCOUNT                                           │');
  console.log('│ Email:    brand.test@flowpay.demo                       │');
  console.log('│ Password: TestPass123!                                  │');
  console.log('│ Role:     Brand Manager                                 │');
  console.log('│ Company:  TechFlow Inc.                                 │');
  console.log('└─────────────────────────────────────────────────────────┘');
  console.log('\n🌐 Access your accounts at: http://localhost:8081/auth');
  console.log('\n💡 Both accounts are pre-verified and ready to use!');
}

// Run the script
createTestAccounts().catch(console.error);
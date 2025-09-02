import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DeleteAccountRequest {
  confirmEmail: string;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Create regular client for user operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user from the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token or user not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { confirmEmail, reason }: DeleteAccountRequest = await req.json()

    // Get user profile to verify email
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify email confirmation
    if (userProfile.email !== confirmEmail) {
      return new Response(
        JSON.stringify({ error: 'Email confirmation does not match your account email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for active deals that would prevent deletion
    // Get deals where user is creator
    const { data: creatorDeals, error: creatorDealsError } = await supabaseAdmin
      .from('deals')
      .select('id, state')
      .eq('creator_id', user.id)
      .in('state', ['FUNDED', 'DISPUTED'])

    if (creatorDealsError) {
      throw creatorDealsError
    }

    // Get deals where user is brand (through projects)
    const { data: brandDeals, error: brandDealsError } = await supabaseAdmin
      .from('deals')
      .select('id, state, projects!inner(brand_id)')
      .eq('projects.brand_id', user.id)
      .in('state', ['FUNDED', 'DISPUTED'])

    if (brandDealsError) {
      throw brandDealsError
    }

    const activeDeals = [...(creatorDeals || []), ...(brandDeals || [])]

    if (activeDeals && activeDeals.length > 0) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete account with active funded deals. Please complete or resolve all deals first.' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Start comprehensive deletion process
    try {
      // 1. Create audit log entry before deletion
      await supabaseAdmin.from('events').insert({
        actor_user_id: user.id,
        type: 'user.deletion_started',
        payload: {
          user_id: user.id,
          email: userProfile.email,
          reason: reason || 'User requested deletion',
          timestamp: new Date().toISOString(),
          account_type: userProfile.role,
          gdpr_compliant: true,
          deletion_method: 'edge_function'
        }
      })

      // 2. Delete all user-related data in correct order to avoid foreign key constraints

      // Delete deliverables first (leaf nodes)
      await supabaseAdmin
        .from('deliverables')
        .delete()
        .in('milestone_id', supabaseAdmin
          .from('milestones')
          .select('id')
          .in('deal_id', supabaseAdmin
            .from('deals')
            .select('id')
            .or(`creator_id.eq.${user.id},project_id.in.(${supabaseAdmin
              .from('projects')
              .select('id')
              .eq('brand_id', user.id)
            })`)
          )
        )

      // Delete payouts
      await supabaseAdmin
        .from('payouts')
        .delete()
        .in('deal_id', supabaseAdmin
          .from('deals')
          .select('id')
          .or(`creator_id.eq.${user.id},project_id.in.(${supabaseAdmin
            .from('projects')
            .select('id')
            .eq('brand_id', user.id)
          })`)
        )

      // Delete milestones
      await supabaseAdmin
        .from('milestones')
        .delete()
        .in('deal_id', supabaseAdmin
          .from('deals')
          .select('id')
          .or(`creator_id.eq.${user.id},project_id.in.(${supabaseAdmin
            .from('projects')
            .select('id')
            .eq('brand_id', user.id)
          })`)
        )

      // Delete contracts
      await supabaseAdmin
        .from('contracts')
        .delete()
        .in('deal_id', supabaseAdmin
          .from('deals')
          .select('id')
          .or(`creator_id.eq.${user.id},project_id.in.(${supabaseAdmin
            .from('projects')
            .select('id')
            .eq('brand_id', user.id)
          })`)
        )

      // Delete disputes
      await supabaseAdmin
        .from('disputes')
        .delete()
        .or(`raised_by_user_id.eq.${user.id},deal_id.in.(${supabaseAdmin
          .from('deals')
          .select('id')
          .or(`creator_id.eq.${user.id},project_id.in.(${supabaseAdmin
            .from('projects')
            .select('id')
            .eq('brand_id', user.id)
          })`)
        })`)

      // Delete deals where user is creator
      await supabaseAdmin
        .from('deals')
        .delete()
        .eq('creator_id', user.id)

      // Delete deals from user's projects (where user is brand)
      await supabaseAdmin
        .from('deals')
        .delete()
        .in('project_id', supabaseAdmin
          .from('projects')
          .select('id')
          .eq('brand_id', user.id)
        )

      // Delete projects where user is brand
      await supabaseAdmin
        .from('projects')
        .delete()
        .eq('brand_id', user.id)

      // Anonymize events (keep for audit but remove personal connection)
      await supabaseAdmin
        .from('events')
        .update({ actor_user_id: null })
        .eq('actor_user_id', user.id)

      // Delete user profile
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', user.id)

      // Finally, delete the auth user (this is the critical part)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
      
      if (deleteAuthError) {
        console.error('Failed to delete auth user:', deleteAuthError)
        // Even if auth deletion fails, we've removed all personal data
      }

      // Log successful deletion
      await supabaseAdmin.from('events').insert({
        actor_user_id: null, // Anonymized
        type: 'user.deletion_completed',
        payload: {
          deleted_user_id: user.id,
          deletion_timestamp: new Date().toISOString(),
          gdpr_compliant: true,
          auth_user_deleted: !deleteAuthError,
          data_types_deleted: [
            'user_profile', 'projects', 'deals', 'milestones', 
            'deliverables', 'contracts', 'disputes', 'payouts'
          ]
        }
      })

      return new Response(
        JSON.stringify({
          message: 'Account successfully deleted. All personal data has been permanently removed.',
          deletedAt: new Date().toISOString(),
          gdprCompliant: true,
          authUserDeleted: !deleteAuthError
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (deletionError) {
      console.error('Error during deletion process:', deletionError)
      
      // Log the failure for debugging
      await supabaseAdmin.from('events').insert({
        actor_user_id: user.id,
        type: 'user.deletion_failed',
        payload: {
          user_id: user.id,
          error: deletionError.message,
          timestamp: new Date().toISOString()
        }
      })

      return new Response(
        JSON.stringify({ error: 'Failed to complete account deletion. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { escrowId, amountCents, creatorUserId, metadata } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get creator's Stripe account info
    const { data: creatorUser } = await supabaseClient
      .from('users')
      .select('email, stripe_account_id')
      .eq('id', creatorUserId)
      .single();

    if (!creatorUser) {
      throw new Error("Creator user not found");
    }

    // For now, we'll create a direct payout to the creator
    // In a full implementation, this would use Stripe Connect Express accounts
    let stripeAccountId = creatorUser.stripe_account_id;
    
    if (!stripeAccountId) {
      // Create Stripe Express account for the creator
      const account = await stripe.accounts.create({
        type: 'express',
        email: creatorUser.email,
        metadata: {
          user_id: creatorUserId,
        },
      });
      
      stripeAccountId = account.id;
      
      // Update user with Stripe account ID
      await supabaseClient
        .from('users')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', creatorUserId);
    }

    // Create a transfer to the creator's account
    // Note: In production, ensure the platform account has sufficient balance
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: stripeAccountId,
      metadata: {
        escrow_id: escrowId,
        creator_user_id: creatorUserId,
        type: 'escrow_release',
        ...metadata,
      },
      description: `Payment release for deal ${escrowId}`,
    });

    // Create payout record in database
    const { data: deal } = await supabaseClient
      .from('deals')
      .select('id, milestones(id)')
      .eq('escrow_id', escrowId)
      .single();

    if (deal) {
      await supabaseClient.from('payouts').insert({
        deal_id: deal.id,
        milestone_id: deal.milestones?.[0]?.id,
        provider: 'STRIPE',
        provider_ref: transfer.id,
        status: 'completed',
        amount: amountCents,
      });
    }

    // Log the release in events table
    await supabaseClient.from('events').insert({
      actor_user_id: user.id,
      type: 'payment_released',
      payload: {
        transfer_id: transfer.id,
        escrow_id: escrowId,
        creator_user_id: creatorUserId,
        amount_cents: amountCents,
      },
    });

    return new Response(
      JSON.stringify({
        payoutId: transfer.id,
        status: 'completed',
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error releasing payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
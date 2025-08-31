import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
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

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      throw new Error("Missing signature or webhook secret");
    }

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Received webhook event:", event.type);

    // Handle different webhook events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, supabaseClient);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent, supabaseClient);
        break;
        
      case 'transfer.created':
        await handleTransferCreated(event.data.object as Stripe.Transfer, supabaseClient);
        break;
        
      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout, supabaseClient);
        break;
        
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account, supabaseClient);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Log webhook event
    await supabaseClient.from('events').insert({
      type: `webhook_${event.type}`,
      payload: {
        stripe_event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      },
    });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, supabaseClient: any) {
  const escrowId = paymentIntent.metadata.escrow_id;
  if (!escrowId) return;

  // Update deal state to FUNDED
  await supabaseClient
    .from('deals')
    .update({ 
      state: 'FUNDED',
      escrow_id: escrowId 
    })
    .eq('escrow_id', escrowId);

  console.log(`Deal ${escrowId} funded successfully`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent, supabaseClient: any) {
  const escrowId = paymentIntent.metadata.escrow_id;
  if (!escrowId) return;

  // Log payment failure
  await supabaseClient.from('events').insert({
    type: 'payment_failed',
    payload: {
      escrow_id: escrowId,
      payment_intent_id: paymentIntent.id,
      failure_reason: paymentIntent.last_payment_error?.message,
    },
  });

  console.log(`Payment failed for deal ${escrowId}`);
}

async function handleTransferCreated(transfer: Stripe.Transfer, supabaseClient: any) {
  const escrowId = transfer.metadata.escrow_id;
  if (!escrowId) return;

  // Update deal state to RELEASED
  await supabaseClient
    .from('deals')
    .update({ state: 'RELEASED' })
    .eq('escrow_id', escrowId);

  console.log(`Payment released for deal ${escrowId}`);
}

async function handlePayoutPaid(payout: Stripe.Payout, supabaseClient: any) {
  // Update payout status in database
  await supabaseClient
    .from('payouts')
    .update({ status: 'paid' })
    .eq('provider_ref', payout.id);

  console.log(`Payout ${payout.id} completed`);
}

async function handleAccountUpdated(account: Stripe.Account, supabaseClient: any) {
  // Update user's KYC status based on account requirements
  const userId = account.metadata?.user_id;
  if (!userId) return;

  const kycStatus = account.requirements?.currently_due?.length === 0 ? 'verified' : 'pending';
  
  await supabaseClient
    .from('users')
    .update({ kyc_status: kycStatus })
    .eq('id', userId);

  console.log(`Account ${account.id} updated, KYC status: ${kycStatus}`);
}
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin"
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

    const { escrowId, amountCents, brandUserId } = await req.json();

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get or create Stripe customer for the brand
    const { data: brandUser } = await supabaseClient
      .from('users')
      .select('email, stripe_account_id')
      .eq('id', brandUserId)
      .single();

    if (!brandUser) {
      throw new Error("Brand user not found");
    }

    let customerId = brandUser.stripe_account_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: brandUser.email,
        metadata: {
          user_id: brandUserId,
          escrow_id: escrowId,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabaseClient
        .from('users')
        .update({ stripe_account_id: customerId })
        .eq('id', brandUserId);
    }

    // Create PaymentIntent for escrow funding
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        escrow_id: escrowId,
        brand_user_id: brandUserId,
        type: 'escrow_funding',
      },
      description: `Escrow funding for deal ${escrowId}`,
    });

    // Log the funding attempt in events table
    await supabaseClient.from('events').insert({
      actor_user_id: user.id,
      type: 'payment_intent_created',
      payload: {
        payment_intent_id: paymentIntent.id,
        escrow_id: escrowId,
        amount_cents: amountCents,
      },
    });

    return new Response(
      JSON.stringify({
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    
    // Security: Don't leak sensitive error details
    const safeError = error instanceof Error && error.message.includes("authenticated") 
      ? "Authentication required" 
      : "Payment processing error";
      
    return new Response(
      JSON.stringify({ error: safeError }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: error instanceof Error && error.message.includes("authenticated") ? 401 : 500,
      }
    );
  }
});
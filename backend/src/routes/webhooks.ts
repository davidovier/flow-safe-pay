import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';

export async function webhookRoutes(fastify: FastifyInstance) {
  
  // Stripe webhook handler
  fastify.post('/stripe', {
    config: {
      // Disable body parsing for raw webhook payload
      rawBody: true,
    },
    schema: {
      description: 'Handle Stripe webhooks',
      tags: ['Webhooks'],
      headers: {
        type: 'object',
        properties: {
          'stripe-signature': { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const sig = request.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        fastify.log.error('STRIPE_WEBHOOK_SECRET not configured');
        return reply.status(500).send('Webhook secret not configured');
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
      });

      let event: Stripe.Event;

      try {
        // Verify webhook signature
        event = stripe.webhooks.constructEvent(
          request.body as string,
          sig,
          webhookSecret
        );
      } catch (err) {
        fastify.log.error('Webhook signature verification failed:', err);
        return reply.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(fastify, event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(fastify, event.data.object as Stripe.PaymentIntent);
          break;

        case 'transfer.created':
          await handleTransferCreated(fastify, event.data.object as Stripe.Transfer);
          break;

        case 'transfer.updated':
          await handleTransferUpdated(fastify, event.data.object as Stripe.Transfer);
          break;

        case 'payout.created':
          await handlePayoutCreated(fastify, event.data.object as Stripe.Payout);
          break;

        case 'payout.updated':
          await handlePayoutUpdated(fastify, event.data.object as Stripe.Payout);
          break;

        case 'account.updated':
          await handleAccountUpdated(fastify, event.data.object as Stripe.Account);
          break;

        default:
          fastify.log.info(`Unhandled event type: ${event.type}`);
      }

      // Log webhook event
      await fastify.prisma.event.create({
        data: {
          type: `webhook.stripe.${event.type}`,
          payload: {
            stripeEventId: event.id,
            eventType: event.type,
            processed: true,
          },
        },
      });

      return reply.send({ received: true });

    } catch (error) {
      fastify.log.error('Webhook processing error:', error);
      
      // Log failed webhook
      await fastify.prisma.event.create({
        data: {
          type: 'webhook.stripe.error',
          payload: {
            error: error.message,
            processed: false,
          },
        },
      });

      return reply.status(500).send('Webhook processing failed');
    }
  });

  // Health check for webhooks
  fastify.get('/stripe/health', async () => {
    return { status: 'healthy', service: 'stripe-webhooks' };
  });
}

// Webhook event handlers
async function handlePaymentIntentSucceeded(
  fastify: FastifyInstance, 
  paymentIntent: Stripe.PaymentIntent
) {
  const escrowId = paymentIntent.id;
  
  // Update deal state when payment succeeds
  if (paymentIntent.metadata?.type === 'escrow') {
    const dealId = paymentIntent.metadata.dealId;
    
    if (dealId) {
      await fastify.prisma.deal.update({
        where: { escrowId },
        data: {
          state: 'FUNDED',
          fundedAt: new Date(),
        },
      });

      fastify.log.info(`Deal ${dealId} successfully funded via payment intent ${escrowId}`);
    }
  }
}

async function handlePaymentIntentFailed(
  fastify: FastifyInstance, 
  paymentIntent: Stripe.PaymentIntent
) {
  const escrowId = paymentIntent.id;
  
  if (paymentIntent.metadata?.type === 'escrow') {
    const dealId = paymentIntent.metadata.dealId;
    
    if (dealId) {
      // Log the failure - don't automatically cancel the deal
      await fastify.prisma.event.create({
        data: {
          type: 'deal.funding_failed',
          payload: {
            dealId,
            escrowId,
            reason: paymentIntent.last_payment_error?.message || 'Payment failed',
          },
        },
      });

      fastify.log.error(`Deal ${dealId} funding failed: ${paymentIntent.last_payment_error?.message}`);
    }
  }
}

async function handleTransferCreated(
  fastify: FastifyInstance, 
  transfer: Stripe.Transfer
) {
  // Update payout status when transfer is created
  const payoutRecord = await fastify.prisma.payout.findFirst({
    where: { providerRef: transfer.id },
  });

  if (payoutRecord) {
    await fastify.prisma.payout.update({
      where: { id: payoutRecord.id },
      data: { 
        status: 'PROCESSING',
        processedAt: new Date(),
      },
    });

    fastify.log.info(`Payout ${payoutRecord.id} transfer created: ${transfer.id}`);
  }
}

async function handleTransferUpdated(
  fastify: FastifyInstance, 
  transfer: Stripe.Transfer
) {
  const payoutRecord = await fastify.prisma.payout.findFirst({
    where: { providerRef: transfer.id },
  });

  if (payoutRecord) {
    let status = payoutRecord.status;
    
    // Map Stripe transfer status to our payout status
    switch (transfer.status) {
      case 'pending':
        status = 'PROCESSING';
        break;
      case 'in_transit':
        status = 'PROCESSING'; 
        break;
      case 'paid':
        status = 'COMPLETED';
        break;
      case 'failed':
        status = 'FAILED';
        break;
      case 'canceled':
        status = 'CANCELED';
        break;
    }

    await fastify.prisma.payout.update({
      where: { id: payoutRecord.id },
      data: { 
        status,
        metadata: transfer,
      },
    });

    fastify.log.info(`Payout ${payoutRecord.id} status updated to ${status}`);
  }
}

async function handlePayoutCreated(
  fastify: FastifyInstance, 
  payout: Stripe.Payout
) {
  fastify.log.info(`Stripe payout created: ${payout.id} for ${payout.amount} ${payout.currency}`);
}

async function handlePayoutUpdated(
  fastify: FastifyInstance, 
  payout: Stripe.Payout
) {
  fastify.log.info(`Stripe payout ${payout.id} updated to status: ${payout.status}`);
}

async function handleAccountUpdated(
  fastify: FastifyInstance, 
  account: Stripe.Account
) {
  // Update user KYC status based on Stripe account status
  const user = await fastify.prisma.user.findFirst({
    where: { stripeAccountId: account.id },
  });

  if (user) {
    let kycStatus = user.kycStatus;

    if (account.details_submitted && account.charges_enabled && account.payouts_enabled) {
      kycStatus = 'APPROVED';
    } else if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
      kycStatus = 'REQUIRED';
    }

    await fastify.prisma.user.update({
      where: { id: user.id },
      data: { kycStatus },
    });

    fastify.log.info(`User ${user.id} KYC status updated to ${kycStatus}`);
  }
}
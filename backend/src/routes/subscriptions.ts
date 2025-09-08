import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../types/auth.js';
import { z } from 'zod';
import Stripe from 'stripe';
import { AgencySubscriptionService, AGENCY_PRICING_TIERS } from '../services/AgencySubscriptionService.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Validation schemas
const upgradeSubscriptionSchema = z.object({
  tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
});

const createCheckoutSessionSchema = z.object({
  tier: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export async function subscriptionRoutes(fastify: FastifyInstance) {
  const subscriptionService = new AgencySubscriptionService(fastify.prisma, stripe);

  // Middleware to require authentication
  const requireAuth = async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Get pricing tiers
  fastify.get('/pricing-tiers', {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      reply.send({
        tiers: Object.values(AGENCY_PRICING_TIERS),
        currency: 'USD',
      });
    },
  });

  // Get agency subscription details
  fastify.get('/agency/:agencyId', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const { agencyId } = request.params as { agencyId: string };
      const { user } = request;

      // Verify user has access to this agency
      const agency = await fastify.prisma.agency.findUnique({
        where: { id: agencyId },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      if (agency.ownerId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const subscriptionDetails = await subscriptionService.getSubscriptionDetails(agencyId);

      if (!subscriptionDetails) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }

      reply.send(subscriptionDetails);
    },
  });

  // Create Stripe checkout session for subscription
  fastify.post('/checkout-session', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const { user } = request;
      const body = createCheckoutSessionSchema.parse(request.body);

      if (user.role !== 'AGENCY') {
        return reply.status(403).send({ error: 'Only agencies can subscribe' });
      }

      // Get user's agency
      const agency = await fastify.prisma.agency.findUnique({
        where: { ownerId: user.id },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      const tierConfig = AGENCY_PRICING_TIERS[body.tier];

      try {
        // Create or retrieve Stripe customer
        let customer;
        const existingCustomers = await stripe.customers.list({
          email: user.email,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await stripe.customers.create({
            email: user.email,
            metadata: {
              userId: user.id,
              agencyId: agency.id,
            },
          });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
          customer: customer.id,
          payment_method_types: ['card'],
          line_items: [
            {
              price: tierConfig.stripePriceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          subscription_data: {
            trial_period_days: 30,
            metadata: {
              agencyId: agency.id,
              tier: body.tier,
            },
          },
          success_url: body.successUrl,
          cancel_url: body.cancelUrl,
        });

        reply.send({
          sessionId: session.id,
          url: session.url,
        });
      } catch (error: any) {
        fastify.log.error('Stripe checkout session error:', error);
        return reply.status(500).send({
          error: 'Failed to create checkout session',
          message: error.message,
        });
      }
    },
  });

  // Upgrade subscription
  fastify.post('/agency/:agencyId/upgrade', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const { agencyId } = request.params as { agencyId: string };
      const { user } = request;
      const body = upgradeSubscriptionSchema.parse(request.body);

      // Verify user has access to this agency
      const agency = await fastify.prisma.agency.findUnique({
        where: { id: agencyId },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      if (agency.ownerId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Access denied' });
      }

      try {
        await subscriptionService.upgradeSubscription(agencyId, body.tier);
        reply.send({ message: 'Subscription upgraded successfully' });
      } catch (error: any) {
        fastify.log.error('Subscription upgrade error:', error);
        return reply.status(500).send({
          error: 'Failed to upgrade subscription',
          message: error.message,
        });
      }
    },
  });

  // Cancel subscription
  fastify.post('/agency/:agencyId/cancel', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const { agencyId } = request.params as { agencyId: string };
      const { user } = request;
      const { immediate } = request.body as { immediate?: boolean };

      // Verify user has access to this agency
      const agency = await fastify.prisma.agency.findUnique({
        where: { id: agencyId },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      if (agency.ownerId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Access denied' });
      }

      try {
        await subscriptionService.cancelSubscription(agencyId, immediate);
        reply.send({
          message: immediate
            ? 'Subscription canceled immediately'
            : 'Subscription will be canceled at the end of current period',
        });
      } catch (error: any) {
        fastify.log.error('Subscription cancellation error:', error);
        return reply.status(500).send({
          error: 'Failed to cancel subscription',
          message: error.message,
        });
      }
    },
  });

  // Get usage and billing information
  fastify.get('/agency/:agencyId/usage', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const { agencyId } = request.params as { agencyId: string };
      const { user } = request;

      // Verify user has access to this agency
      const agency = await fastify.prisma.agency.findUnique({
        where: { id: agencyId },
        include: {
          subscription: true,
          _count: {
            select: {
              managedCreators: true,
            },
          },
        },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      if (agency.ownerId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const creatorCount = agency._count.managedCreators;
      const subscription = agency.subscription;

      if (!subscription) {
        return reply.status(404).send({ error: 'Subscription not found' });
      }

      const monthlyCost = subscriptionService.calculateMonthlyCost(
        subscription.tier,
        creatorCount
      );

      const usage = {
        currentTier: subscription.tier,
        creatorCount,
        creatorLimit: agency.maxCreators,
        utilizationPercentage: (creatorCount / agency.maxCreators) * 100,
        monthlyCost,
        platformFeeRate: agency.platformFeeRate,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        trialEndsAt: subscription.trialEndsAt,
        isTrialing: subscription.status === 'TRIALING',
        recommendedTier: subscriptionService.getRecommendedTier(creatorCount),
      };

      reply.send(usage);
    },
  });

  // Webhook endpoint for Stripe events
  fastify.post('/webhooks/stripe', {
    config: {
      rawBody: true,
    },
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      const sig = request.headers['stripe-signature'] as string;
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!endpointSecret) {
        return reply.status(500).send({ error: 'Webhook secret not configured' });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret);
      } catch (err: any) {
        fastify.log.error('Webhook signature verification failed:', err.message);
        return reply.status(400).send({ error: 'Invalid signature' });
      }

      try {
        await subscriptionService.handleStripeWebhook(event);
        reply.send({ received: true });
      } catch (error: any) {
        fastify.log.error('Webhook processing error:', error);
        return reply.status(500).send({ error: 'Webhook processing failed' });
      }
    },
  });

  // Get billing history
  fastify.get('/agency/:agencyId/billing-history', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply: FastifyReply) => {
      const { agencyId } = request.params as { agencyId: string };
      const { user } = request;

      // Verify user has access to this agency
      const agency = await fastify.prisma.agency.findUnique({
        where: { id: agencyId },
        include: {
          subscription: true,
        },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      if (agency.ownerId !== user.id && user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Access denied' });
      }

      if (!agency.subscription?.stripeSubscriptionId) {
        return reply.send({ invoices: [] });
      }

      try {
        // Get Stripe customer from subscription
        const stripeSubscription = await stripe.subscriptions.retrieve(
          agency.subscription.stripeSubscriptionId
        );

        const invoices = await stripe.invoices.list({
          customer: stripeSubscription.customer as string,
          limit: 12, // Last 12 invoices
        });

        const formattedInvoices = invoices.data.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          paidAt: invoice.status_transitions.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : null,
          invoiceUrl: invoice.invoice_pdf,
          periodStart: new Date(invoice.period_start * 1000),
          periodEnd: new Date(invoice.period_end * 1000),
        }));

        reply.send({ invoices: formattedInvoices });
      } catch (error: any) {
        fastify.log.error('Error fetching billing history:', error);
        return reply.status(500).send({
          error: 'Failed to fetch billing history',
          message: error.message,
        });
      }
    },
  });
}
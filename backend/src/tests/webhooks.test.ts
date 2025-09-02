import { describe, it, expect, beforeEach, vi } from 'vitest';
import { webhookRoutes } from '../routes/webhooks.js';
import { createTestFastifyInstance, createTestUser, createTestProject, createTestDeal } from './setup.js';
import Stripe from 'stripe';

// Mock Stripe
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      webhooks: {
        constructEvent: vi.fn(),
      },
    })),
  };
});

describe('Webhook Routes', () => {
  let fastify: any;
  let mockStripe: any;
  let brandUser: any;
  let creatorUser: any;
  let project: any;
  let deal: any;

  beforeEach(async () => {
    fastify = await createTestFastifyInstance();
    await fastify.register(webhookRoutes, { prefix: '/webhooks' });
    await fastify.ready();

    // Set up test data
    brandUser = await createTestUser({
      email: 'brand@example.com',
      role: 'BRAND',
    });

    creatorUser = await createTestUser({
      email: 'creator@example.com',
      role: 'CREATOR',
    });

    project = await createTestProject(brandUser.id);
    deal = await createTestDeal(project.id, creatorUser.id, {
      state: 'DRAFT',
      escrowId: 'pi_test_payment_intent',
    });

    // Mock Stripe webhook verification
    mockStripe = {
      webhooks: {
        constructEvent: vi.fn(),
      },
    };

    vi.mocked(Stripe).mockReturnValue(mockStripe as any);
  });

  describe('POST /webhooks/stripe', () => {
    it('should handle payment_intent.succeeded event', async () => {
      const webhookEvent = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_payment_intent',
            metadata: {
              type: 'escrow',
              dealId: deal.id,
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        headers: {
          'stripe-signature': 'test-signature',
        },
        payload: 'raw-webhook-body',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.received).toBe(true);

      // Verify deal was updated to FUNDED
      const updatedDeal = await global.testPrisma.deal.findUnique({
        where: { id: deal.id },
      });
      expect(updatedDeal?.state).toBe('FUNDED');
      expect(updatedDeal?.fundedAt).toBeTruthy();
    });

    it('should handle payment_intent.payment_failed event', async () => {
      const webhookEvent = {
        id: 'evt_test_webhook',
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test_payment_intent',
            metadata: {
              type: 'escrow',
              dealId: deal.id,
            },
            last_payment_error: {
              message: 'Card declined',
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        headers: {
          'stripe-signature': 'test-signature',
        },
        payload: 'raw-webhook-body',
      });

      expect(response.statusCode).toBe(200);

      // Verify failure event was logged
      const events = await global.testPrisma.event.findMany({
        where: {
          type: 'deal.funding_failed',
        },
      });
      expect(events).toHaveLength(1);
    });

    it('should handle transfer.created event', async () => {
      // Create a payout record first
      const payout = await global.testPrisma.payout.create({
        data: {
          dealId: deal.id,
          provider: 'STRIPE',
          providerRef: 'tr_test_transfer',
          amount: 5000,
          currency: 'usd',
          status: 'PENDING',
        },
      });

      const webhookEvent = {
        id: 'evt_test_webhook',
        type: 'transfer.created',
        data: {
          object: {
            id: 'tr_test_transfer',
            amount: 5000,
            currency: 'usd',
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        headers: {
          'stripe-signature': 'test-signature',
        },
        payload: 'raw-webhook-body',
      });

      expect(response.statusCode).toBe(200);

      // Verify payout status was updated
      const updatedPayout = await global.testPrisma.payout.findUnique({
        where: { id: payout.id },
      });
      expect(updatedPayout?.status).toBe('PROCESSING');
      expect(updatedPayout?.processedAt).toBeTruthy();
    });

    it('should handle account.updated event', async () => {
      // Update user with Stripe account ID
      await global.testPrisma.user.update({
        where: { id: creatorUser.id },
        data: { stripeAccountId: 'acct_test_account' },
      });

      const webhookEvent = {
        id: 'evt_test_webhook',
        type: 'account.updated',
        data: {
          object: {
            id: 'acct_test_account',
            details_submitted: true,
            charges_enabled: true,
            payouts_enabled: true,
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        headers: {
          'stripe-signature': 'test-signature',
        },
        payload: 'raw-webhook-body',
      });

      expect(response.statusCode).toBe(200);

      // Verify KYC status was updated
      const updatedUser = await global.testPrisma.user.findUnique({
        where: { id: creatorUser.id },
      });
      expect(updatedUser?.kycStatus).toBe('APPROVED');
    });

    it('should handle unhandled event types gracefully', async () => {
      const webhookEvent = {
        id: 'evt_test_webhook',
        type: 'unknown.event.type',
        data: {
          object: {},
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        headers: {
          'stripe-signature': 'test-signature',
        },
        payload: 'raw-webhook-body',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.received).toBe(true);
    });

    it('should reject webhooks with invalid signatures', async () => {
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        headers: {
          'stripe-signature': 'invalid-signature',
        },
        payload: 'raw-webhook-body',
      });

      expect(response.statusCode).toBe(400);

      const body = response.body;
      expect(body).toContain('Webhook Error');
    });

    it('should handle missing webhook secret', async () => {
      // Temporarily remove webhook secret
      const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_WEBHOOK_SECRET;

      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        headers: {
          'stripe-signature': 'test-signature',
        },
        payload: 'raw-webhook-body',
      });

      expect(response.statusCode).toBe(500);
      expect(response.body).toContain('Webhook secret not configured');

      // Restore webhook secret
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    });

    it('should log all webhook events', async () => {
      const webhookEvent = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_payment_intent',
            metadata: {
              type: 'escrow',
              dealId: deal.id,
            },
          },
        },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

      const response = await fastify.inject({
        method: 'POST',
        url: '/webhooks/stripe',
        headers: {
          'stripe-signature': 'test-signature',
        },
        payload: 'raw-webhook-body',
      });

      expect(response.statusCode).toBe(200);

      // Verify webhook event was logged
      const events = await global.testPrisma.event.findMany({
        where: {
          type: 'webhook.stripe.payment_intent.succeeded',
        },
      });
      expect(events).toHaveLength(1);
      expect(events[0].payload).toMatchObject({
        stripeEventId: 'evt_test_webhook',
        processed: true,
      });
    });
  });

  describe('GET /webhooks/stripe/health', () => {
    it('should return healthy status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/webhooks/stripe/health',
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.status).toBe('healthy');
      expect(body.service).toBe('stripe-webhooks');
    });
  });
});
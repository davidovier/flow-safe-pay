import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dealRoutes } from '../routes/deals.js';
import { createTestFastifyInstance, createTestUser, createTestProject, createTestDeal, createAuthHeaders } from './setup.js';

// Mock payment provider
vi.mock('../payments/index.js', () => ({
  getDefaultPaymentProvider: vi.fn().mockReturnValue({
    createEscrow: vi.fn().mockResolvedValue({
      escrowId: 'pi_mock_payment_intent',
      clientSecret: 'pi_mock_secret',
    }),
    fundEscrow: vi.fn().mockResolvedValue({
      success: true,
      transactionId: 'ch_mock_charge',
    }),
    releaseEscrow: vi.fn().mockResolvedValue({
      success: true,
      payoutId: 'po_mock_payout',
    }),
  }),
}));

describe('Deal Routes', () => {
  let fastify: any;
  let brandUser: any;
  let creatorUser: any;
  let project: any;

  beforeEach(async () => {
    fastify = await createTestFastifyInstance();
    await fastify.register(dealRoutes, { prefix: '/deals' });
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
  });

  describe('POST /deals', () => {
    it('should create new deal with milestones successfully', async () => {
      const dealData = {
        projectId: project.id,
        creatorId: creatorUser.id,
        currency: 'usd',
        milestones: [
          {
            title: 'First Milestone',
            description: 'Complete initial work',
            amount: 5000, // $50.00
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
          },
          {
            title: 'Second Milestone',
            description: 'Final deliverable',
            amount: 5000, // $50.00
          },
        ],
      };

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: '/deals',
        headers,
        payload: dealData,
      });

      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('deal');
      expect(body).toHaveProperty('escrow');
      expect(body.deal.projectId).toBe(project.id);
      expect(body.deal.creatorId).toBe(creatorUser.id);
      expect(body.deal.amountTotal).toBe(10000); // Sum of milestones
      expect(body.deal.state).toBe('DRAFT');
      expect(body.escrow).toHaveProperty('escrowId');
      expect(body.escrow).toHaveProperty('clientSecret');

      // Verify milestones were created
      const milestones = await global.testPrisma.milestone.findMany({
        where: { dealId: body.deal.id },
      });
      expect(milestones).toHaveLength(2);
      expect(milestones[0].title).toBe('First Milestone');
      expect(milestones[0].amount).toBe(5000);
    });

    it('should reject deal creation with invalid project', async () => {
      const dealData = {
        projectId: 'non-existent-project',
        creatorId: creatorUser.id,
        milestones: [
          {
            title: 'Test Milestone',
            amount: 5000,
          },
        ],
      };

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: '/deals',
        headers,
        payload: dealData,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject deal creation with invalid creator', async () => {
      const dealData = {
        projectId: project.id,
        creatorId: 'non-existent-creator',
        milestones: [
          {
            title: 'Test Milestone',
            amount: 5000,
          },
        ],
      };

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: '/deals',
        headers,
        payload: dealData,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject deal creation without milestones', async () => {
      const dealData = {
        projectId: project.id,
        creatorId: creatorUser.id,
        milestones: [],
      };

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: '/deals',
        headers,
        payload: dealData,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should reject unauthorized users', async () => {
      const dealData = {
        projectId: project.id,
        creatorId: creatorUser.id,
        milestones: [
          {
            title: 'Test Milestone',
            amount: 5000,
          },
        ],
      };

      // Try as creator (only brands can create deals)
      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/deals',
        headers,
        payload: dealData,
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('GET /deals', () => {
    it('should return deals for authenticated user', async () => {
      // Create deals for different scenarios
      const deal1 = await createTestDeal(project.id, creatorUser.id, {
        state: 'DRAFT',
      });

      const deal2 = await createTestDeal(project.id, creatorUser.id, {
        state: 'FUNDED',
      });

      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'GET',
        url: '/deals',
        headers,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveLength(2);
      expect(body.some((deal: any) => deal.id === deal1.id)).toBe(true);
      expect(body.some((deal: any) => deal.id === deal2.id)).toBe(true);
    });

    it('should return empty array when no deals exist', async () => {
      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'GET',
        url: '/deals',
        headers,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toHaveLength(0);
    });

    it('should filter deals by status', async () => {
      await createTestDeal(project.id, creatorUser.id, { state: 'DRAFT' });
      await createTestDeal(project.id, creatorUser.id, { state: 'FUNDED' });
      await createTestDeal(project.id, creatorUser.id, { state: 'RELEASED' });

      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'GET',
        url: '/deals?status=FUNDED',
        headers,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].state).toBe('FUNDED');
    });
  });

  describe('GET /deals/:id', () => {
    it('should return deal details for authorized user', async () => {
      const deal = await createTestDeal(project.id, creatorUser.id);

      // Create milestone for the deal
      await global.testPrisma.milestone.create({
        data: {
          dealId: deal.id,
          title: 'Test Milestone',
          amount: 5000,
        },
      });

      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'GET',
        url: `/deals/${deal.id}`,
        headers,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.id).toBe(deal.id);
      expect(body).toHaveProperty('project');
      expect(body).toHaveProperty('creator');
      expect(body).toHaveProperty('milestones');
      expect(body.milestones).toHaveLength(1);
    });

    it('should return 404 for non-existent deal', async () => {
      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'GET',
        url: '/deals/non-existent-id',
        headers,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject unauthorized access', async () => {
      const otherUser = await createTestUser({
        email: 'other@example.com',
        role: 'CREATOR',
      });

      const deal = await createTestDeal(project.id, creatorUser.id);
      const headers = await createAuthHeaders(otherUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'GET',
        url: `/deals/${deal.id}`,
        headers,
      });

      expect(response.statusCode).toBe(403);
    });
  });

  describe('POST /deals/:id/accept', () => {
    it('should allow creator to accept deal', async () => {
      const deal = await createTestDeal(project.id, creatorUser.id, {
        state: 'DRAFT',
      });

      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: `/deals/${deal.id}/accept`,
        headers,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toContain('accepted');

      // Verify deal state was updated
      const updatedDeal = await global.testPrisma.deal.findUnique({
        where: { id: deal.id },
      });
      expect(updatedDeal?.acceptedAt).toBeTruthy();
    });

    it('should reject non-creator users', async () => {
      const deal = await createTestDeal(project.id, creatorUser.id, {
        state: 'DRAFT',
      });

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: `/deals/${deal.id}/accept`,
        headers,
      });

      expect(response.statusCode).toBe(403);
    });

    it('should reject already accepted deals', async () => {
      const deal = await createTestDeal(project.id, creatorUser.id, {
        state: 'FUNDED',
        acceptedAt: new Date(),
      });

      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: `/deals/${deal.id}/accept`,
        headers,
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.message).toContain('already accepted');
    });
  });

  describe('POST /deals/:id/fund', () => {
    it('should allow brand to fund accepted deal', async () => {
      const deal = await createTestDeal(project.id, creatorUser.id, {
        state: 'DRAFT',
        acceptedAt: new Date(),
        escrowId: 'pi_test_payment_intent',
      });

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: `/deals/${deal.id}/fund`,
        headers,
        payload: {
          paymentMethodId: 'pm_test_card',
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success');
      expect(body).toHaveProperty('transactionId');
    });

    it('should reject unaccepted deals', async () => {
      const deal = await createTestDeal(project.id, creatorUser.id, {
        state: 'DRAFT',
        escrowId: 'pi_test_payment_intent',
      });

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: `/deals/${deal.id}/fund`,
        headers,
        payload: {},
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.message).toContain('accepted');
    });

    it('should reject non-brand users', async () => {
      const deal = await createTestDeal(project.id, creatorUser.id, {
        state: 'DRAFT',
        acceptedAt: new Date(),
        escrowId: 'pi_test_payment_intent',
      });

      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: `/deals/${deal.id}/fund`,
        headers,
        payload: {},
      });

      expect(response.statusCode).toBe(403);
    });
  });
});
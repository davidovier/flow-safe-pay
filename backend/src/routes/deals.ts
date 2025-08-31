import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { DealState, MilestoneState } from '@prisma/client';
import { getDefaultPaymentProvider } from '../payments/index.js';

const createDealSchema = z.object({
  projectId: z.string(),
  creatorId: z.string(),
  currency: z.string().default('usd'),
  milestones: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
    amount: z.number().int().positive(),
    dueAt: z.string().transform(str => new Date(str)).optional(),
  })),
});

const fundDealSchema = z.object({
  paymentMethodId: z.string().optional(),
});

export async function dealRoutes(fastify: FastifyInstance) {
  
  // Middleware to require authentication
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Create new deal
  fastify.post('/', {
    preHandler: requireAuth,
    schema: {
      description: 'Create a new deal with milestones',
      tags: ['Deals'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['projectId', 'creatorId', 'milestones'],
        properties: {
          projectId: { type: 'string' },
          creatorId: { type: 'string' },
          currency: { type: 'string', default: 'usd' },
          milestones: {
            type: 'array',
            items: {
              type: 'object',
              required: ['title', 'amount'],
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                amount: { type: 'number' },
                dueAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { projectId, creatorId, currency, milestones } = createDealSchema.parse(request.body);

      // Verify user can create deal (must be brand and own the project)
      if (role !== 'BRAND') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only brands can create deals',
        });
      }

      const project = await fastify.prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.brandId !== userId) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found or access denied',
        });
      }

      // Calculate total amount
      const totalAmount = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);

      // Create escrow with payment provider
      const paymentProvider = getDefaultPaymentProvider();
      const { escrowId } = await paymentProvider.createEscrow(
        `deal_${Date.now()}`, // Temporary ID, will update with actual deal ID
        currency
      );

      // Create deal with milestones in a transaction
      const deal = await fastify.prisma.$transaction(async (prisma) => {
        const newDeal = await prisma.deal.create({
          data: {
            projectId,
            creatorId,
            currency,
            amountTotal: totalAmount,
            escrowId,
            state: DealState.DRAFT,
          },
        });

        // Create milestones
        await prisma.milestone.createMany({
          data: milestones.map(milestone => ({
            dealId: newDeal.id,
            title: milestone.title,
            description: milestone.description,
            amount: milestone.amount,
            dueAt: milestone.dueAt,
            state: MilestoneState.PENDING,
          })),
        });

        // Log event
        await prisma.event.create({
          data: {
            actorUserId: userId,
            type: 'deal.created',
            payload: {
              dealId: newDeal.id,
              projectId,
              creatorId,
              totalAmount,
              milestonesCount: milestones.length,
            },
          },
        });

        return newDeal;
      });

      // Return created deal with milestones
      const dealWithMilestones = await fastify.prisma.deal.findUnique({
        where: { id: deal.id },
        include: {
          project: true,
          creator: {
            select: { id: true, email: true, role: true },
          },
          milestones: true,
        },
      });

      return reply.status(201).send(dealWithMilestones);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      fastify.log.error('Create deal error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create deal',
      });
    }
  });

  // Accept deal (creator)
  fastify.post('/:dealId/accept', {
    preHandler: requireAuth,
    schema: {
      description: 'Creator accepts deal terms',
      tags: ['Deals'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dealId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { dealId } = request.params as any;

      if (role !== 'CREATOR') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only creators can accept deals',
        });
      }

      const deal = await fastify.prisma.deal.findUnique({
        where: { id: dealId },
        include: { creator: true },
      });

      if (!deal) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Deal not found',
        });
      }

      if (deal.creatorId !== userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You can only accept your own deals',
        });
      }

      if (deal.state !== DealState.DRAFT) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Deal can only be accepted in DRAFT state',
        });
      }

      // Update deal to accepted state
      const updatedDeal = await fastify.prisma.deal.update({
        where: { id: dealId },
        data: {
          acceptedAt: new Date(),
          // Deal stays in DRAFT until funded
        },
        include: {
          project: true,
          creator: {
            select: { id: true, email: true, role: true },
          },
          milestones: true,
        },
      });

      // Log event
      await fastify.prisma.event.create({
        data: {
          actorUserId: userId,
          type: 'deal.accepted',
          payload: {
            dealId,
            creatorId: userId,
          },
        },
      });

      return reply.send(updatedDeal);

    } catch (error) {
      fastify.log.error('Accept deal error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to accept deal',
      });
    }
  });

  // Fund deal (brand)
  fastify.post('/:dealId/fund', {
    preHandler: requireAuth,
    schema: {
      description: 'Brand funds the deal escrow',
      tags: ['Deals'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dealId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          paymentMethodId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { dealId } = request.params as any;
      const { paymentMethodId } = fundDealSchema.parse(request.body || {});

      if (role !== 'BRAND') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only brands can fund deals',
        });
      }

      const deal = await fastify.prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          project: true,
          creator: true,
        },
      });

      if (!deal) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Deal not found',
        });
      }

      if (deal.project.brandId !== userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You can only fund your own deals',
        });
      }

      if (deal.state !== DealState.DRAFT || !deal.acceptedAt) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Deal must be accepted before funding',
        });
      }

      // Fund the escrow
      const paymentProvider = getDefaultPaymentProvider();
      const { paymentRef } = await paymentProvider.fundEscrow(
        deal.escrowId!,
        deal.amountTotal,
        userId
      );

      // Update deal state
      const updatedDeal = await fastify.prisma.deal.update({
        where: { id: dealId },
        data: {
          state: DealState.FUNDED,
          fundedAt: new Date(),
        },
        include: {
          project: true,
          creator: {
            select: { id: true, email: true, role: true },
          },
          milestones: true,
        },
      });

      // Log event
      await fastify.prisma.event.create({
        data: {
          actorUserId: userId,
          type: 'deal.funded',
          payload: {
            dealId,
            amount: deal.amountTotal,
            paymentRef,
          },
        },
      });

      return reply.send({
        deal: updatedDeal,
        paymentRef,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      fastify.log.error('Fund deal error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fund deal',
      });
    }
  });

  // Get deals (filtered by user role)
  fastify.get('/', {
    preHandler: requireAuth,
    schema: {
      description: 'Get deals for current user',
      tags: ['Deals'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          state: { type: 'string' },
          limit: { type: 'number', default: 20 },
          offset: { type: 'number', default: 0 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { state, limit = 20, offset = 0 } = request.query as any;

      const where: any = {};
      
      if (role === 'CREATOR') {
        where.creatorId = userId;
      } else if (role === 'BRAND') {
        where.project = { brandId: userId };
      }

      if (state) {
        where.state = state;
      }

      const deals = await fastify.prisma.deal.findMany({
        where,
        include: {
          project: true,
          creator: {
            select: { id: true, email: true, role: true },
          },
          milestones: true,
          _count: {
            select: { milestones: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await fastify.prisma.deal.count({ where });

      return reply.send({
        deals,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });

    } catch (error) {
      fastify.log.error('Get deals error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get deals',
      });
    }
  });

  // Get single deal
  fastify.get('/:dealId', {
    preHandler: requireAuth,
    schema: {
      description: 'Get deal by ID',
      tags: ['Deals'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dealId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { dealId } = request.params as any;

      const deal = await fastify.prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          project: {
            include: {
              brand: {
                select: { id: true, email: true, role: true },
              },
            },
          },
          creator: {
            select: { id: true, email: true, role: true },
          },
          milestones: {
            include: {
              deliverables: true,
            },
            orderBy: { createdAt: 'asc' },
          },
          disputes: {
            include: {
              raisedBy: {
                select: { id: true, email: true, role: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!deal) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Deal not found',
        });
      }

      // Check access permissions
      const hasAccess = deal.creatorId === userId || 
                       deal.project.brandId === userId ||
                       role === 'ADMIN';

      if (!hasAccess) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      return reply.send(deal);

    } catch (error) {
      fastify.log.error('Get deal error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get deal',
      });
    }
  });
}
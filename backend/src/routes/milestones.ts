import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { MilestoneState, DealState } from '@prisma/client';
import { getDefaultPaymentProvider } from '../payments/index.js';

const submitDeliverableSchema = z.object({
  url: z.string().url().optional(),
  fileUrl: z.string().optional(),
  fileHash: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
});

export async function milestoneRoutes(fastify: FastifyInstance) {
  
  // Middleware to require authentication
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Submit deliverable for milestone
  fastify.post('/:milestoneId/deliver', {
    preHandler: requireAuth,
    schema: {
      description: 'Submit deliverable for milestone approval',
      tags: ['Milestones'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          milestoneId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          url: { type: 'string', format: 'url' },
          fileUrl: { type: 'string' },
          fileHash: { type: 'string' },
          fileName: { type: 'string' },
          fileSize: { type: 'number' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { milestoneId } = request.params as any;
      const deliverableData = submitDeliverableSchema.parse(request.body);

      if (role !== 'CREATOR') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only creators can submit deliverables',
        });
      }

      const milestone = await fastify.prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          deal: {
            include: {
              creator: true,
              project: true,
            },
          },
        },
      });

      if (!milestone) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Milestone not found',
        });
      }

      if (milestone.deal.creatorId !== userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You can only submit deliverables for your own milestones',
        });
      }

      if (milestone.state !== MilestoneState.PENDING) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Milestone must be in PENDING state to submit deliverable',
        });
      }

      if (milestone.deal.state !== DealState.FUNDED) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Deal must be funded before submitting deliverables',
        });
      }

      // Validate deliverable content
      if (!deliverableData.url && !deliverableData.fileUrl) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Either URL or file must be provided',
        });
      }

      // TODO: Implement deliverable validation checks
      const checks = await validateDeliverable(deliverableData);

      // Create deliverable and update milestone
      const result = await fastify.prisma.$transaction(async (prisma) => {
        // Create deliverable record
        const deliverable = await prisma.deliverable.create({
          data: {
            milestoneId,
            url: deliverableData.url,
            fileUrl: deliverableData.fileUrl,
            fileHash: deliverableData.fileHash,
            fileName: deliverableData.fileName,
            fileSize: deliverableData.fileSize,
            checks,
          },
        });

        // Update milestone state
        const updatedMilestone = await prisma.milestone.update({
          where: { id: milestoneId },
          data: {
            state: MilestoneState.SUBMITTED,
            submittedAt: new Date(),
          },
          include: {
            deliverables: true,
            deal: {
              include: {
                project: true,
                creator: {
                  select: { id: true, email: true, role: true },
                },
              },
            },
          },
        });

        // Log event
        await prisma.event.create({
          data: {
            actorUserId: userId,
            type: 'milestone.submitted',
            payload: {
              milestoneId,
              dealId: milestone.deal.id,
              deliverableId: deliverable.id,
              checks,
            },
          },
        });

        return { milestone: updatedMilestone, deliverable };
      });

      // TODO: Schedule auto-approval timer (BullMQ job)
      
      return reply.send(result);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      fastify.log.error('Submit deliverable error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to submit deliverable',
      });
    }
  });

  // Approve milestone (brand)
  fastify.post('/:milestoneId/approve', {
    preHandler: requireAuth,
    schema: {
      description: 'Brand approves milestone and triggers payout',
      tags: ['Milestones'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          milestoneId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { milestoneId } = request.params as any;

      if (role !== 'BRAND') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only brands can approve milestones',
        });
      }

      const milestone = await fastify.prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          deal: {
            include: {
              project: true,
              creator: true,
            },
          },
          deliverables: true,
        },
      });

      if (!milestone) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Milestone not found',
        });
      }

      if (milestone.deal.project.brandId !== userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'You can only approve milestones for your own deals',
        });
      }

      if (milestone.state !== MilestoneState.SUBMITTED) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Milestone must be submitted before approval',
        });
      }

      // Process the approval and payout
      const paymentProvider = getDefaultPaymentProvider();
      
      const result = await fastify.prisma.$transaction(async (prisma) => {
        // Update milestone state
        const updatedMilestone = await prisma.milestone.update({
          where: { id: milestoneId },
          data: {
            state: MilestoneState.APPROVED,
            approvedAt: new Date(),
          },
        });

        // Release payment to creator
        const { payoutRef } = await paymentProvider.releaseToCreator(
          milestone.deal.escrowId!,
          milestone.amount,
          milestone.deal.creatorId,
          {
            milestoneId,
            dealId: milestone.deal.id,
          }
        );

        // Create payout record
        const payout = await prisma.payout.create({
          data: {
            dealId: milestone.deal.id,
            milestoneId,
            provider: 'STRIPE', // Should be dynamic based on payment provider
            providerRef: payoutRef,
            amount: milestone.amount,
            currency: milestone.deal.currency,
            status: 'PROCESSING',
          },
        });

        // Update milestone to released
        await prisma.milestone.update({
          where: { id: milestoneId },
          data: {
            state: MilestoneState.RELEASED,
            releasedAt: new Date(),
          },
        });

        // Log events
        await prisma.event.create({
          data: {
            actorUserId: userId,
            type: 'milestone.approved',
            payload: {
              milestoneId,
              dealId: milestone.deal.id,
              payoutId: payout.id,
              amount: milestone.amount,
            },
          },
        });

        await prisma.event.create({
          data: {
            actorUserId: milestone.deal.creatorId,
            type: 'payout.initiated',
            payload: {
              payoutId: payout.id,
              milestoneId,
              amount: milestone.amount,
              providerRef: payoutRef,
            },
          },
        });

        return { milestone: updatedMilestone, payout };
      });

      // TODO: Generate and store invoice
      
      return reply.send(result);

    } catch (error) {
      fastify.log.error('Approve milestone error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to approve milestone',
      });
    }
  });

  // Get milestone details
  fastify.get('/:milestoneId', {
    preHandler: requireAuth,
    schema: {
      description: 'Get milestone details',
      tags: ['Milestones'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          milestoneId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { milestoneId } = request.params as any;

      const milestone = await fastify.prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          deal: {
            include: {
              project: true,
              creator: {
                select: { id: true, email: true, role: true },
              },
            },
          },
          deliverables: true,
          payouts: true,
        },
      });

      if (!milestone) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Milestone not found',
        });
      }

      // Check access permissions
      const hasAccess = milestone.deal.creatorId === userId || 
                       milestone.deal.project.brandId === userId ||
                       role === 'ADMIN';

      if (!hasAccess) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      return reply.send(milestone);

    } catch (error) {
      fastify.log.error('Get milestone error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get milestone',
      });
    }
  });
}

// Deliverable validation function (placeholder)
async function validateDeliverable(deliverable: any): Promise<any> {
  const checks = {
    urlAccessible: false,
    contentMatches: false,
    hashVerified: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // TODO: Implement actual validation logic
    // - Check if URL is accessible
    // - Validate content requirements (hashtags, mentions)
    // - Verify file hash if provided
    // - Compare uploaded asset to posted media when possible
    
    if (deliverable.url) {
      // Simulate URL accessibility check
      checks.urlAccessible = true;
    }

    if (deliverable.fileHash) {
      // Simulate hash verification
      checks.hashVerified = true;
    }

  } catch (error) {
    // Log validation errors but don't fail the submission
    console.error('Deliverable validation error:', error);
  }

  return checks;
}
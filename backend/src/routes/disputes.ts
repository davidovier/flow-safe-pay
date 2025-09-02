import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSecurityMiddleware } from '../middleware/security.js';
import { NotificationHelpers } from '../utils/notifications.js';

export async function disputeRoutes(fastify: FastifyInstance) {
  const { requireAuth } = await createSecurityMiddleware(fastify);

  // Admin middleware - requires admin role
  const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (user.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }
  };

  // Create a new dispute
  fastify.post('/', {
    preHandler: requireAuth,
    schema: {
      description: 'Create a new dispute',
      tags: ['Disputes'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          dealId: { type: 'string' },
          reason: { type: 'string', minLength: 10, maxLength: 1000 },
          category: { 
            type: 'string', 
            enum: ['QUALITY', 'DEADLINE', 'COMMUNICATION', 'PAYMENT', 'SCOPE', 'OTHER'] 
          },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['TEXT', 'IMAGE', 'FILE', 'URL'] },
                content: { type: 'string' },
                description: { type: 'string' }
              },
              required: ['type', 'content']
            }
          },
          requestedResolution: { 
            type: 'string', 
            enum: ['FULL_REFUND', 'PARTIAL_REFUND', 'REVISION', 'EXTENSION', 'CANCELLATION', 'OTHER'] 
          },
          requestedAmount: { type: 'number', minimum: 0 },
        },
        required: ['dealId', 'reason', 'category', 'requestedResolution']
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const {
      dealId,
      reason,
      category,
      evidence = [],
      requestedResolution,
      requestedAmount
    } = request.body as any;
    const currentUser = request.user as any;

    try {
      // Verify deal exists and user has access
      const deal = await fastify.prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          project: { select: { brandId: true } },
          creator: { select: { id: true, email: true } },
        }
      });

      if (!deal) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Deal not found',
        });
      }

      // Only deal participants can create disputes
      const isParticipant = deal.creatorId === currentUser.userId || 
                          deal.project.brandId === currentUser.userId;

      if (!isParticipant) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only deal participants can create disputes',
        });
      }

      // Check if deal is in a disputable state
      const disputableStates = ['FUNDED', 'SUBMITTED', 'REJECTED'];
      if (!disputableStates.includes(deal.state)) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Disputes can only be created for funded, submitted, or rejected deals',
        });
      }

      // Check if there's already an open dispute for this deal
      const existingDispute = await fastify.prisma.dispute.findFirst({
        where: {
          dealId,
          status: { in: ['OPEN', 'ESCALATED', 'UNDER_REVIEW'] }
        }
      });

      if (existingDispute) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'There is already an open dispute for this deal',
        });
      }

      // Validate requested amount if provided
      if (requestedAmount && requestedAmount > deal.totalAmount) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Requested amount cannot exceed deal total amount',
        });
      }

      // Create the dispute
      const dispute = await fastify.prisma.dispute.create({
        data: {
          dealId,
          raisedByUserId: currentUser.userId,
          reason,
          category,
          evidence: evidence,
          requestedResolution,
          requestedAmount: requestedAmount || null,
          status: 'OPEN',
        },
        include: {
          deal: {
            include: {
              project: { select: { title: true, brandId: true } },
              creator: { select: { id: true, email: true } }
            }
          },
          raisedBy: { select: { id: true, email: true, role: true } }
        }
      });

      // Update deal state to disputed
      await fastify.prisma.deal.update({
        where: { id: dealId },
        data: { state: 'DISPUTED' }
      });

      // Send notifications
      await NotificationHelpers.notifyDisputeCreated({
        disputeId: dispute.id,
        dealId: dealId,
        brandId: deal.project.brandId,
        creatorId: deal.creatorId,
        reason: reason,
        createdBy: currentUser.userId,
      });

      // Log event
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: 'dispute.created',
          payload: {
            disputeId: dispute.id,
            dealId,
            category,
            requestedResolution,
            timestamp: new Date().toISOString(),
          }
        }
      });

      return reply.status(201).send({ dispute });

    } catch (error) {
      fastify.log.error('Failed to create dispute:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create dispute',
      });
    }
  });

  // Get all disputes (with filtering)
  fastify.get('/', {
    preHandler: requireAuth,
    schema: {
      description: 'Get disputes with filtering',
      tags: ['Disputes'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
          status: { type: 'string', enum: ['OPEN', 'ESCALATED', 'UNDER_REVIEW', 'RESOLVED', 'WITHDRAWN'] },
          category: { type: 'string', enum: ['QUALITY', 'DEADLINE', 'COMMUNICATION', 'PAYMENT', 'SCOPE', 'OTHER'] },
          dealId: { type: 'string' },
          sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'status'], default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const {
      page = 1,
      limit = 20,
      status,
      category,
      dealId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.query as any;
    const currentUser = request.user as any;

    const skip = (page - 1) * limit;

    try {
      const where: any = {};

      // Filter by user's accessible disputes
      if (currentUser.role !== 'ADMIN') {
        where.OR = [
          { raisedByUserId: currentUser.userId },
          { deal: { creatorId: currentUser.userId } },
          { deal: { project: { brandId: currentUser.userId } } }
        ];
      }

      if (status) where.status = status;
      if (category) where.category = category;
      if (dealId) where.dealId = dealId;

      const [disputes, total] = await Promise.all([
        fastify.prisma.dispute.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            deal: {
              select: {
                id: true,
                totalAmount: true,
                currency: true,
                state: true,
                project: {
                  select: {
                    title: true,
                    brandId: true
                  }
                },
                creator: {
                  select: { id: true, email: true }
                }
              }
            },
            raisedBy: {
              select: { id: true, email: true, role: true }
            },
            resolutions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                resolvedBy: {
                  select: { id: true, email: true, role: true }
                }
              }
            }
          }
        }),
        fastify.prisma.dispute.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        disputes,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        }
      });

    } catch (error) {
      fastify.log.error('Failed to fetch disputes:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch disputes',
      });
    }
  });

  // Get dispute by ID
  fastify.get('/:disputeId', {
    preHandler: requireAuth,
    schema: {
      description: 'Get dispute by ID',
      tags: ['Disputes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          disputeId: { type: 'string' }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { disputeId } = request.params as any;
    const currentUser = request.user as any;

    try {
      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          deal: {
            include: {
              project: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  brandId: true
                }
              },
              creator: {
                select: { id: true, email: true, role: true }
              },
              milestones: {
                include: {
                  deliverables: true
                }
              }
            }
          },
          raisedBy: {
            select: { id: true, email: true, role: true }
          },
          resolutions: {
            orderBy: { createdAt: 'asc' },
            include: {
              resolvedBy: {
                select: { id: true, email: true, role: true }
              }
            }
          }
        }
      });

      if (!dispute) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Dispute not found',
        });
      }

      // Check access - only participants or admins
      const isParticipant = dispute.raisedByUserId === currentUser.userId ||
                          dispute.deal.creatorId === currentUser.userId ||
                          dispute.deal.project.brandId === currentUser.userId;

      if (!isParticipant && currentUser.role !== 'ADMIN') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      return reply.send({ dispute });

    } catch (error) {
      fastify.log.error(`Failed to fetch dispute ${disputeId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch dispute',
      });
    }
  });

  // Add response/comment to dispute
  fastify.post('/:disputeId/responses', {
    preHandler: requireAuth,
    schema: {
      description: 'Add response to dispute',
      tags: ['Disputes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          disputeId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          message: { type: 'string', minLength: 10, maxLength: 2000 },
          evidence: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['TEXT', 'IMAGE', 'FILE', 'URL'] },
                content: { type: 'string' },
                description: { type: 'string' }
              },
              required: ['type', 'content']
            }
          }
        },
        required: ['message']
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { disputeId } = request.params as any;
    const { message, evidence = [] } = request.body as any;
    const currentUser = request.user as any;

    try {
      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          deal: {
            select: {
              creatorId: true,
              project: { select: { brandId: true } }
            }
          }
        }
      });

      if (!dispute) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Dispute not found',
        });
      }

      // Check access - only participants or admins
      const isParticipant = dispute.raisedByUserId === currentUser.userId ||
                          dispute.deal.creatorId === currentUser.userId ||
                          dispute.deal.project.brandId === currentUser.userId;

      if (!isParticipant && currentUser.role !== 'ADMIN') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      // Cannot add responses to resolved disputes
      if (dispute.status === 'RESOLVED') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Cannot add responses to resolved disputes',
        });
      }

      // Create response
      const response = await fastify.prisma.disputeResponse.create({
        data: {
          disputeId,
          userId: currentUser.userId,
          message,
          evidence: evidence,
          isAdminResponse: currentUser.role === 'ADMIN',
        },
        include: {
          user: {
            select: { id: true, email: true, role: true }
          }
        }
      });

      // Update dispute timestamp
      await fastify.prisma.dispute.update({
        where: { id: disputeId },
        data: { updatedAt: new Date() }
      });

      // Log event
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: 'dispute.response_added',
          payload: {
            disputeId,
            responseId: response.id,
            isAdminResponse: currentUser.role === 'ADMIN',
            timestamp: new Date().toISOString(),
          }
        }
      });

      return reply.status(201).send({ response });

    } catch (error) {
      fastify.log.error(`Failed to add dispute response:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to add response',
      });
    }
  });

  // Admin: Escalate dispute
  fastify.patch('/:disputeId/escalate', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Escalate dispute to admin review (Admin only)',
      tags: ['Disputes', 'Admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          disputeId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', maxLength: 500 },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'MEDIUM' }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { disputeId } = request.params as any;
    const { reason, priority = 'MEDIUM' } = request.body as any;
    const currentUser = request.user as any;

    try {
      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id: disputeId },
        select: { id: true, status: true }
      });

      if (!dispute) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Dispute not found',
        });
      }

      if (dispute.status !== 'OPEN') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Only open disputes can be escalated',
        });
      }

      const updatedDispute = await fastify.prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'ESCALATED',
          escalatedAt: new Date(),
          escalatedBy: currentUser.userId,
          priority,
          adminNotes: reason || 'Escalated for admin review'
        }
      });

      // Log event
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: 'dispute.escalated',
          payload: {
            disputeId,
            priority,
            reason: reason || 'No reason provided',
            timestamp: new Date().toISOString(),
          }
        }
      });

      return reply.send({ 
        dispute: updatedDispute,
        message: 'Dispute escalated successfully'
      });

    } catch (error) {
      fastify.log.error(`Failed to escalate dispute ${disputeId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to escalate dispute',
      });
    }
  });

  // Admin: Resolve dispute
  fastify.post('/:disputeId/resolve', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Resolve dispute (Admin only)',
      tags: ['Disputes', 'Admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          disputeId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          resolution: { type: 'string', minLength: 10, maxLength: 2000 },
          resolutionType: { 
            type: 'string', 
            enum: ['FULL_REFUND', 'PARTIAL_REFUND', 'FAVOR_CREATOR', 'FAVOR_BRAND', 'COMPROMISE', 'DISMISS'] 
          },
          refundAmount: { type: 'number', minimum: 0 },
          newDeadline: { type: 'string', format: 'date-time' },
          actionRequired: {
            type: 'object',
            properties: {
              brandAction: { type: 'string' },
              creatorAction: { type: 'string' },
              deadline: { type: 'string', format: 'date-time' }
            }
          }
        },
        required: ['resolution', 'resolutionType']
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { disputeId } = request.params as any;
    const {
      resolution,
      resolutionType,
      refundAmount,
      newDeadline,
      actionRequired
    } = request.body as any;
    const currentUser = request.user as any;

    try {
      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          deal: {
            include: {
              project: { select: { brandId: true } },
              creator: { select: { id: true } }
            }
          }
        }
      });

      if (!dispute) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Dispute not found',
        });
      }

      // Validate refund amount if provided
      if (refundAmount && refundAmount > dispute.deal.totalAmount) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Refund amount cannot exceed deal total amount',
        });
      }

      await fastify.prisma.$transaction(async (tx) => {
        // Update dispute status
        await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            resolvedBy: currentUser.userId,
          }
        });

        // Create resolution record
        await tx.disputeResolution.create({
          data: {
            disputeId,
            resolvedBy: currentUser.userId,
            resolutionType,
            resolution,
            refundAmount: refundAmount || null,
            newDeadline: newDeadline ? new Date(newDeadline) : null,
            actionRequired: actionRequired || null,
          }
        });

        // Update deal state based on resolution
        let newDealState = dispute.deal.state;
        if (resolutionType === 'FULL_REFUND' || resolutionType === 'PARTIAL_REFUND') {
          newDealState = 'REFUNDED';
        } else if (resolutionType === 'FAVOR_CREATOR') {
          newDealState = 'COMPLETED';
        } else if (resolutionType !== 'DISMISS') {
          newDealState = 'FUNDED'; // Return to funded state for other resolutions
        }

        await tx.deal.update({
          where: { id: dispute.dealId },
          data: { 
            state: newDealState,
            ...(newDeadline && { deadline: new Date(newDeadline) })
          }
        });
      });

      // Send notifications
      await NotificationHelpers.notifyDisputeResolved({
        disputeId,
        dealId: dispute.dealId,
        brandId: dispute.deal.project.brandId,
        creatorId: dispute.deal.creatorId,
        resolution,
      });

      // Log event
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: 'dispute.resolved',
          payload: {
            disputeId,
            resolutionType,
            refundAmount,
            timestamp: new Date().toISOString(),
          }
        }
      });

      return reply.send({
        message: 'Dispute resolved successfully',
        resolutionType,
      });

    } catch (error) {
      fastify.log.error(`Failed to resolve dispute ${disputeId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to resolve dispute',
      });
    }
  });

  // Withdraw dispute (by creator)
  fastify.patch('/:disputeId/withdraw', {
    preHandler: requireAuth,
    schema: {
      description: 'Withdraw dispute',
      tags: ['Disputes'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          disputeId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          reason: { type: 'string', maxLength: 500 }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { disputeId } = request.params as any;
    const { reason } = request.body as any;
    const currentUser = request.user as any;

    try {
      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id: disputeId },
        select: { 
          id: true, 
          status: true, 
          raisedByUserId: true,
          dealId: true
        }
      });

      if (!dispute) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Dispute not found',
        });
      }

      // Only the person who raised the dispute can withdraw it
      if (dispute.raisedByUserId !== currentUser.userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only the dispute creator can withdraw it',
        });
      }

      // Cannot withdraw resolved disputes
      if (dispute.status === 'RESOLVED') {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Cannot withdraw resolved disputes',
        });
      }

      await fastify.prisma.$transaction(async (tx) => {
        // Update dispute status
        await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: 'WITHDRAWN',
            resolvedAt: new Date(),
            adminNotes: reason || 'Withdrawn by dispute creator'
          }
        });

        // Restore deal to funded state
        await tx.deal.update({
          where: { id: dispute.dealId },
          data: { state: 'FUNDED' }
        });
      });

      // Log event
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: 'dispute.withdrawn',
          payload: {
            disputeId,
            reason: reason || 'No reason provided',
            timestamp: new Date().toISOString(),
          }
        }
      });

      return reply.send({
        message: 'Dispute withdrawn successfully',
      });

    } catch (error) {
      fastify.log.error(`Failed to withdraw dispute ${disputeId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to withdraw dispute',
      });
    }
  });

  // Admin: Get dispute statistics
  fastify.get('/stats/overview', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Get dispute statistics (Admin only)',
      tags: ['Disputes', 'Admin'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [
        totalDisputes,
        disputesByStatus,
        disputesByCategory,
        averageResolutionTime,
        recentDisputes
      ] = await Promise.all([
        // Total disputes
        fastify.prisma.dispute.count(),
        
        // Disputes by status
        fastify.prisma.dispute.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        
        // Disputes by category
        fastify.prisma.dispute.groupBy({
          by: ['category'],
          _count: { category: true }
        }),
        
        // Average resolution time (in days)
        fastify.prisma.dispute.aggregate({
          where: {
            status: 'RESOLVED',
            resolvedAt: { not: null }
          },
          _avg: {
            resolutionTimeHours: true
          }
        }),
        
        // Recent disputes (last 30 days)
        fastify.prisma.dispute.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return reply.send({
        totalDisputes,
        recentDisputes,
        averageResolutionDays: averageResolutionTime._avg.resolutionTimeHours ? 
          Math.round(averageResolutionTime._avg.resolutionTimeHours / 24 * 10) / 10 : null,
        breakdown: {
          byStatus: disputesByStatus.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>),
          byCategory: disputesByCategory.reduce((acc, item) => {
            acc[item.category] = item._count.category;
            return acc;
          }, {} as Record<string, number>)
        }
      });

    } catch (error) {
      fastify.log.error('Failed to fetch dispute statistics:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch dispute statistics',
      });
    }
  });
}
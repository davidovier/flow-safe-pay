import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSecurityMiddleware } from '../middleware/security.js';
import { InvoiceService } from '../services/InvoiceService.js';

export async function invoiceRoutes(fastify: FastifyInstance) {
  const { requireAuth } = await createSecurityMiddleware(fastify);
  const invoiceService = new InvoiceService(fastify.prisma);

  // Admin middleware
  const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    if (user.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }
  };

  // Generate invoice for milestone
  fastify.post('/milestone/:milestoneId/generate', {
    preHandler: requireAuth,
    schema: {
      description: 'Generate invoice for milestone',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          milestoneId: { type: 'string' }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { milestoneId } = request.params as any;
    const currentUser = request.user as any;

    try {
      // Verify milestone access
      const milestone = await fastify.prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          deal: {
            include: {
              project: { select: { brandId: true } },
              creator: { select: { id: true } }
            }
          }
        }
      });

      if (!milestone) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Milestone not found',
        });
      }

      // Only allow deal participants or admins to generate invoices
      const isParticipant = milestone.deal.creatorId === currentUser.userId ||
                          milestone.deal.project.brandId === currentUser.userId;

      if (!isParticipant && currentUser.role !== 'ADMIN') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      const pdfUrl = await invoiceService.generateInvoiceForMilestone(milestoneId);

      return reply.send({
        message: 'Invoice generated successfully',
        pdfUrl,
      });

    } catch (error: any) {
      fastify.log.error(`Failed to generate invoice for milestone ${milestoneId}:`, error);
      
      if (error.message.includes('not found')) {
        return reply.status(404).send({
          error: 'Not Found',
          message: error.message,
        });
      }

      if (error.message.includes('can only be generated')) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: error.message,
        });
      }

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate invoice',
      });
    }
  });

  // Get invoice by ID
  fastify.get('/:invoiceId', {
    preHandler: requireAuth,
    schema: {
      description: 'Get invoice by ID',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.params as any;
    const currentUser = request.user as any;

    try {
      const invoice = await invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      // Check access - only deal participants or admins
      const isParticipant = invoice.deal.creatorId === currentUser.userId ||
                          invoice.deal.project.brandId === currentUser.userId;

      if (!isParticipant && currentUser.role !== 'ADMIN') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      return reply.send({ invoice });

    } catch (error) {
      fastify.log.error(`Failed to fetch invoice ${invoiceId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch invoice',
      });
    }
  });

  // Get invoices for deal
  fastify.get('/deal/:dealId', {
    preHandler: requireAuth,
    schema: {
      description: 'Get invoices for deal',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          dealId: { type: 'string' }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { dealId } = request.params as any;
    const currentUser = request.user as any;

    try {
      // Verify deal access
      const deal = await fastify.prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          project: { select: { brandId: true } },
          creator: { select: { id: true } }
        }
      });

      if (!deal) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Deal not found',
        });
      }

      // Check access - only deal participants or admins
      const isParticipant = deal.creatorId === currentUser.userId ||
                          deal.project.brandId === currentUser.userId;

      if (!isParticipant && currentUser.role !== 'ADMIN') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      const invoices = await invoiceService.getInvoicesForDeal(dealId);

      return reply.send({ invoices });

    } catch (error) {
      fastify.log.error(`Failed to fetch invoices for deal ${dealId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch invoices',
      });
    }
  });

  // Get user's invoices
  fastify.get('/user/me', {
    preHandler: requireAuth,
    schema: {
      description: 'Get current user invoices',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['GENERATED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = request.user as any;
    const { status, limit = 20 } = request.query as any;

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { role: true }
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      const invoices = await invoiceService.getInvoicesForUser(
        currentUser.userId, 
        user.role as 'CREATOR' | 'BRAND'
      );

      // Filter by status if provided
      const filteredInvoices = status ? 
        invoices.filter(invoice => invoice.status === status).slice(0, limit) :
        invoices.slice(0, limit);

      return reply.send({ invoices: filteredInvoices });

    } catch (error) {
      fastify.log.error(`Failed to fetch user invoices:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch invoices',
      });
    }
  });

  // Admin: Get all invoices with filtering
  fastify.get('/admin/all', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Get all invoices (Admin only)',
      tags: ['Invoices', 'Admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          status: { type: 'string', enum: ['GENERATED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'] },
          currency: { type: 'string' },
          sortBy: { type: 'string', enum: ['issueDate', 'amount', 'status'], default: 'issueDate' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const {
      page = 1,
      limit = 20,
      status,
      currency,
      sortBy = 'issueDate',
      sortOrder = 'desc'
    } = request.query as any;

    const skip = (page - 1) * limit;

    try {
      const where: any = {};
      if (status) where.status = status;
      if (currency) where.currency = currency;

      const [invoices, total] = await Promise.all([
        fastify.prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            deal: {
              include: {
                project: {
                  select: { title: true, brandId: true }
                },
                creator: {
                  select: { id: true, email: true }
                }
              }
            },
            milestone: {
              select: { title: true }
            }
          }
        }),
        fastify.prisma.invoice.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        invoices,
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
      fastify.log.error('Failed to fetch admin invoices:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch invoices',
      });
    }
  });

  // Admin: Get invoice statistics
  fastify.get('/admin/stats', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Get invoice statistics (Admin only)',
      tags: ['Invoices', 'Admin'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [
        totalInvoices,
        invoicesByStatus,
        totalRevenue,
        averageInvoiceAmount,
        recentInvoices
      ] = await Promise.all([
        // Total invoices
        fastify.prisma.invoice.count(),
        
        // Invoices by status
        fastify.prisma.invoice.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        
        // Total revenue (sum of all paid invoices)
        fastify.prisma.invoice.aggregate({
          where: { status: 'PAID' },
          _sum: { amount: true }
        }),
        
        // Average invoice amount
        fastify.prisma.invoice.aggregate({
          _avg: { amount: true }
        }),
        
        // Recent invoices (last 30 days)
        fastify.prisma.invoice.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return reply.send({
        totalInvoices,
        recentInvoices,
        totalRevenue: totalRevenue._sum.amount ? totalRevenue._sum.amount / 100 : 0, // Convert to dollars
        averageInvoiceAmount: averageInvoiceAmount._avg.amount ? 
          Math.round(averageInvoiceAmount._avg.amount / 100) : 0, // Convert to dollars
        breakdown: {
          byStatus: invoicesByStatus.reduce((acc, item) => {
            acc[item.status] = item._count.status;
            return acc;
          }, {} as Record<string, number>)
        }
      });

    } catch (error) {
      fastify.log.error('Failed to fetch invoice statistics:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch invoice statistics',
      });
    }
  });

  // Mark invoice as sent
  fastify.patch('/:invoiceId/sent', {
    preHandler: requireAuth,
    schema: {
      description: 'Mark invoice as sent',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.params as any;
    const currentUser = request.user as any;

    try {
      const invoice = await invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      // Check access - only creator (invoice issuer) or admins can mark as sent
      const canMarkAsSent = invoice.deal.creatorId === currentUser.userId || 
                           currentUser.role === 'ADMIN';

      if (!canMarkAsSent) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Only invoice creator can mark as sent',
        });
      }

      await invoiceService.markInvoiceAsSent(invoiceId);

      return reply.send({
        message: 'Invoice marked as sent',
      });

    } catch (error) {
      fastify.log.error(`Failed to mark invoice ${invoiceId} as sent:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update invoice',
      });
    }
  });

  // Mark invoice as paid (usually called by payment webhooks)
  fastify.patch('/:invoiceId/paid', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Mark invoice as paid (Admin only)',
      tags: ['Invoices', 'Admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.params as any;

    try {
      const invoice = await invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      await invoiceService.markInvoiceAsPaid(invoiceId);

      return reply.send({
        message: 'Invoice marked as paid',
      });

    } catch (error) {
      fastify.log.error(`Failed to mark invoice ${invoiceId} as paid:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update invoice',
      });
    }
  });

  // Download invoice PDF
  fastify.get('/:invoiceId/download', {
    preHandler: requireAuth,
    schema: {
      description: 'Download invoice PDF',
      tags: ['Invoices'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { invoiceId } = request.params as any;
    const currentUser = request.user as any;

    try {
      const invoice = await invoiceService.getInvoiceById(invoiceId);

      if (!invoice) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Invoice not found',
        });
      }

      // Check access
      const isParticipant = invoice.deal.creatorId === currentUser.userId ||
                          invoice.deal.project.brandId === currentUser.userId;

      if (!isParticipant && currentUser.role !== 'ADMIN') {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      if (!invoice.pdfUrl) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Invoice PDF not found',
        });
      }

      // In a real implementation, would fetch and stream the PDF from S3
      // For now, redirect to the PDF URL
      return reply.redirect(302, invoice.pdfUrl);

    } catch (error) {
      fastify.log.error(`Failed to download invoice ${invoiceId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to download invoice',
      });
    }
  });
}
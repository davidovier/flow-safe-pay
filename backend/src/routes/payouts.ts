import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function payoutRoutes(fastify: FastifyInstance) {
  
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Get payout status
  fastify.get('/:payoutId', {
    preHandler: requireAuth,
    schema: {
      description: 'Get payout status by ID',
      tags: ['Payouts'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { payoutId } = request.params as any;

      const payout = await fastify.prisma.payout.findUnique({
        where: { id: payoutId },
        include: {
          deal: {
            include: {
              project: true,
              creator: {
                select: { id: true, email: true, role: true },
              },
            },
          },
          milestone: true,
        },
      });

      if (!payout) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Payout not found',
        });
      }

      // Check access permissions
      const hasAccess = payout.deal.creatorId === userId || 
                       payout.deal.project.brandId === userId ||
                       role === 'ADMIN';

      if (!hasAccess) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied',
        });
      }

      return reply.send(payout);

    } catch (error) {
      fastify.log.error('Get payout error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get payout',
      });
    }
  });

  // Get user's payouts
  fastify.get('/', {
    preHandler: requireAuth,
    schema: {
      description: 'Get payouts for current user',
      tags: ['Payouts'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId, role } = request.user as any;
      const { status, limit = 20, offset = 0 } = request.query as any;

      const where: any = {};
      
      if (role === 'CREATOR') {
        where.deal = { creatorId: userId };
      } else if (role === 'BRAND') {
        where.deal = { project: { brandId: userId } };
      }

      if (status) {
        where.status = status;
      }

      const payouts = await fastify.prisma.payout.findMany({
        where,
        include: {
          deal: {
            include: {
              project: true,
              creator: {
                select: { id: true, email: true, role: true },
              },
            },
          },
          milestone: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await fastify.prisma.payout.count({ where });

      return reply.send({
        payouts,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      });

    } catch (error) {
      fastify.log.error('Get payouts error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get payouts',
      });
    }
  });
}
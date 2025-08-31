import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export async function userRoutes(fastify: FastifyInstance) {
  
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Get user profile
  fastify.get('/:userId', {
    preHandler: requireAuth,
    schema: {
      description: 'Get user profile by ID',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as any;
    const currentUser = request.user as any;
    
    // Only allow access to own profile or admin
    if (currentUser.userId !== userId && currentUser.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Access denied',
      });
    }

    const user = await fastify.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        country: true,
        kycStatus: true,
        stripeAccountId: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return reply.send({ user });
  });

  // Update user profile
  fastify.patch('/:userId', {
    preHandler: requireAuth,
    schema: {
      description: 'Update user profile',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implement user profile updates
    return reply.status(501).send({
      error: 'Not Implemented',
      message: 'User profile updates will be implemented in future version',
    });
  });
}
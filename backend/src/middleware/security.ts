import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

/**
 * Security middleware to block deleted accounts from accessing any protected endpoint
 */
export async function createSecurityMiddleware(fastify: FastifyInstance) {
  
  /**
   * Middleware to check if the authenticated user's account is deleted
   * This should be used on ALL protected routes to prevent deleted account access
   */
  const requireActiveAccount = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // First verify JWT token
      await request.jwtVerify();
      
      const { userId } = request.user as any;
      
      // Check if user account is deleted
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          kycStatus: true,
          deletedAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User account not found',
        });
      }

      // SECURITY: Block access for deleted accounts
      if (user.kycStatus === 'DELETED' || user.deletedAt) {
        // Log security event
        await fastify.prisma.event.create({
          data: {
            actorUserId: null,
            type: 'security.deleted_account_blocked',
            payload: {
              deletedUserId: user.id,
              attemptedRoute: request.routerPath || request.url,
              timestamp: new Date().toISOString(),
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'] || 'Unknown',
              method: request.method,
            },
          },
        });

        fastify.log.warn(`Blocked deleted account access: User ${user.id} attempted ${request.method} ${request.url}`);
        
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'This account has been deleted and cannot be accessed',
        });
      }

      // Account is active, continue with request
    } catch (error) {
      // If JWT verification fails, let the original error bubble up
      throw error;
    }
  };

  /**
   * Standard JWT auth that also checks for deleted accounts
   */
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    await requireActiveAccount(request, reply);
  };

  /**
   * Admin-only access that also checks for deleted accounts  
   */
  const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    await requireActiveAccount(request, reply);
    
    const { role } = request.user as any;
    if (role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }
  };

  /**
   * Creator-only access that also checks for deleted accounts
   */
  const requireCreator = async (request: FastifyRequest, reply: FastifyReply) => {
    await requireActiveAccount(request, reply);
    
    const { role } = request.user as any;
    if (role !== 'CREATOR') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Creator access required',
      });
    }
  };

  /**
   * Brand-only access that also checks for deleted accounts
   */
  const requireBrand = async (request: FastifyRequest, reply: FastifyReply) => {
    await requireActiveAccount(request, reply);
    
    const { role } = request.user as any;
    if (role !== 'BRAND') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Brand access required',
      });
    }
  };

  return {
    requireAuth,
    requireAdmin,
    requireCreator,
    requireBrand,
    requireActiveAccount,
  };
}
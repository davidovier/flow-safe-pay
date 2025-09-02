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

  // Delete user account - GDPR compliant complete data removal
  fastify.delete('/:userId', {
    preHandler: requireAuth,
    schema: {
      description: 'Delete user account and all associated data (GDPR compliant)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          confirmEmail: { type: 'string' },
          reason: { type: 'string', maxLength: 500 }
        },
        required: ['confirmEmail']
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as any;
    const { confirmEmail, reason } = request.body as any;
    const currentUser = request.user as any;
    
    // Only allow users to delete their own account
    if (currentUser.userId !== userId) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only delete your own account',
      });
    }

    try {
      // Start transaction for atomic deletion
      await fastify.prisma.$transaction(async (tx) => {
        // First, verify the user exists and email matches
        const user = await tx.user.findUnique({
          where: { id: userId },
          include: {
            brandProjects: {
              include: {
                deals: {
                  include: {
                    milestones: {
                      include: {
                        deliverables: true,
                        payouts: true
                      }
                    },
                    contract: true,
                    disputes: true,
                    payouts: true,
                    events: true
                  }
                }
              }
            },
            creatorDeals: {
              include: {
                milestones: {
                  include: {
                    deliverables: true,
                    payouts: true
                  }
                },
                contract: true,
                disputes: true,
                payouts: true,
                events: true
              }
            },
            raisedDisputes: true,
            events: true
          }
        });

        if (!user) {
          throw new Error('User not found');
        }

        // Verify email confirmation
        if (user.email !== confirmEmail) {
          throw new Error('Email confirmation does not match');
        }

        // Check for active deals that would prevent deletion
        const hasActiveFundedDeals = [
          ...user.brandProjects.flatMap(p => p.deals),
          ...user.creatorDeals
        ].some(deal => deal.state === 'FUNDED' || deal.state === 'DISPUTED');

        if (hasActiveFundedDeals) {
          throw new Error('Cannot delete account with active funded deals. Please complete or resolve all deals first.');
        }

        // Log deletion event for audit trail (anonymized)
        await tx.event.create({
          data: {
            actorUserId: null, // Anonymized
            type: 'user.deleted',
            payload: {
              deletedUserId: userId,
              reason: reason || 'User requested deletion',
              timestamp: new Date().toISOString(),
              accountType: user.role,
              dataTypes: ['profile', 'deals', 'projects', 'events', 'disputes'],
              gdprCompliant: true
            }
          }
        });

        // Delete all related data in correct order (respecting foreign key constraints)
        // 1. Delete deliverables first
        await tx.deliverable.deleteMany({
          where: {
            milestone: {
              deal: {
                OR: [
                  { creatorId: userId },
                  { project: { brandId: userId } }
                ]
              }
            }
          }
        });

        // 2. Delete payouts
        await tx.payout.deleteMany({
          where: {
            deal: {
              OR: [
                { creatorId: userId },
                { project: { brandId: userId } }
              ]
            }
          }
        });

        // 3. Delete milestones
        await tx.milestone.deleteMany({
          where: {
            deal: {
              OR: [
                { creatorId: userId },
                { project: { brandId: userId } }
              ]
            }
          }
        });

        // 4. Delete contracts
        await tx.contract.deleteMany({
          where: {
            deal: {
              OR: [
                { creatorId: userId },
                { project: { brandId: userId } }
              ]
            }
          }
        });

        // 5. Delete disputes
        await tx.dispute.deleteMany({
          where: {
            OR: [
              { raisedByUserId: userId },
              {
                deal: {
                  OR: [
                    { creatorId: userId },
                    { project: { brandId: userId } }
                  ]
                }
              }
            ]
          }
        });

        // 6. Delete deals
        await tx.deal.deleteMany({
          where: {
            OR: [
              { creatorId: userId },
              { project: { brandId: userId } }
            ]
          }
        });

        // 7. Delete projects
        await tx.project.deleteMany({
          where: { brandId: userId }
        });

        // 8. Update events to anonymize user reference
        await tx.event.updateMany({
          where: { actorUserId: userId },
          data: { actorUserId: null }
        });

        // 9. Finally delete the user
        await tx.user.delete({
          where: { id: userId }
        });
      });

      fastify.log.info(`User account deleted: ${userId}, reason: ${reason || 'User requested'}`);
      
      return reply.send({
        message: 'Account successfully deleted. All personal data has been permanently removed.',
        deletedAt: new Date().toISOString(),
        gdprCompliant: true
      });

    } catch (error) {
      fastify.log.error(`Failed to delete user account ${userId}:`, error);
      
      if (error instanceof Error) {
        if (error.message.includes('Email confirmation')) {
          return reply.status(400).send({
            error: 'Bad Request',
            message: 'Email confirmation does not match your account email',
          });
        }
        
        if (error.message.includes('active funded deals')) {
          return reply.status(409).send({
            error: 'Conflict',
            message: 'Cannot delete account with active funded deals. Please complete or resolve all deals first.',
          });
        }
      }

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to delete account. Please try again or contact support.',
      });
    }
  });
}
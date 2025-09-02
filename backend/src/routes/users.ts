import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createSecurityMiddleware } from '../middleware/security.js';

export async function userRoutes(fastify: FastifyInstance) {
  
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

  // Admin: Get all users with filtering and pagination
  fastify.get('/', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Get all users (Admin only)',
      tags: ['Users', 'Admin'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          role: { type: 'string', enum: ['CREATOR', 'BRAND', 'ADMIN'] },
          kycStatus: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED', 'DELETED'] },
          country: { type: 'string', pattern: '^[A-Z]{2}$' },
          search: { type: 'string', minLength: 2 },
          sortBy: { type: 'string', enum: ['createdAt', 'updatedAt', 'email'], default: 'createdAt' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const {
      page = 1,
      limit = 20,
      role,
      kycStatus,
      country,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = request.query as any;

    const skip = (page - 1) * limit;

    try {
      const where: any = {
        kycStatus: { not: 'DELETED' } // Don't show deleted accounts
      };

      if (role) where.role = role;
      if (kycStatus) where.kycStatus = kycStatus;
      if (country) where.country = country;
      
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { id: { contains: search } },
        ];
      }

      const [users, total] = await Promise.all([
        fastify.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          select: {
            id: true,
            email: true,
            role: true,
            country: true,
            kycStatus: true,
            stripeAccountId: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                brandProjects: true,
                creatorDeals: true,
                raisedDisputes: true,
              }
            }
          },
        }),
        fastify.prisma.user.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return reply.send({
        users,
        pagination: {
          total,
          totalPages,
          currentPage: page,
          limit,
          hasNext,
          hasPrev,
        }
      });

    } catch (error) {
      fastify.log.error('Failed to fetch users:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch users',
      });
    }
  });

  // Admin: Get user statistics
  fastify.get('/stats', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Get user statistics (Admin only)',
      tags: ['Users', 'Admin'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const [
        totalUsers,
        usersByRole,
        usersByKycStatus,
        usersByCountry,
        recentSignups,
        activeUsersLast30Days
      ] = await Promise.all([
        // Total users (excluding deleted)
        fastify.prisma.user.count({
          where: { kycStatus: { not: 'DELETED' } }
        }),
        
        // Users by role
        fastify.prisma.user.groupBy({
          by: ['role'],
          where: { kycStatus: { not: 'DELETED' } },
          _count: { role: true }
        }),
        
        // Users by KYC status
        fastify.prisma.user.groupBy({
          by: ['kycStatus'],
          where: { kycStatus: { not: 'DELETED' } },
          _count: { kycStatus: true }
        }),
        
        // Users by country
        fastify.prisma.user.groupBy({
          by: ['country'],
          where: { 
            kycStatus: { not: 'DELETED' },
            country: { not: null }
          },
          _count: { country: true },
          orderBy: { _count: { country: 'desc' } },
          take: 10
        }),
        
        // Recent signups (last 30 days)
        fastify.prisma.user.count({
          where: {
            kycStatus: { not: 'DELETED' },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        
        // Active users (users with activity in last 30 days)
        fastify.prisma.user.count({
          where: {
            kycStatus: { not: 'DELETED' },
            updatedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      return reply.send({
        totalUsers,
        recentSignups,
        activeUsersLast30Days,
        breakdown: {
          byRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {} as Record<string, number>),
          byKycStatus: usersByKycStatus.reduce((acc, item) => {
            acc[item.kycStatus] = item._count.kycStatus;
            return acc;
          }, {} as Record<string, number>),
          byCountry: usersByCountry.map(item => ({
            country: item.country,
            count: item._count.country
          }))
        }
      });

    } catch (error) {
      fastify.log.error('Failed to fetch user statistics:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch user statistics',
      });
    }
  });

  // Admin: Update user role or status
  fastify.patch('/:userId/admin-update', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Admin update user (role, KYC status, etc.)',
      tags: ['Users', 'Admin'],
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
          role: { type: 'string', enum: ['CREATOR', 'BRAND', 'ADMIN'] },
          kycStatus: { type: 'string', enum: ['PENDING', 'APPROVED', 'REJECTED'] },
          reason: { type: 'string', maxLength: 500 },
        },
        minProperties: 1
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as any;
    const { role, kycStatus, reason } = request.body as any;
    const currentUser = request.user as any;

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true, kycStatus: true }
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      const updateData: any = {};
      const changes: string[] = [];

      if (role && role !== user.role) {
        updateData.role = role;
        changes.push(`role: ${user.role} → ${role}`);
      }

      if (kycStatus && kycStatus !== user.kycStatus) {
        updateData.kycStatus = kycStatus;
        changes.push(`kycStatus: ${user.kycStatus} → ${kycStatus}`);
      }

      if (changes.length === 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'No changes to apply',
        });
      }

      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          role: true,
          country: true,
          kycStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log admin action
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: 'user.admin_updated',
          payload: {
            targetUserId: userId,
            changes,
            reason: reason || 'No reason provided',
            timestamp: new Date().toISOString(),
          }
        }
      });

      fastify.log.info(`Admin ${currentUser.userId} updated user ${userId}: ${changes.join(', ')}`);

      return reply.send({ 
        user: updatedUser,
        changes 
      });

    } catch (error) {
      fastify.log.error(`Failed to admin update user ${userId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update user',
      });
    }
  });

  // Admin: Get user activity history
  fastify.get('/:userId/activity', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Get user activity history (Admin only)',
      tags: ['Users', 'Admin'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1 },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          eventType: { type: 'string' },
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as any;
    const { page = 1, limit = 20, eventType } = request.query as any;

    const skip = (page - 1) * limit;

    try {
      const where: any = {
        OR: [
          { actorUserId: userId },
          { payload: { path: ['userId'], equals: userId } },
          { payload: { path: ['targetUserId'], equals: userId } }
        ]
      };

      if (eventType) {
        where.type = { contains: eventType };
      }

      const [events, total] = await Promise.all([
        fastify.prisma.event.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            payload: true,
            createdAt: true,
            actorUserId: true,
          }
        }),
        fastify.prisma.event.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      return reply.send({
        events,
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
      fastify.log.error(`Failed to fetch user activity ${userId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch user activity',
      });
    }
  });

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
      params: {
        type: 'object',
        properties: {
          userId: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        properties: {
          country: { type: 'string', pattern: '^[A-Z]{2}$' },
          notificationPreferences: {
            type: 'object',
            properties: {
              email: { type: 'boolean' },
              push: { type: 'boolean' },
              sms: { type: 'boolean' },
              dealUpdates: { type: 'boolean' },
              milestoneReminders: { type: 'boolean' },
              paymentNotifications: { type: 'boolean' },
            }
          }
        }
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as any;
    const { country, notificationPreferences } = request.body as any;
    const currentUser = request.user as any;
    
    // Only allow access to own profile or admin
    if (currentUser.userId !== userId && currentUser.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Access denied',
      });
    }

    try {
      const updateData: any = {};
      
      if (country) {
        updateData.country = country;
      }
      
      if (notificationPreferences) {
        updateData.notificationPreferences = notificationPreferences;
      }

      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          role: true,
          country: true,
          kycStatus: true,
          notificationPreferences: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log update event
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: 'user.updated',
          payload: {
            userId: userId,
            updatedFields: Object.keys(updateData),
            isAdminAction: currentUser.userId !== userId,
          }
        }
      });

      return reply.send({ user: updatedUser });

    } catch (error) {
      fastify.log.error(`Failed to update user profile ${userId}:`, error);
      
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update profile',
      });
    }
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

        // 9. Mark user as deleted (GDPR compliant - removes all personal data but keeps record for security)
        const deletedAt = new Date();
        await tx.user.update({
          where: { id: userId },
          data: {
            email: `DELETED_${userId}@deleted.account`, // Unique email to allow new registrations with same email
            hashedPassword: null, // Remove password hash completely
            country: null,
            stripeAccountId: null,
            kycStatus: 'DELETED',
            deletedAt: deletedAt,
            updatedAt: deletedAt,
          },
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

  // Get current user profile (self)
  fastify.get('/me', {
    preHandler: requireAuth,
    schema: {
      description: 'Get current user profile',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = request.user as any;

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: {
          id: true,
          email: true,
          role: true,
          country: true,
          kycStatus: true,
          stripeAccountId: true,
          notificationPreferences: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              brandProjects: true,
              creatorDeals: true,
              raisedDisputes: true,
            }
          }
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      return reply.send({ user });

    } catch (error) {
      fastify.log.error(`Failed to fetch current user profile:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch profile',
      });
    }
  });

  // Change password
  fastify.post('/me/change-password', {
    preHandler: requireAuth,
    schema: {
      description: 'Change user password',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          currentPassword: { type: 'string', minLength: 8 },
          newPassword: { type: 'string', minLength: 8, maxLength: 128 },
        },
        required: ['currentPassword', 'newPassword']
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { currentPassword, newPassword } = request.body as any;
    const currentUser = request.user as any;

    try {
      const bcrypt = await import('bcrypt');
      
      // Get current password hash
      const user = await fastify.prisma.user.findUnique({
        where: { id: currentUser.userId },
        select: { hashedPassword: true }
      });

      if (!user || !user.hashedPassword) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid current password',
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.hashedPassword);
      if (!isValidPassword) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid current password',
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await fastify.prisma.user.update({
        where: { id: currentUser.userId },
        data: { hashedPassword: hashedNewPassword }
      });

      // Log password change event
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: 'user.password_changed',
          payload: {
            userId: currentUser.userId,
            timestamp: new Date().toISOString(),
          }
        }
      });

      return reply.send({
        message: 'Password changed successfully',
      });

    } catch (error) {
      fastify.log.error(`Failed to change password for user ${currentUser.userId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to change password',
      });
    }
  });

  // Request account data export (GDPR)
  fastify.post('/me/export-data', {
    preHandler: requireAuth,
    schema: {
      description: 'Request account data export (GDPR)',
      tags: ['Users'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = request.user as any;

    try {
      // Get comprehensive user data
      const userData = await fastify.prisma.user.findUnique({
        where: { id: currentUser.userId },
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
              events: true,
              project: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  brandId: true,
                }
              }
            }
          },
          raisedDisputes: true,
          events: true
        }
      });

      if (!userData) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // Remove sensitive data
      const { hashedPassword, ...exportData } = userData;

      // Log data export request
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: 'user.data_exported',
          payload: {
            userId: currentUser.userId,
            timestamp: new Date().toISOString(),
            gdprCompliant: true,
          }
        }
      });

      return reply.send({
        userData: exportData,
        exportedAt: new Date().toISOString(),
        gdprCompliant: true,
      });

    } catch (error) {
      fastify.log.error(`Failed to export data for user ${currentUser.userId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to export data',
      });
    }
  });

  // Admin: Suspend/unsuspend user account
  fastify.patch('/:userId/suspend', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Suspend or unsuspend user account (Admin only)',
      tags: ['Users', 'Admin'],
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
          suspended: { type: 'boolean' },
          reason: { type: 'string', maxLength: 500 },
        },
        required: ['suspended']
      }
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = request.params as any;
    const { suspended, reason } = request.body as any;
    const currentUser = request.user as any;

    try {
      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, role: true }
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // Cannot suspend other admins
      if (user.role === 'ADMIN' && currentUser.userId !== userId) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Cannot suspend other administrators',
        });
      }

      const updatedUser = await fastify.prisma.user.update({
        where: { id: userId },
        data: {
          suspended: suspended,
          suspendedAt: suspended ? new Date() : null,
        },
        select: {
          id: true,
          email: true,
          role: true,
          suspended: true,
          suspendedAt: true,
        },
      });

      // Log admin action
      await fastify.prisma.event.create({
        data: {
          actorUserId: currentUser.userId,
          type: suspended ? 'user.suspended' : 'user.unsuspended',
          payload: {
            targetUserId: userId,
            reason: reason || 'No reason provided',
            timestamp: new Date().toISOString(),
          }
        }
      });

      const action = suspended ? 'suspended' : 'unsuspended';
      fastify.log.info(`Admin ${currentUser.userId} ${action} user ${userId}: ${reason || 'No reason provided'}`);

      return reply.send({ 
        user: updatedUser,
        action: action 
      });

    } catch (error) {
      fastify.log.error(`Failed to suspend/unsuspend user ${userId}:`, error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update user suspension status',
      });
    }
  });
}
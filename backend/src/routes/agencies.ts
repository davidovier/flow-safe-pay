import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../types/auth.js';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// Validation schemas
const createAgencySchema = z.object({
  name: z.string().min(2).max(100),
  companyInfo: z.object({
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    description: z.string().max(500).optional(),
  }).optional(),
});

const inviteCreatorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

const updateAgencySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  companyInfo: z.object({
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    description: z.string().max(500).optional(),
  }).optional(),
  branding: z.object({
    logo: z.string().url().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
  }).optional(),
});

export async function agencyRoutes(fastify: FastifyInstance) {
  
  // Middleware to require authentication
  const requireAuth = async (request: AuthenticatedRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Create agency (convert AGENCY user to agency owner)
  fastify.post('/', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { user } = request;
      const body = createAgencySchema.parse(request.body);

      if (user.role !== 'AGENCY') {
        return reply.status(403).send({ error: 'Only AGENCY users can create agencies' });
      }

      // Check if user already owns an agency
      const existingAgency = await fastify.prisma.agency.findUnique({
        where: { ownerId: user.id },
      });

      if (existingAgency) {
        return reply.status(400).send({ error: 'User already owns an agency' });
      }

      const agency = await fastify.prisma.agency.create({
        data: {
          name: body.name,
          ownerId: user.id,
          companyInfo: body.companyInfo,
          tier: 'STARTER',
          maxCreators: 5,
          platformFeeRate: 5.0,
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          subscription: true,
          _count: {
            select: {
              managedCreators: true,
              memberships: true,
            },
          },
        },
      });

      // Create initial subscription (trial)
      const subscription = await fastify.prisma.agencySubscription.create({
        data: {
          agencyId: agency.id,
          tier: 'STARTER',
          status: 'TRIALING',
          basePrice: 99.00,
          perCreatorPrice: 15.00,
          platformFeeRate: 5.0,
          billingCycle: 'monthly',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      reply.send({ 
        ...agency, 
        subscription,
      });
    },
  });

  // Get user's agency
  fastify.get('/me', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { user } = request;

      if (user.role !== 'AGENCY') {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const agency = await fastify.prisma.agency.findUnique({
        where: { ownerId: user.id },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          subscription: true,
          managedCreators: {
            select: {
              id: true,
              email: true,
              createdAt: true,
              kycStatus: true,
            },
          },
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              managedCreators: true,
              memberships: true,
            },
          },
        },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      reply.send(agency);
    },
  });

  // Get agency by ID
  fastify.get('/:id', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { user } = request;

      const agency = await fastify.prisma.agency.findUnique({
        where: { id },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          subscription: true,
          managedCreators: {
            select: {
              id: true,
              email: true,
              createdAt: true,
              kycStatus: true,
            },
          },
          memberships: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          _count: {
            select: {
              managedCreators: true,
              memberships: true,
            },
          },
        },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      // Check if user has access to this agency
      const hasAccess = 
        agency.ownerId === user.id ||
        agency.memberships.some(m => m.userId === user.id && m.isActive) ||
        user.role === 'ADMIN';

      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      reply.send(agency);
    },
  });

  // Update agency
  fastify.patch('/:id', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { user } = request;
      const body = updateAgencySchema.parse(request.body);

      const agency = await fastify.prisma.agency.findUnique({
        where: { id },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      // Check if user is owner or admin
      const membership = await fastify.prisma.agencyMembership.findUnique({
        where: {
          agencyId_userId: {
            agencyId: id,
            userId: user.id,
          },
        },
      });

      const canEdit = 
        agency.ownerId === user.id ||
        (membership && membership.role === 'ADMIN') ||
        user.role === 'ADMIN';

      if (!canEdit) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      const updatedAgency = await fastify.prisma.agency.update({
        where: { id },
        data: {
          ...body,
          updatedAt: new Date(),
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
          subscription: true,
          _count: {
            select: {
              managedCreators: true,
              memberships: true,
            },
          },
        },
      });

      reply.send(updatedAgency);
    },
  });

  // Invite creator to agency
  fastify.post('/:id/invite', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { user } = request;
      const body = inviteCreatorSchema.parse(request.body);

      const agency = await fastify.prisma.agency.findUnique({
        where: { id },
        include: {
          subscription: true,
          _count: {
            select: {
              managedCreators: true,
            },
          },
        },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      // Check permissions
      const canInvite = 
        agency.ownerId === user.id ||
        user.role === 'ADMIN';

      if (!canInvite) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Check if agency has reached creator limit
      if (agency._count.managedCreators >= agency.maxCreators) {
        return reply.status(400).send({ 
          error: 'Creator limit reached',
          limit: agency.maxCreators,
          current: agency._count.managedCreators,
        });
      }

      // Check if user exists and is a creator
      const invitedUser = await fastify.prisma.user.findUnique({
        where: { email: body.email },
      });

      if (!invitedUser) {
        return reply.status(404).send({ error: 'User not found' });
      }

      if (invitedUser.role !== 'CREATOR') {
        return reply.status(400).send({ error: 'Can only invite CREATOR users' });
      }

      if (invitedUser.isAgencyManaged) {
        return reply.status(400).send({ error: 'Creator is already managed by an agency' });
      }

      // Create invitation
      const inviteToken = nanoid(32);
      const invitation = await fastify.prisma.agencyInvitation.create({
        data: {
          agencyId: id,
          email: body.email,
          role: body.role as any,
          inviteToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // TODO: Send invitation email

      reply.send({
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt,
        },
      });
    },
  });

  // Accept agency invitation
  fastify.post('/invitations/:token/accept', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { token } = request.params as { token: string };
      const { user } = request;

      const invitation = await fastify.prisma.agencyInvitation.findUnique({
        where: { inviteToken: token },
        include: {
          agency: true,
        },
      });

      if (!invitation) {
        return reply.status(404).send({ error: 'Invitation not found or expired' });
      }

      if (invitation.expiresAt < new Date()) {
        return reply.status(400).send({ error: 'Invitation has expired' });
      }

      if (invitation.acceptedAt) {
        return reply.status(400).send({ error: 'Invitation already accepted' });
      }

      if (invitation.email !== user.email) {
        return reply.status(403).send({ error: 'Invitation is for a different email address' });
      }

      if (user.role !== 'CREATOR') {
        return reply.status(400).send({ error: 'Only creators can accept agency invitations' });
      }

      if (user.isAgencyManaged) {
        return reply.status(400).send({ error: 'You are already managed by an agency' });
      }

      // Accept invitation
      await fastify.prisma.$transaction([
        // Mark invitation as accepted
        fastify.prisma.agencyInvitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        }),
        // Update user to be agency managed
        fastify.prisma.user.update({
          where: { id: user.id },
          data: {
            managingAgencyId: invitation.agencyId,
            isAgencyManaged: true,
          },
        }),
        // Create agency membership if not just a managed creator
        ...(invitation.role !== 'MEMBER' ? [
          fastify.prisma.agencyMembership.create({
            data: {
              agencyId: invitation.agencyId,
              userId: user.id,
              role: invitation.role as any,
              acceptedAt: new Date(),
            },
          })
        ] : []),
      ]);

      reply.send({
        message: 'Invitation accepted successfully',
        agency: invitation.agency,
      });
    },
  });

  // Get agency analytics
  fastify.get('/:id/analytics', {
    preHandler: requireAuth,
    handler: async (request: AuthenticatedRequest, reply) => {
      const { id } = request.params as { id: string };
      const { user } = request;

      const agency = await fastify.prisma.agency.findUnique({
        where: { id },
      });

      if (!agency) {
        return reply.status(404).send({ error: 'Agency not found' });
      }

      // Check access
      const hasAccess = 
        agency.ownerId === user.id ||
        user.role === 'ADMIN';

      if (!hasAccess) {
        return reply.status(403).send({ error: 'Access denied' });
      }

      // Get analytics data
      const [
        totalCreators,
        activeDeals,
        totalRevenue,
        completedDeals,
      ] = await Promise.all([
        fastify.prisma.user.count({
          where: {
            managingAgencyId: id,
            isAgencyManaged: true,
          },
        }),
        fastify.prisma.deal.count({
          where: {
            managingAgencyId: id,
            state: { in: ['FUNDED', 'RELEASED'] },
          },
        }),
        fastify.prisma.deal.aggregate({
          where: {
            managingAgencyId: id,
            state: 'RELEASED',
          },
          _sum: {
            amountTotal: true,
          },
        }),
        fastify.prisma.deal.count({
          where: {
            managingAgencyId: id,
            state: 'RELEASED',
          },
        }),
      ]);

      reply.send({
        totalCreators,
        activeDeals,
        totalRevenue: totalRevenue._sum.amountTotal || 0,
        completedDeals,
        creatorLimit: agency.maxCreators,
        tier: agency.tier,
      });
    },
  });
}
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '@prisma/client';
import { RefreshTokenService } from '../services/auth/RefreshTokenService.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['CREATOR', 'BRAND']),
  country: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  const refreshTokenService = new RefreshTokenService(fastify.prisma);
  // Register new user
  fastify.post('/register', {
    schema: {
      description: 'Register a new user account',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password', 'role'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', enum: ['CREATOR', 'BRAND'] },
          country: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                kycStatus: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password, role, country } = registerSchema.parse(request.body);

      // Check if active user already exists with this email
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.kycStatus !== 'DELETED' && !existingUser.deletedAt) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'User with this email already exists',
        });
      }

      // If a deleted account exists with this email, we need to handle it
      if (existingUser && (existingUser.kycStatus === 'DELETED' || existingUser.deletedAt)) {
        // Log the reuse of deleted account email
        await fastify.prisma.event.create({
          data: {
            actorUserId: null,
            type: 'user.deleted_email_reused',
            payload: {
              previousDeletedUserId: existingUser.id,
              newRegistrationEmail: email,
              newRole: role,
              timestamp: new Date().toISOString(),
              ipAddress: request.ip,
            },
          },
        });

        fastify.log.info(`Deleted account email being reused: ${email} (Previous User ID: ${existingUser.id})`);
        // Continue with registration - this is allowed
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await fastify.prisma.user.create({
        data: {
          email,
          hashedPassword,
          role: role as UserRole,
          country,
        },
        select: {
          id: true,
          email: true,
          role: true,
          kycStatus: true,
          country: true,
          createdAt: true,
        },
      });

      // Generate access token
      const accessToken = await reply.jwtSign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Generate refresh token
      const refreshToken = await refreshTokenService.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
      });

      // Log registration event
      await fastify.prisma.event.create({
        data: {
          actorUserId: user.id,
          type: 'user.registered',
          payload: {
            userId: user.id,
            email: user.email,
            role: user.role,
          },
        },
      });

      return reply.status(201).send({
        user,
        accessToken,
        refreshToken,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      fastify.log.error('Registration error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to register user',
      });
    }
  });

  // Login user
  fastify.post('/login', {
    schema: {
      description: 'Login with email and password',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                kycStatus: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      // Find user
      const user = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.hashedPassword) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // SECURITY: Check if account is deleted
      if (user.kycStatus === 'DELETED' || user.deletedAt) {
        // Log attempted access to deleted account
        await fastify.prisma.event.create({
          data: {
            actorUserId: null, // Don't link to deleted user
            type: 'security.deleted_account_access_attempt',
            payload: {
              deletedUserId: user.id,
              attemptEmail: email,
              timestamp: new Date().toISOString(),
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'] || 'Unknown',
            },
          },
        });

        fastify.log.warn(`Deleted account login attempt: ${email} (User ID: ${user.id})`);
        
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'This account has been deleted and cannot be accessed',
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.hashedPassword);
      if (!isValidPassword) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid email or password',
        });
      }

      // Generate access token
      const accessToken = await reply.jwtSign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Generate refresh token
      const refreshToken = await refreshTokenService.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
      });

      // Log login event
      await fastify.prisma.event.create({
        data: {
          actorUserId: user.id,
          type: 'user.logged_in',
          payload: {
            userId: user.id,
            email: user.email,
          },
        },
      });

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus,
          country: user.country,
        },
        accessToken,
        refreshToken,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      fastify.log.error('Login error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to login',
      });
    }
  });

  // Get current user profile
  fastify.get('/me', {
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    },
    schema: {
      description: 'Get current user profile',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                kycStatus: { type: 'string' },
                country: { type: 'string' },
                stripeAccountId: { type: 'string' },
                createdAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as any;

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          kycStatus: true,
          country: true,
          stripeAccountId: true,
          createdAt: true,
          deletedAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // SECURITY: Check if account is deleted
      if (user.kycStatus === 'DELETED' || user.deletedAt) {
        // Log attempted access to deleted account via token
        await fastify.prisma.event.create({
          data: {
            actorUserId: null,
            type: 'security.deleted_account_token_access_attempt',
            payload: {
              deletedUserId: user.id,
              timestamp: new Date().toISOString(),
              ipAddress: request.ip,
              userAgent: request.headers['user-agent'] || 'Unknown',
            },
          },
        });

        fastify.log.warn(`Deleted account token access attempt: User ID ${user.id}`);
        
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'This account has been deleted and cannot be accessed',
        });
      }

      return reply.send({ user });

    } catch (error) {
      fastify.log.error('Get user profile error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get user profile',
      });
    }
  });

  // Refresh token endpoint
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh access token using refresh token',
      tags: ['Authentication'],
      body: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                kycStatus: { type: 'string' },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { refreshToken } = refreshSchema.parse(request.body);

      // Refresh the access token using the refresh token
      const result = await refreshTokenService.refreshAccessToken(
        refreshToken,
        (payload: any) => reply.jwtSign(payload)
      );

      // Log refresh event
      await fastify.prisma.event.create({
        data: {
          actorUserId: result.user.id,
          type: 'user.token_refreshed',
          payload: {
            userId: result.user.id,
            email: result.user.email,
          },
        },
      });

      return reply.send({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.newRefreshToken,
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        if (error.message.includes('Invalid or expired') || 
            error.message.includes('User account no longer active')) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: error.message,
          });
        }
      }

      fastify.log.error('Refresh token error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to refresh token',
      });
    }
  });
}
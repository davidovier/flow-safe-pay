import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRole } from '@prisma/client';

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

export async function authRoutes(fastify: FastifyInstance) {
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
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password, role, country } = registerSchema.parse(request.body);

      // Check if user already exists
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(409).send({
          error: 'Conflict',
          message: 'User with this email already exists',
        });
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
      fastify.log.error('Get user profile error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get user profile',
      });
    }
  });

  // Refresh token endpoint (future implementation)
  fastify.post('/refresh', {
    schema: {
      description: 'Refresh access token',
      tags: ['Authentication'],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    // TODO: Implement refresh token logic with Redis storage
    return reply.status(501).send({
      error: 'Not Implemented',
      message: 'Refresh token functionality will be implemented in future version',
    });
  });
}
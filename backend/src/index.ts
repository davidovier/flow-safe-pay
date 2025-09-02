import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { authRoutes } from './routes/auth.js';
import { projectRoutes } from './routes/projects.js';
import { dealRoutes } from './routes/deals.js';
import { milestoneRoutes } from './routes/milestones.js';
import { webhookRoutes } from './routes/webhooks.js';
import { userRoutes } from './routes/users.js';
import { payoutRoutes } from './routes/payouts.js';
import { uploadRoutes } from './routes/uploads.js';

const prisma = new PrismaClient();

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          headers: request.headers,
          hostname: request.hostname,
          remoteAddress: request.ip,
        };
      },
    },
  },
});

async function startServer() {
  try {
    // Security middleware
    await fastify.register(helmet);
    await fastify.register(cors, {
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.APP_BASE_URL || 'https://flowpay.app']
        : true,
      credentials: true,
    });

    // Rate limiting
    await fastify.register(rateLimit, {
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
      timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    });

    // JWT authentication
    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'super-secret-key',
      sign: {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    });

    // File upload support
    await fastify.register(multipart, {
      limits: {
        fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10)) * 1024 * 1024,
        files: 5,
      },
    });

    // OpenAPI documentation
    await fastify.register(swagger, {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'FlowPay API',
          description: 'Escrow platform for creator deals with instant payouts',
          version: '1.0.0',
        },
        servers: [
          {
            url: process.env.API_BASE_URL || 'http://localhost:3001',
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    });

    await fastify.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'full',
        deepLinking: false,
      },
    });

    // Add Prisma to Fastify instance
    fastify.decorate('prisma', prisma);

    // Health check endpoint
    fastify.get('/health', async () => {
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'healthy', timestamp: new Date().toISOString() };
      } catch (error) {
        fastify.log.error('Health check failed:', error);
        throw new Error('Database connection failed');
      }
    });

    // Register routes
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(userRoutes, { prefix: '/users' });
    await fastify.register(projectRoutes, { prefix: '/projects' });
    await fastify.register(dealRoutes, { prefix: '/deals' });
    await fastify.register(milestoneRoutes, { prefix: '/milestones' });
    await fastify.register(payoutRoutes, { prefix: '/payouts' });
    await fastify.register(uploadRoutes, { prefix: '/uploads' });
    await fastify.register(webhookRoutes, { prefix: '/webhooks' });

    // Error handler
    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error);
      
      const statusCode = error.statusCode || 500;
      
      if (statusCode === 500) {
        reply.status(500).send({
          error: 'Internal Server Error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        });
      } else {
        reply.status(statusCode).send({
          error: error.name || 'Error',
          message: error.message,
        });
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      fastify.log.info(`Received ${signal}. Shutting down gracefully...`);
      
      try {
        await prisma.$disconnect();
        await fastify.close();
        process.exit(0);
      } catch (error) {
        fastify.log.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Start server
    const port = parseInt(process.env.PORT || '3001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    fastify.log.info(`🚀 FlowPay API server ready at http://${host}:${port}`);
    fastify.log.info(`📚 API documentation available at http://${host}:${port}/docs`);

  } catch (error) {
    fastify.log.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

// Type declarations for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
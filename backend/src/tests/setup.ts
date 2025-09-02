import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import Fastify from 'fastify';

// Global test database
let prismaClient: PrismaClient;
let fastifyApp: any;

declare global {
  var testPrisma: PrismaClient;
  var testFastify: any;
}

beforeAll(async () => {
  // Initialize test database
  console.log('Setting up test database...');
  
  try {
    // Reset test database
    execSync('npx prisma migrate reset --force --skip-seed', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit',
    });
    
    // Run migrations
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'inherit',
    });
  } catch (error) {
    console.warn('Database setup failed, continuing with existing DB:', error);
  }

  // Initialize Prisma client for tests
  prismaClient = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.TEST_VERBOSE === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

  await prismaClient.$connect();
  
  // Make Prisma client available globally in tests
  global.testPrisma = prismaClient;

  console.log('Test setup complete');
});

beforeEach(async () => {
  // Clean up data before each test
  if (prismaClient) {
    // Delete all records in reverse order to handle foreign keys
    await prismaClient.event.deleteMany();
    await prismaClient.deliverable.deleteMany();
    await prismaClient.contract.deleteMany();
    await prismaClient.dispute.deleteMany();
    await prismaClient.payout.deleteMany();
    await prismaClient.milestone.deleteMany();
    await prismaClient.deal.deleteMany();
    await prismaClient.project.deleteMany();
    await prismaClient.user.deleteMany();
  }
});

afterEach(async () => {
  // Close Fastify instance if created in test
  if (global.testFastify) {
    await global.testFastify.close();
    global.testFastify = null;
  }
});

afterAll(async () => {
  // Cleanup
  if (prismaClient) {
    await prismaClient.$disconnect();
  }
  
  if (fastifyApp) {
    await fastifyApp.close();
  }
});

// Helper functions for tests
export const createTestUser = async (overrides: any = {}) => {
  return await global.testPrisma.user.create({
    data: {
      email: 'test@example.com',
      role: 'CREATOR',
      kycStatus: 'PENDING',
      ...overrides,
    },
  });
};

export const createTestProject = async (brandId: string, overrides: any = {}) => {
  return await global.testPrisma.project.create({
    data: {
      brandId,
      title: 'Test Project',
      description: 'A test project',
      ...overrides,
    },
  });
};

export const createTestDeal = async (projectId: string, creatorId: string, overrides: any = {}) => {
  return await global.testPrisma.deal.create({
    data: {
      projectId,
      creatorId,
      currency: 'usd',
      amountTotal: 10000, // $100.00
      ...overrides,
    },
  });
};

export const createTestFastifyInstance = async () => {
  const fastify = Fastify({ logger: false });

  // Add test-specific plugins
  await fastify.register(async (fastify) => {
    fastify.decorate('prisma', global.testPrisma);
  });

  // Add JWT plugin for authentication tests
  await fastify.register(require('@fastify/jwt'), {
    secret: process.env.JWT_SECRET || 'test-jwt-secret',
  });

  global.testFastify = fastify;
  return fastify;
};

export const generateTestJWT = async (userId: string, role: string = 'CREATOR') => {
  const fastify = global.testFastify;
  if (!fastify) {
    throw new Error('Test Fastify instance not initialized');
  }

  return fastify.jwt.sign({
    id: userId,
    role,
    iat: Math.floor(Date.now() / 1000),
  });
};

export const createAuthHeaders = async (userId: string, role: string = 'CREATOR') => {
  const token = await generateTestJWT(userId, role);
  return {
    authorization: `Bearer ${token}`,
  };
};
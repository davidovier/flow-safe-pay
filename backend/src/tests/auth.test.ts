import { describe, it, expect, beforeEach } from 'vitest';
import { authRoutes } from '../routes/auth.js';
import { createTestFastifyInstance, createTestUser } from './setup.js';
import bcrypt from 'bcryptjs';

describe('Authentication Routes', () => {
  let fastify: any;

  beforeEach(async () => {
    fastify = await createTestFastifyInstance();
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.ready();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CREATOR',
        country: 'US',
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(201);
      
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('token');
      expect(body.user.email).toBe(userData.email);
      expect(body.user.role).toBe(userData.role);
      expect(body.user).not.toHaveProperty('hashedPassword');
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CREATOR',
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation Error');
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'user@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CREATOR',
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation Error');
    });

    it('should reject registration with duplicate email', async () => {
      // Create user first
      await createTestUser({
        email: 'existing@example.com',
        hashedPassword: await bcrypt.hash('password', 10),
      });

      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CREATOR',
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/register',
        payload: userData,
      });

      expect(response.statusCode).toBe(400);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await createTestUser({
        email: 'test@example.com',
        hashedPassword,
        role: 'CREATOR',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: user.email,
          password,
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('user');
      expect(body).toHaveProperty('token');
      expect(body.user.id).toBe(user.id);
      expect(body.user.email).toBe(user.email);
      expect(body.user).not.toHaveProperty('hashedPassword');
    });

    it('should reject login with invalid email', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'password',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should reject login with invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      
      const user = await createTestUser({
        email: 'test@example.com',
        hashedPassword,
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: user.email,
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should reject login for deleted account', async () => {
      const password = 'SecurePass123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await createTestUser({
        email: 'deleted@example.com',
        hashedPassword,
        deletedAt: new Date(),
        kycStatus: 'DELETED',
      });

      const response = await fastify.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: user.email,
          password,
        },
      });

      expect(response.statusCode).toBe(401);
      
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
      expect(body.message).toContain('deleted');
    });
  });

  describe('GET /auth/me', () => {
    it('should return user profile when authenticated', async () => {
      const user = await createTestUser({
        email: 'test@example.com',
        role: 'CREATOR',
      });

      const token = fastify.jwt.sign({
        id: user.id,
        role: user.role,
      });

      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      expect(response.statusCode).toBe(200);
      
      const body = JSON.parse(response.body);
      expect(body.id).toBe(user.id);
      expect(body.email).toBe(user.email);
      expect(body.role).toBe(user.role);
      expect(body).not.toHaveProperty('hashedPassword');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/auth/me',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });
});
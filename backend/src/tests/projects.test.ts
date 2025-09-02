import { describe, it, expect, beforeEach } from 'vitest';
import { projectRoutes } from '../routes/projects.js';
import { createTestFastifyInstance, createTestUser, createTestProject, createAuthHeaders } from './setup.js';

describe('Project Routes', () => {
  let fastify: any;
  let brandUser: any;
  let creatorUser: any;

  beforeEach(async () => {
    fastify = await createTestFastifyInstance();
    await fastify.register(projectRoutes, { prefix: '/projects' });
    await fastify.ready();

    // Create test users
    brandUser = await createTestUser({
      email: 'brand@example.com',
      role: 'BRAND',
    });

    creatorUser = await createTestUser({
      email: 'creator@example.com',
      role: 'CREATOR',
    });
  });

  describe('GET /projects', () => {
    it('should return projects for authenticated brand', async () => {
      // Create test projects
      await createTestProject(brandUser.id, { title: 'Project 1' });
      await createTestProject(brandUser.id, { title: 'Project 2' });

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects',
        headers,
      });

      expect(response.statusCode).toBe(200);

      const projects = JSON.parse(response.body);
      expect(projects).toHaveLength(2);
      expect(projects[0]).toHaveProperty('title');
      expect(projects[0]).toHaveProperty('_count');
    });

    it('should return empty array when no projects exist', async () => {
      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects',
        headers,
      });

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toHaveLength(0);
    });

    it('should reject creators trying to view projects', async () => {
      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects',
        headers,
      });

      expect(response.statusCode).toBe(403);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/projects',
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /projects/:id', () => {
    it('should return specific project with deals', async () => {
      const project = await createTestProject(brandUser.id, {
        title: 'Test Project',
        description: 'A test project',
      });

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${project.id}`,
        headers,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.id).toBe(project.id);
      expect(body.title).toBe('Test Project');
      expect(body).toHaveProperty('deals');
    });

    it('should return 404 for non-existent project', async () => {
      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'GET',
        url: '/projects/non-existent-id',
        headers,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject access to other brands projects', async () => {
      const otherBrand = await createTestUser({
        email: 'otherbrand@example.com',
        role: 'BRAND',
      });

      const project = await createTestProject(otherBrand.id);
      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'GET',
        url: `/projects/${project.id}`,
        headers,
      });

      expect(response.statusCode).toBe(404); // Should appear as not found for security
    });
  });

  describe('POST /projects', () => {
    it('should create new project successfully', async () => {
      const projectData = {
        title: 'New Project',
        description: 'A brand new project',
        status: 'active',
      };

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers,
        payload: projectData,
      });

      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body);
      expect(body.title).toBe(projectData.title);
      expect(body.description).toBe(projectData.description);
      expect(body.brandId).toBe(brandUser.id);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('createdAt');
    });

    it('should create project with minimal data', async () => {
      const projectData = {
        title: 'Minimal Project',
      };

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers,
        payload: projectData,
      });

      expect(response.statusCode).toBe(201);

      const body = JSON.parse(response.body);
      expect(body.title).toBe(projectData.title);
      expect(body.status).toBe('active'); // Default value
      expect(body.description).toBeNull();
    });

    it('should reject project creation with invalid data', async () => {
      const projectData = {
        // Missing required title
        description: 'No title project',
      };

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers,
        payload: projectData,
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Validation Error');
    });

    it('should reject creators trying to create projects', async () => {
      const projectData = {
        title: 'Creator Project',
      };

      const headers = await createAuthHeaders(creatorUser.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/projects',
        headers,
        payload: projectData,
      });

      expect(response.statusCode).toBe(403);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
    });
  });

  describe('PUT /projects/:id', () => {
    it('should update project successfully', async () => {
      const project = await createTestProject(brandUser.id, {
        title: 'Original Title',
        description: 'Original Description',
      });

      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        status: 'paused',
      };

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'PUT',
        url: `/projects/${project.id}`,
        headers,
        payload: updateData,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.title).toBe(updateData.title);
      expect(body.description).toBe(updateData.description);
      expect(body.status).toBe(updateData.status);
    });

    it('should return 404 for non-existent project', async () => {
      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'PUT',
        url: '/projects/non-existent-id',
        headers,
        payload: { title: 'Updated' },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject access to other brands projects', async () => {
      const otherBrand = await createTestUser({
        email: 'otherbrand@example.com',
        role: 'BRAND',
      });

      const project = await createTestProject(otherBrand.id);
      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'PUT',
        url: `/projects/${project.id}`,
        headers,
        payload: { title: 'Hacked' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should archive project successfully', async () => {
      const project = await createTestProject(brandUser.id);
      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/projects/${project.id}`,
        headers,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toContain('archived');

      // Verify project was archived
      const updatedProject = await global.testPrisma.project.findUnique({
        where: { id: project.id },
      });
      expect(updatedProject?.status).toBe('archived');
    });

    it('should prevent deletion of project with active deals', async () => {
      const project = await createTestProject(brandUser.id);
      
      // Create an active deal
      await global.testPrisma.deal.create({
        data: {
          projectId: project.id,
          creatorId: creatorUser.id,
          amountTotal: 10000,
          state: 'FUNDED',
        },
      });

      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/projects/${project.id}`,
        headers,
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toContain('active funded deals');
    });

    it('should return 404 for non-existent project', async () => {
      const headers = await createAuthHeaders(brandUser.id, 'BRAND');

      const response = await fastify.inject({
        method: 'DELETE',
        url: '/projects/non-existent-id',
        headers,
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
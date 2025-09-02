import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.string().default('active'),
});

const updateProjectSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});

export async function projectRoutes(fastify: FastifyInstance) {
  
  // Middleware to require authentication
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Get all projects for authenticated user (brand only)
  fastify.get('/', {
    preHandler: requireAuth,
    schema: {
      description: 'Get all projects for the authenticated brand',
      tags: ['Projects'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              brandId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              status: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              _count: {
                type: 'object',
                properties: {
                  deals: { type: 'number' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    
    // Only brands can view projects
    if (user.role !== 'BRAND') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only brands can manage projects'
      });
    }

    try {
      const projects = await fastify.prisma.project.findMany({
        where: {
          brandId: user.id
        },
        include: {
          _count: {
            select: {
              deals: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return projects;
    } catch (error) {
      fastify.log.error('Error fetching projects:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch projects'
      });
    }
  });

  // Get a specific project by ID
  fastify.get('/:id', {
    preHandler: requireAuth,
    schema: {
      description: 'Get a specific project by ID',
      tags: ['Projects'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            brandId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            deals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  state: { type: 'string' },
                  amountTotal: { type: 'number' },
                  currency: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  creator: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as any;

    try {
      const project = await fastify.prisma.project.findFirst({
        where: {
          id,
          brandId: user.id // Ensure user owns this project
        },
        include: {
          deals: {
            include: {
              creator: {
                select: {
                  id: true,
                  email: true
                }
              }
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        }
      });

      if (!project) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found or access denied'
        });
      }

      return project;
    } catch (error) {
      fastify.log.error('Error fetching project:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch project'
      });
    }
  });

  // Create new project
  fastify.post('/', {
    preHandler: requireAuth,
    schema: {
      description: 'Create a new project',
      tags: ['Projects'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string' },
          status: { type: 'string', default: 'active' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            brandId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as any;
    
    // Only brands can create projects
    if (user.role !== 'BRAND') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only brands can create projects'
      });
    }

    try {
      const validatedData = createProjectSchema.parse(request.body);
      
      const project = await fastify.prisma.project.create({
        data: {
          ...validatedData,
          brandId: user.id
        }
      });

      // Log project creation event
      await fastify.prisma.event.create({
        data: {
          actorUserId: user.id,
          type: 'project.created',
          payload: {
            projectId: project.id,
            title: project.title,
            timestamp: new Date().toISOString()
          }
        }
      });

      return reply.status(201).send(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid input data'
        });
      }

      fastify.log.error('Error creating project:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create project'
      });
    }
  });

  // Update project
  fastify.put('/:id', {
    preHandler: requireAuth,
    schema: {
      description: 'Update an existing project',
      tags: ['Projects'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 255 },
          description: { type: 'string' },
          status: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            brandId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            status: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as any;

    try {
      // Verify project exists and user owns it
      const existingProject = await fastify.prisma.project.findFirst({
        where: {
          id,
          brandId: user.id
        }
      });

      if (!existingProject) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found or access denied'
        });
      }

      const validatedData = updateProjectSchema.parse(request.body);
      
      const project = await fastify.prisma.project.update({
        where: { id },
        data: validatedData
      });

      // Log project update event
      await fastify.prisma.event.create({
        data: {
          actorUserId: user.id,
          type: 'project.updated',
          payload: {
            projectId: project.id,
            changes: validatedData,
            timestamp: new Date().toISOString()
          }
        }
      });

      return project;
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: error.errors[0]?.message || 'Invalid input data'
        });
      }

      fastify.log.error('Error updating project:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update project'
      });
    }
  });

  // Delete project (soft delete by setting status to 'archived')
  fastify.delete('/:id', {
    preHandler: requireAuth,
    schema: {
      description: 'Archive a project (soft delete)',
      tags: ['Projects'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const user = request.user as any;

    try {
      // Check if project exists and user owns it
      const existingProject = await fastify.prisma.project.findFirst({
        where: {
          id,
          brandId: user.id
        },
        include: {
          deals: {
            where: {
              state: {
                in: ['FUNDED', 'DISPUTED']
              }
            }
          }
        }
      });

      if (!existingProject) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Project not found or access denied'
        });
      }

      // Prevent deletion if there are active funded deals
      if (existingProject.deals.length > 0) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Cannot archive project with active funded deals'
        });
      }

      // Soft delete by updating status to 'archived'
      await fastify.prisma.project.update({
        where: { id },
        data: { status: 'archived' }
      });

      // Log project deletion event
      await fastify.prisma.event.create({
        data: {
          actorUserId: user.id,
          type: 'project.archived',
          payload: {
            projectId: id,
            title: existingProject.title,
            timestamp: new Date().toISOString()
          }
        }
      });

      return { message: 'Project archived successfully' };
    } catch (error) {
      fastify.log.error('Error archiving project:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to archive project'
      });
    }
  });
}
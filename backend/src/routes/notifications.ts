import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { NotificationService } from '../services/websocket/NotificationService.js';
import { getWebSocketServer } from '../server.js';

const getNotificationsSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  includeRead: z.boolean().optional().default(false),
  types: z.array(z.enum([
    'DEAL_CREATED',
    'DEAL_ACCEPTED', 
    'DEAL_FUNDED',
    'MILESTONE_SUBMITTED',
    'MILESTONE_APPROVED',
    'MILESTONE_REJECTED',
    'MILESTONE_AUTO_RELEASED',
    'PAYMENT_RECEIVED',
    'PAYMENT_FAILED',
    'KYC_APPROVED',
    'KYC_REJECTED',
    'DISPUTE_CREATED',
    'DISPUTE_RESOLVED',
    'REMINDER',
    'SYSTEM_ALERT',
  ])).optional(),
});

const updatePreferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  inApp: z.boolean().optional(),
  types: z.record(z.object({
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
  })).optional(),
});

const systemAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  actionUrl: z.string().url().optional(),
  targetRoles: z.array(z.enum(['CREATOR', 'BRAND', 'ADMIN'])).optional(),
});

export async function notificationRoutes(fastify: FastifyInstance) {
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const { role } = request.user as any;
    if (role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Admin access required',
      });
    }
  };

  // Get user notifications
  fastify.get('/', {
    preHandler: requireAuth,
    schema: {
      description: 'Get user notifications',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          includeRead: { type: 'boolean', default: false },
          types: { 
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as any;
      const query = getNotificationsSchema.parse(request.query);

      const wsServer = getWebSocketServer();
      const notificationService = new NotificationService(wsServer);

      const notifications = await notificationService.getUserNotifications(userId, query);

      return reply.send({
        notifications,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: notifications.length,
        },
      });
    } catch (error: any) {
      fastify.log.error('Get notifications error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get notifications',
      });
    }
  });

  // Mark notification as read
  fastify.patch('/:notificationId/read', {
    preHandler: requireAuth,
    schema: {
      description: 'Mark notification as read',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          notificationId: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as any;
      const { notificationId } = request.params as any;

      const wsServer = getWebSocketServer();
      const notificationService = new NotificationService(wsServer);

      await notificationService.markAsRead(notificationId, userId);

      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error('Mark notification as read error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to mark notification as read',
      });
    }
  });

  // Mark all notifications as read
  fastify.patch('/mark-all-read', {
    preHandler: requireAuth,
    schema: {
      description: 'Mark all notifications as read',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as any;

      const wsServer = getWebSocketServer();
      const notificationService = new NotificationService(wsServer);

      await notificationService.markAllAsRead(userId);

      return reply.send({ success: true });
    } catch (error: any) {
      fastify.log.error('Mark all notifications as read error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to mark all notifications as read',
      });
    }
  });

  // Get notification preferences
  fastify.get('/preferences', {
    preHandler: requireAuth,
    schema: {
      description: 'Get user notification preferences',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as any;

      const user = await fastify.prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      const preferences = user?.notificationPreferences || {
        email: true,
        push: true,
        inApp: true,
        types: {},
      };

      return reply.send({ preferences });
    } catch (error: any) {
      fastify.log.error('Get notification preferences error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get notification preferences',
      });
    }
  });

  // Update notification preferences
  fastify.put('/preferences', {
    preHandler: requireAuth,
    schema: {
      description: 'Update user notification preferences',
      tags: ['Notifications'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          email: { type: 'boolean' },
          push: { type: 'boolean' },
          inApp: { type: 'boolean' },
          types: {
            type: 'object',
            additionalProperties: {
              type: 'object',
              properties: {
                email: { type: 'boolean' },
                push: { type: 'boolean' },
                inApp: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as any;
      const preferences = updatePreferencesSchema.parse(request.body);

      const wsServer = getWebSocketServer();
      const notificationService = new NotificationService(wsServer);

      await notificationService.updateUserPreferences(userId, preferences);

      return reply.send({ success: true });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      fastify.log.error('Update notification preferences error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update notification preferences',
      });
    }
  });

  // Get real-time stats (admin only)
  fastify.get('/stats', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Get real-time notification and WebSocket stats',
      tags: ['Notifications', 'Admin'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const wsServer = getWebSocketServer();

      // Get WebSocket stats
      const connectedUsers = wsServer.getConnectedUsers();
      const presence = wsServer.getAllPresence();

      // Get notification stats from database
      const [totalNotifications, unreadCount, todayNotifications] = await Promise.all([
        fastify.prisma.notification.count(),
        fastify.prisma.notification.count({
          where: { readAt: null },
        }),
        fastify.prisma.notification.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

      return reply.send({
        websocket: {
          connectedUsers: connectedUsers.length,
          connectedUserIds: connectedUsers,
          presence: presence.length,
        },
        notifications: {
          total: totalNotifications,
          unread: unreadCount,
          today: todayNotifications,
        },
        timestamp: new Date(),
      });
    } catch (error: any) {
      fastify.log.error('Get notification stats error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get notification stats',
      });
    }
  });

  // Send system announcement (admin only)
  fastify.post('/system-announcement', {
    preHandler: [requireAuth, requireAdmin],
    schema: {
      description: 'Send system-wide announcement',
      tags: ['Notifications', 'Admin'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          message: { type: 'string', minLength: 1, maxLength: 1000 },
          priority: { 
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            default: 'MEDIUM',
          },
          actionUrl: { type: 'string', format: 'url' },
          targetRoles: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['CREATOR', 'BRAND', 'ADMIN'],
            },
          },
        },
        required: ['title', 'message'],
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const announcementData = systemAnnouncementSchema.parse(request.body);

      const wsServer = getWebSocketServer();
      const notificationService = new NotificationService(wsServer);

      await notificationService.broadcastSystemAnnouncement(announcementData);

      return reply.send({ 
        success: true,
        message: 'System announcement sent successfully',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid request data',
          details: error.errors,
        });
      }

      fastify.log.error('Send system announcement error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to send system announcement',
      });
    }
  });

  // Test notification (development only)
  if (process.env.NODE_ENV === 'development') {
    fastify.post('/test', {
      preHandler: requireAuth,
      schema: {
        description: 'Send test notification (development only)',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
          },
          required: ['type', 'title', 'message'],
        },
      },
    }, async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.user as any;
        const { type, title, message } = request.body as any;

        const wsServer = getWebSocketServer();
        const notificationService = new NotificationService(wsServer);

        await notificationService.createNotification({
          type: type as any,
          title,
          message,
          userId,
          priority: 'MEDIUM',
        });

        return reply.send({ 
          success: true,
          message: 'Test notification sent successfully',
        });
      } catch (error: any) {
        fastify.log.error('Send test notification error:', error);
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to send test notification',
        });
      }
    });
  }
}
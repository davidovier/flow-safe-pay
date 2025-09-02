import { PrismaClient, NotificationType } from '@prisma/client';
import { WebSocketServer } from './WebSocketServer.js';
import { logger } from '../../utils/logger.js';
import { EmailService } from '../email/EmailService.js';

const prisma = new PrismaClient();

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  actorUserId?: string;
  dealId?: string;
  milestoneId?: string;
  projectId?: string;
  deliverableId?: string;
  metadata?: Record<string, any>;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  actionUrl?: string;
  expiresAt?: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    [key in NotificationType]?: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}

export class NotificationService {
  private wsServer: WebSocketServer;
  private emailService: EmailService;

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
    this.emailService = new EmailService();
  }

  /**
   * Create and send a notification
   */
  async createNotification(data: NotificationData): Promise<void> {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          type: data.type,
          title: data.title,
          message: data.message,
          userId: data.userId,
          actorUserId: data.actorUserId,
          dealId: data.dealId,
          milestoneId: data.milestoneId,
          projectId: data.projectId,
          deliverableId: data.deliverableId,
          metadata: data.metadata || {},
          priority: data.priority || 'MEDIUM',
          actionUrl: data.actionUrl,
          expiresAt: data.expiresAt,
        },
        include: {
          user: {
            select: { 
              id: true, 
              email: true, 
              notificationPreferences: true,
              firstName: true,
              lastName: true,
            },
          },
          actor: {
            select: { 
              id: true, 
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Get user preferences
      const preferences = await this.getUserNotificationPreferences(data.userId);
      
      // Send real-time notification if user is connected and has in-app notifications enabled
      if (preferences.inApp && this.shouldSendNotificationType(preferences, data.type, 'inApp')) {
        this.sendRealTimeNotification(notification);
      }

      // Send email notification if enabled
      if (preferences.email && this.shouldSendNotificationType(preferences, data.type, 'email')) {
        await this.sendEmailNotification(notification);
      }

      // TODO: Send push notification if enabled
      if (preferences.push && this.shouldSendNotificationType(preferences, data.type, 'push')) {
        await this.sendPushNotification(notification);
      }

      // Update unread count for user
      await this.updateUnreadCount(data.userId);

      logger.info(`Notification created and sent: ${notification.id} for user ${data.userId}`);
    } catch (error: any) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  /**
   * Send real-time notification via WebSocket
   */
  private sendRealTimeNotification(notification: any): void {
    const payload = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      actionUrl: notification.actionUrl,
      createdAt: notification.createdAt,
      metadata: notification.metadata,
      actor: notification.actor ? {
        name: `${notification.actor.firstName || ''} ${notification.actor.lastName || ''}`.trim() || notification.actor.email,
        email: notification.actor.email,
      } : null,
    };

    // Send to specific user
    this.wsServer.sendToUser(notification.userId, 'notification', payload);

    // Also broadcast to relevant rooms for real-time updates
    if (notification.dealId) {
      this.wsServer.broadcastToRoom(`deal:${notification.dealId}`, 'deal-notification', payload);
    }
    if (notification.milestoneId) {
      this.wsServer.broadcastToRoom(`milestone:${notification.milestoneId}`, 'milestone-notification', payload);
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(notification: any): Promise<void> {
    try {
      const user = notification.user;
      if (!user?.email) return;

      const emailData = {
        to: user.email,
        subject: notification.title,
        template: this.getEmailTemplate(notification.type),
        data: {
          userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          actorName: notification.actor ? 
            `${notification.actor.firstName || ''} ${notification.actor.lastName || ''}`.trim() || notification.actor.email : 
            'FlowPay',
          metadata: notification.metadata,
        },
      };

      await this.emailService.sendEmail(emailData);
    } catch (error: any) {
      logger.error('Failed to send email notification:', error);
      // Don't throw - email failures shouldn't break notification creation
    }
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(notification: any): Promise<void> {
    // TODO: Implement push notification service
    // This would integrate with services like Firebase Cloud Messaging, Apple Push Notification Service, etc.
    logger.info(`Push notification would be sent: ${notification.id}`);
  }

  /**
   * Get user notification preferences
   */
  private async getUserNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { notificationPreferences: true },
      });

      const preferences = user?.notificationPreferences as any || {};
      
      return {
        email: preferences.email ?? true,
        push: preferences.push ?? true,
        inApp: preferences.inApp ?? true,
        types: preferences.types || {},
      };
    } catch (error: any) {
      logger.error('Failed to get user notification preferences:', error);
      // Return default preferences
      return {
        email: true,
        push: true,
        inApp: true,
        types: {},
      };
    }
  }

  /**
   * Check if notification type should be sent via specific channel
   */
  private shouldSendNotificationType(
    preferences: NotificationPreferences, 
    type: NotificationType, 
    channel: 'email' | 'push' | 'inApp'
  ): boolean {
    const typePrefs = preferences.types[type];
    if (typePrefs) {
      return typePrefs[channel] ?? preferences[channel];
    }
    return preferences[channel];
  }

  /**
   * Get email template for notification type
   */
  private getEmailTemplate(type: NotificationType): string {
    const templates = {
      'DEAL_CREATED': 'deal-created',
      'DEAL_ACCEPTED': 'deal-accepted',
      'DEAL_FUNDED': 'deal-funded',
      'MILESTONE_SUBMITTED': 'milestone-submitted',
      'MILESTONE_APPROVED': 'milestone-approved',
      'MILESTONE_REJECTED': 'milestone-rejected',
      'MILESTONE_AUTO_RELEASED': 'milestone-auto-released',
      'PAYMENT_RECEIVED': 'payment-received',
      'PAYMENT_FAILED': 'payment-failed',
      'KYC_APPROVED': 'kyc-approved',
      'KYC_REJECTED': 'kyc-rejected',
      'DISPUTE_CREATED': 'dispute-created',
      'DISPUTE_RESOLVED': 'dispute-resolved',
      'REMINDER': 'reminder',
      'SYSTEM_ALERT': 'system-alert',
    };

    return templates[type] || 'default';
  }

  /**
   * Update unread notification count for user
   */
  private async updateUnreadCount(userId: string): Promise<void> {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          readAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      // Send real-time unread count update
      this.wsServer.sendToUser(userId, 'unread-count', { count });
    } catch (error: any) {
      logger.error('Failed to update unread count:', error);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await prisma.notification.update({
        where: {
          id: notificationId,
          userId, // Ensure user can only mark their own notifications
        },
        data: {
          readAt: new Date(),
        },
      });

      // Update unread count
      await this.updateUnreadCount(userId);
    } catch (error: any) {
      logger.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      // Update unread count
      await this.updateUnreadCount(userId);
    } catch (error: any) {
      logger.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get notifications for user
   */
  async getUserNotifications(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      includeRead?: boolean;
      types?: NotificationType[];
    } = {}
  ): Promise<any[]> {
    try {
      const {
        limit = 50,
        offset = 0,
        includeRead = true,
        types,
      } = options;

      const notifications = await prisma.notification.findMany({
        where: {
          userId,
          ...(types && { type: { in: types } }),
          ...(!includeRead && { readAt: null }),
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      });

      return notifications;
    } catch (error: any) {
      logger.error('Failed to get user notifications:', error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          notificationPreferences: preferences,
        },
      });

      logger.info(`Updated notification preferences for user ${userId}`);
    } catch (error: any) {
      logger.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired notifications`);
    } catch (error: any) {
      logger.error('Failed to cleanup expired notifications:', error);
    }
  }

  /**
   * Broadcast system announcement to all users
   */
  async broadcastSystemAnnouncement(data: {
    title: string;
    message: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    actionUrl?: string;
    targetRoles?: ('CREATOR' | 'BRAND' | 'ADMIN')[];
  }): Promise<void> {
    try {
      const { title, message, priority = 'MEDIUM', actionUrl, targetRoles } = data;
      
      // Get all users or users with specific roles
      const users = await prisma.user.findMany({
        where: targetRoles ? { role: { in: targetRoles } } : {},
        select: { id: true, role: true },
      });

      // Create notifications for all users
      const notifications = users.map(user => ({
        type: 'SYSTEM_ALERT' as NotificationType,
        title,
        message,
        userId: user.id,
        priority,
        actionUrl,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      }));

      // Batch create notifications
      await prisma.notification.createMany({
        data: notifications,
      });

      // Broadcast real-time to connected users
      const payload = {
        type: 'SYSTEM_ALERT',
        title,
        message,
        priority,
        actionUrl,
        createdAt: new Date(),
      };

      if (targetRoles) {
        targetRoles.forEach(role => {
          this.wsServer.sendToRole(role, 'system-announcement', payload);
        });
      } else {
        this.wsServer.broadcast('system-announcement', payload);
      }

      logger.info(`System announcement broadcasted to ${users.length} users`);
    } catch (error: any) {
      logger.error('Failed to broadcast system announcement:', error);
      throw error;
    }
  }
}
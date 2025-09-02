import { NotificationType } from '@prisma/client';
import { NotificationService } from '../services/websocket/NotificationService.js';
import { getWebSocketServer } from '../index.js';
import { logger } from './logger.js';

/**
 * Helper functions to create and send notifications for common events
 */

export class NotificationHelpers {
  private static getNotificationService(): NotificationService {
    const wsServer = getWebSocketServer();
    return new NotificationService(wsServer);
  }

  // Deal notifications
  static async notifyDealCreated(data: {
    dealId: string;
    brandId: string;
    creatorId: string;
    projectTitle: string;
    amount: number;
    currency: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      // Notify creator
      await notificationService.createNotification({
        type: 'DEAL_CREATED' as NotificationType,
        title: 'New Deal Created! 🤝',
        message: `You have a new deal for "${data.projectTitle}" worth ${this.formatAmount(data.amount, data.currency)}`,
        userId: data.creatorId,
        actorUserId: data.brandId,
        dealId: data.dealId,
        priority: 'MEDIUM',
        actionUrl: `/deals/${data.dealId}`,
      });
    } catch (error: any) {
      logger.error('Failed to send deal created notification:', error);
    }
  }

  static async notifyDealAccepted(data: {
    dealId: string;
    brandId: string;
    creatorId: string;
    projectTitle: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      // Notify brand
      await notificationService.createNotification({
        type: 'DEAL_ACCEPTED' as NotificationType,
        title: 'Deal Accepted! ✅',
        message: `Your deal for "${data.projectTitle}" has been accepted and is ready for funding`,
        userId: data.brandId,
        actorUserId: data.creatorId,
        dealId: data.dealId,
        priority: 'HIGH',
        actionUrl: `/deals/${data.dealId}`,
      });
    } catch (error: any) {
      logger.error('Failed to send deal accepted notification:', error);
    }
  }

  static async notifyDealFunded(data: {
    dealId: string;
    brandId: string;
    creatorId: string;
    projectTitle: string;
    amount: number;
    currency: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      // Notify creator
      await notificationService.createNotification({
        type: 'DEAL_FUNDED' as NotificationType,
        title: 'Deal Funded! 💰',
        message: `"${data.projectTitle}" has been funded with ${this.formatAmount(data.amount, data.currency)}. You can now start working on milestones!`,
        userId: data.creatorId,
        actorUserId: data.brandId,
        dealId: data.dealId,
        priority: 'HIGH',
        actionUrl: `/deals/${data.dealId}`,
      });
    } catch (error: any) {
      logger.error('Failed to send deal funded notification:', error);
    }
  }

  // Milestone notifications
  static async notifyMilestoneSubmitted(data: {
    milestoneId: string;
    dealId: string;
    brandId: string;
    creatorId: string;
    milestoneTitle: string;
    projectTitle: string;
    amount: number;
    currency: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      // Notify brand
      await notificationService.createNotification({
        type: 'MILESTONE_SUBMITTED' as NotificationType,
        title: 'Deliverable Submitted! 📤',
        message: `A deliverable for "${data.milestoneTitle}" has been submitted for review in "${data.projectTitle}"`,
        userId: data.brandId,
        actorUserId: data.creatorId,
        dealId: data.dealId,
        milestoneId: data.milestoneId,
        priority: 'HIGH',
        actionUrl: `/milestones/${data.milestoneId}`,
      });
    } catch (error: any) {
      logger.error('Failed to send milestone submitted notification:', error);
    }
  }

  static async notifyMilestoneApproved(data: {
    milestoneId: string;
    dealId: string;
    brandId: string;
    creatorId: string;
    milestoneTitle: string;
    amount: number;
    currency: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      // Notify creator
      await notificationService.createNotification({
        type: 'MILESTONE_APPROVED' as NotificationType,
        title: 'Milestone Approved! ✅',
        message: `Your deliverable for "${data.milestoneTitle}" has been approved! Payment of ${this.formatAmount(data.amount, data.currency)} is being processed.`,
        userId: data.creatorId,
        actorUserId: data.brandId,
        dealId: data.dealId,
        milestoneId: data.milestoneId,
        priority: 'HIGH',
        actionUrl: `/milestones/${data.milestoneId}`,
      });
    } catch (error: any) {
      logger.error('Failed to send milestone approved notification:', error);
    }
  }

  static async notifyMilestoneRejected(data: {
    milestoneId: string;
    dealId: string;
    brandId: string;
    creatorId: string;
    milestoneTitle: string;
    feedback?: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      // Notify creator
      await notificationService.createNotification({
        type: 'MILESTONE_REJECTED' as NotificationType,
        title: 'Revision Requested 📝',
        message: `Your deliverable for "${data.milestoneTitle}" needs revisions. ${data.feedback ? `Feedback: ${data.feedback}` : 'Please check the details and resubmit.'}`,
        userId: data.creatorId,
        actorUserId: data.brandId,
        dealId: data.dealId,
        milestoneId: data.milestoneId,
        priority: 'HIGH',
        actionUrl: `/milestones/${data.milestoneId}`,
      });
    } catch (error: any) {
      logger.error('Failed to send milestone rejected notification:', error);
    }
  }

  static async notifyMilestoneAutoReleased(data: {
    milestoneId: string;
    dealId: string;
    creatorId: string;
    milestoneTitle: string;
    amount: number;
    currency: string;
    daysSinceSubmission: number;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      // Notify creator
      await notificationService.createNotification({
        type: 'MILESTONE_AUTO_RELEASED' as NotificationType,
        title: 'Payment Auto-Released! ⏰',
        message: `Your milestone "${data.milestoneTitle}" has been automatically approved and payment of ${this.formatAmount(data.amount, data.currency)} has been released after ${data.daysSinceSubmission} days.`,
        userId: data.creatorId,
        dealId: data.dealId,
        milestoneId: data.milestoneId,
        priority: 'HIGH',
        actionUrl: `/milestones/${data.milestoneId}`,
      });
    } catch (error: any) {
      logger.error('Failed to send milestone auto-released notification:', error);
    }
  }

  // Payment notifications
  static async notifyPaymentReceived(data: {
    payoutId: string;
    userId: string;
    amount: number;
    currency: string;
    milestoneTitle?: string;
    projectTitle?: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      await notificationService.createNotification({
        type: 'PAYMENT_RECEIVED' as NotificationType,
        title: 'Payment Received! 💳',
        message: `You have received ${this.formatAmount(data.amount, data.currency)}${data.milestoneTitle ? ` for "${data.milestoneTitle}"` : ''}${data.projectTitle ? ` in "${data.projectTitle}"` : ''}`,
        userId: data.userId,
        priority: 'HIGH',
        actionUrl: `/payouts/${data.payoutId}`,
      });
    } catch (error: any) {
      logger.error('Failed to send payment received notification:', error);
    }
  }

  static async notifyPaymentFailed(data: {
    payoutId: string;
    userId: string;
    amount: number;
    currency: string;
    reason?: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      await notificationService.createNotification({
        type: 'PAYMENT_FAILED' as NotificationType,
        title: 'Payment Failed ⚠️',
        message: `Payment of ${this.formatAmount(data.amount, data.currency)} failed. ${data.reason || 'Please check your payment method and contact support if needed.'}`,
        userId: data.userId,
        priority: 'URGENT',
        actionUrl: `/payouts/${data.payoutId}`,
      });
    } catch (error: any) {
      logger.error('Failed to send payment failed notification:', error);
    }
  }

  // KYC notifications
  static async notifyKYCApproved(data: {
    userId: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      await notificationService.createNotification({
        type: 'KYC_APPROVED' as NotificationType,
        title: 'Identity Verified! 🆔',
        message: 'Your identity verification has been approved. You can now receive payments and access all features.',
        userId: data.userId,
        priority: 'HIGH',
        actionUrl: '/profile/kyc',
      });
    } catch (error: any) {
      logger.error('Failed to send KYC approved notification:', error);
    }
  }

  static async notifyKYCRejected(data: {
    userId: string;
    reason?: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      await notificationService.createNotification({
        type: 'KYC_REJECTED' as NotificationType,
        title: 'Identity Verification Needed ❌',
        message: `Your identity verification requires attention. ${data.reason || 'Please review the requirements and resubmit your documents.'}`,
        userId: data.userId,
        priority: 'URGENT',
        actionUrl: '/profile/kyc',
      });
    } catch (error: any) {
      logger.error('Failed to send KYC rejected notification:', error);
    }
  }

  // Dispute notifications
  static async notifyDisputeCreated(data: {
    disputeId: string;
    dealId: string;
    brandId: string;
    creatorId: string;
    reason: string;
    createdBy: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      const targetUserId = data.createdBy === data.brandId ? data.creatorId : data.brandId;
      
      await notificationService.createNotification({
        type: 'DISPUTE_CREATED' as NotificationType,
        title: 'Dispute Created ⚡',
        message: `A dispute has been raised on your deal. Reason: ${data.reason}`,
        userId: targetUserId,
        actorUserId: data.createdBy,
        dealId: data.dealId,
        priority: 'URGENT',
        actionUrl: `/disputes/${data.disputeId}`,
        metadata: { disputeId: data.disputeId },
      });
    } catch (error: any) {
      logger.error('Failed to send dispute created notification:', error);
    }
  }

  static async notifyDisputeResolved(data: {
    disputeId: string;
    dealId: string;
    brandId: string;
    creatorId: string;
    resolution: string;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      // Notify both parties
      const users = [data.brandId, data.creatorId];
      
      for (const userId of users) {
        await notificationService.createNotification({
          type: 'DISPUTE_RESOLVED' as NotificationType,
          title: 'Dispute Resolved ✅',
          message: `The dispute on your deal has been resolved. Resolution: ${data.resolution}`,
          userId,
          dealId: data.dealId,
          priority: 'HIGH',
          actionUrl: `/disputes/${data.disputeId}`,
          metadata: { disputeId: data.disputeId },
        });
      }
    } catch (error: any) {
      logger.error('Failed to send dispute resolved notification:', error);
    }
  }

  // Reminder notifications
  static async notifyMilestoneReminder(data: {
    milestoneId: string;
    dealId: string;
    userId: string;
    milestoneTitle: string;
    dueDate: Date;
    daysUntilDue: number;
  }) {
    try {
      const notificationService = this.getNotificationService();
      
      const urgency = data.daysUntilDue <= 1 ? 'URGENT' : data.daysUntilDue <= 3 ? 'HIGH' : 'MEDIUM';
      const title = data.daysUntilDue <= 0 ? 'Milestone Overdue! ⚠️' : 'Milestone Due Soon ⏰';
      
      await notificationService.createNotification({
        type: 'REMINDER' as NotificationType,
        title,
        message: `"${data.milestoneTitle}" is ${data.daysUntilDue <= 0 ? 'overdue' : `due in ${data.daysUntilDue} day${data.daysUntilDue === 1 ? '' : 's'}`}`,
        userId: data.userId,
        dealId: data.dealId,
        milestoneId: data.milestoneId,
        priority: urgency,
        actionUrl: `/milestones/${data.milestoneId}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    } catch (error: any) {
      logger.error('Failed to send milestone reminder notification:', error);
    }
  }

  // Helper methods
  private static formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }
}
import { PrismaClient } from '@prisma/client';
import { scheduleAutoRelease, cancelAutoRelease } from '../jobs/autoReleaseQueue.js';
import { logger } from '../utils/logger.js';
import { paymentsProvider } from './payments/index.js';

const prisma = new PrismaClient();

export interface SubmitMilestoneDeliverableData {
  milestoneId: string;
  creatorId: string;
  deliverableUrl?: string;
  fileHash?: string;
  description: string;
  submissionType: 'file' | 'url' | 'text';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  };
}

export interface ReviewMilestoneData {
  milestoneId: string;
  reviewerId: string;
  action: 'approve' | 'reject' | 'request_revision';
  feedback?: string;
}

export class MilestoneService {
  /**
   * Submit a deliverable for a milestone
   */
  async submitDeliverable(data: SubmitMilestoneDeliverableData) {
    const { milestoneId, creatorId, deliverableUrl, fileHash, description, submissionType, metadata } = data;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verify milestone exists and belongs to creator
        const milestone = await tx.milestone.findUnique({
          where: { id: milestoneId },
          include: {
            deal: {
              include: {
                project: {
                  include: {
                    brand: true,
                  },
                },
                creator: true,
              },
            },
          },
        });

        if (!milestone) {
          throw new Error('Milestone not found');
        }

        if (milestone.deal.creator_id !== creatorId) {
          throw new Error('You do not have permission to submit to this milestone');
        }

        if (milestone.state !== 'PENDING') {
          throw new Error(`Cannot submit deliverable for milestone in ${milestone.state} state`);
        }

        if (milestone.deal.state !== 'FUNDED') {
          throw new Error('Deal must be funded before submitting deliverables');
        }

        // Create deliverable record
        const deliverable = await tx.deliverable.create({
          data: {
            milestone_id: milestoneId,
            url: deliverableUrl,
            file_hash: fileHash,
            submitted_at: new Date(),
            checks: {
              submission_type: submissionType,
              description,
              ...metadata,
            },
          },
        });

        // Update milestone state to SUBMITTED
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            state: 'SUBMITTED',
            submitted_at: new Date(),
          },
        });

        // Create event log
        await tx.event.create({
          data: {
            type: 'milestone.submitted',
            actor_user_id: creatorId,
            payload: {
              milestone_id: milestoneId,
              deal_id: milestone.deal_id,
              deliverable_id: deliverable.id,
              submission_type: submissionType,
              has_file: !!deliverableUrl,
              file_hash: fileHash,
            },
          },
        });

        return { milestone: updatedMilestone, deliverable, deal: milestone.deal };
      });

      // Schedule auto-release if enabled for this deal
      const dealSettings = await this.getDealAutoReleaseSettings(result.deal.id);
      if (dealSettings.autoReleaseEnabled) {
        await scheduleAutoRelease(
          milestoneId,
          result.deal.id,
          dealSettings.autoReleaseDays
        );
        
        logger.info(`Auto-release scheduled for milestone ${milestoneId} in ${dealSettings.autoReleaseDays} days`);
      }

      return result;
    } catch (error: any) {
      logger.error(`Failed to submit deliverable for milestone ${milestoneId}:`, error);
      throw error;
    }
  }

  /**
   * Review a submitted milestone
   */
  async reviewMilestone(data: ReviewMilestoneData) {
    const { milestoneId, reviewerId, action, feedback } = data;

    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verify milestone and permissions
        const milestone = await tx.milestone.findUnique({
          where: { id: milestoneId },
          include: {
            deal: {
              include: {
                project: {
                  include: {
                    brand: true,
                  },
                },
                creator: true,
              },
            },
            deliverables: true,
          },
        });

        if (!milestone) {
          throw new Error('Milestone not found');
        }

        if (milestone.deal.project.brand_id !== reviewerId) {
          throw new Error('You do not have permission to review this milestone');
        }

        if (milestone.state !== 'SUBMITTED') {
          throw new Error(`Cannot review milestone in ${milestone.state} state`);
        }

        // Cancel auto-release if it exists
        await cancelAutoRelease(milestoneId);

        let updatedMilestone;
        let paymentResult = null;

        if (action === 'approve') {
          // Approve the milestone
          updatedMilestone = await tx.milestone.update({
            where: { id: milestoneId },
            data: {
              state: 'APPROVED',
              approved_at: new Date(),
            },
          });

          // Process payment release
          try {
            paymentResult = await paymentsProvider.releaseMilestonePayment({
              milestoneId,
              dealId: milestone.deal_id,
              creatorId: milestone.deal.creator_id!,
              amount: milestone.amount,
              currency: milestone.deal.currency,
            });

            // Update milestone to RELEASED
            updatedMilestone = await tx.milestone.update({
              where: { id: milestoneId },
              data: {
                state: 'RELEASED',
                released_at: new Date(),
                payout_id: paymentResult.payoutId,
              },
            });

          } catch (paymentError: any) {
            logger.error(`Payment release failed for milestone ${milestoneId}:`, paymentError);
            // Keep milestone in APPROVED state if payment fails
            throw paymentError;
          }

        } else {
          // Reject or request revision - return to PENDING state
          updatedMilestone = await tx.milestone.update({
            where: { id: milestoneId },
            data: {
              state: 'PENDING',
              submitted_at: null, // Clear submission timestamp
            },
          });
        }

        // Update deliverable with review feedback
        if (milestone.deliverables.length > 0) {
          const deliverable = milestone.deliverables[0];
          await tx.deliverable.update({
            where: { id: deliverable.id },
            data: {
              checks: {
                ...deliverable.checks,
                status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'revision_requested',
                feedback,
                reviewed_at: new Date(),
                reviewed_by: reviewerId,
              },
              updated_at: new Date(),
            },
          });
        }

        // Create event log
        await tx.event.create({
          data: {
            type: `milestone.${action}d`,
            actor_user_id: reviewerId,
            payload: {
              milestone_id: milestoneId,
              deal_id: milestone.deal_id,
              action,
              feedback,
              amount: milestone.amount,
              currency: milestone.deal.currency,
              payout_id: paymentResult?.payoutId,
            },
          },
        });

        // Check if all milestones are completed
        if (action === 'approve') {
          const dealMilestones = await tx.milestone.findMany({
            where: { deal_id: milestone.deal_id },
          });

          const allCompleted = dealMilestones.every(m => m.id === milestoneId ? true : m.state === 'RELEASED');
          
          if (allCompleted) {
            await tx.deal.update({
              where: { id: milestone.deal_id },
              data: {
                state: 'RELEASED',
                completed_at: new Date(),
              },
            });
          }
        }

        return { milestone: updatedMilestone, paymentResult, deal: milestone.deal };
      });

      logger.info(`Milestone ${milestoneId} reviewed: ${action} by ${reviewerId}`);
      return result;

    } catch (error: any) {
      logger.error(`Failed to review milestone ${milestoneId}:`, error);
      throw error;
    }
  }

  /**
   * Get deal auto-release settings
   */
  async getDealAutoReleaseSettings(dealId: string): Promise<{
    autoReleaseEnabled: boolean;
    autoReleaseDays: number;
  }> {
    try {
      // Check for deal-specific settings (stored in deal metadata or separate table)
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        select: { metadata: true },
      });

      const metadata = deal?.metadata as any || {};
      
      return {
        autoReleaseEnabled: metadata.auto_release_enabled ?? true, // Default to enabled
        autoReleaseDays: metadata.auto_release_days ?? 5, // Default to 5 days
      };
    } catch (error: any) {
      logger.error(`Failed to get auto-release settings for deal ${dealId}:`, error);
      // Return safe defaults
      return {
        autoReleaseEnabled: true,
        autoReleaseDays: 5,
      };
    }
  }

  /**
   * Update deal auto-release settings
   */
  async updateDealAutoReleaseSettings(
    dealId: string, 
    settings: { autoReleaseEnabled: boolean; autoReleaseDays: number }
  ) {
    try {
      await prisma.deal.update({
        where: { id: dealId },
        data: {
          metadata: {
            auto_release_enabled: settings.autoReleaseEnabled,
            auto_release_days: settings.autoReleaseDays,
          },
        },
      });

      logger.info(`Updated auto-release settings for deal ${dealId}:`, settings);
    } catch (error: any) {
      logger.error(`Failed to update auto-release settings for deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Get milestone with deliverables and deal info
   */
  async getMilestoneDetails(milestoneId: string) {
    try {
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          deal: {
            include: {
              project: {
                include: {
                  brand: true,
                },
              },
              creator: true,
            },
          },
          deliverables: {
            orderBy: {
              created_at: 'desc',
            },
          },
        },
      });

      return milestone;
    } catch (error: any) {
      logger.error(`Failed to get milestone details ${milestoneId}:`, error);
      throw error;
    }
  }

  /**
   * Get milestones for a deal
   */
  async getDealMilestones(dealId: string) {
    try {
      const milestones = await prisma.milestone.findMany({
        where: { deal_id: dealId },
        include: {
          deliverables: {
            orderBy: {
              created_at: 'desc',
            },
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      return milestones;
    } catch (error: any) {
      logger.error(`Failed to get milestones for deal ${dealId}:`, error);
      throw error;
    }
  }

  /**
   * Force release a milestone (admin function)
   */
  async forceReleaseMilestone(milestoneId: string, adminId: string, reason: string) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const milestone = await tx.milestone.findUnique({
          where: { id: milestoneId },
          include: {
            deal: {
              include: {
                creator: true,
              },
            },
          },
        });

        if (!milestone) {
          throw new Error('Milestone not found');
        }

        // Cancel any pending auto-release
        await cancelAutoRelease(milestoneId);

        // Process payment
        const paymentResult = await paymentsProvider.releaseMilestonePayment({
          milestoneId,
          dealId: milestone.deal_id,
          creatorId: milestone.deal.creator_id!,
          amount: milestone.amount,
          currency: milestone.deal.currency,
        });

        // Update milestone
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            state: 'RELEASED',
            approved_at: new Date(),
            released_at: new Date(),
            payout_id: paymentResult.payoutId,
          },
        });

        // Create event log
        await tx.event.create({
          data: {
            type: 'milestone.force_released',
            actor_user_id: adminId,
            payload: {
              milestone_id: milestoneId,
              deal_id: milestone.deal_id,
              reason,
              amount: milestone.amount,
              currency: milestone.deal.currency,
              payout_id: paymentResult.payoutId,
            },
          },
        });

        return { milestone: updatedMilestone, paymentResult };
      });

      logger.info(`Force released milestone ${milestoneId} by admin ${adminId}: ${reason}`);
      return result;

    } catch (error: any) {
      logger.error(`Failed to force release milestone ${milestoneId}:`, error);
      throw error;
    }
  }
}

export const milestoneService = new MilestoneService();
export default milestoneService;
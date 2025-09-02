import { Queue, Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger.js';
import { paymentsProvider } from '../services/payments/index.js';

const prisma = new PrismaClient();

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// Auto-release queue for milestone payments
export const autoReleaseQueue = new Queue('auto-release', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
});

// Job data interface
interface AutoReleaseJobData {
  milestoneId: string;
  dealId: string;
  scheduledFor: Date;
  autoReleaseDays: number;
}

// Event emitter for notifications
export const autoReleaseEvents = new EventEmitter();

// Auto-release worker
export const autoReleaseWorker = new Worker(
  'auto-release',
  async (job: Job<AutoReleaseJobData>) => {
    const { milestoneId, dealId, scheduledFor, autoReleaseDays } = job.data;
    
    try {
      logger.info(`Processing auto-release job for milestone ${milestoneId}`);
      
      // Check if the job is still valid (not too early/late)
      const now = new Date();
      const scheduledTime = new Date(scheduledFor);
      
      if (now < scheduledTime) {
        throw new Error(`Job executed too early. Scheduled for: ${scheduledFor}, Current: ${now}`);
      }

      // Fetch current milestone state
      const milestone = await prisma.milestone.findUnique({
        where: { id: milestoneId },
        include: {
          deal: {
            include: {
              creator: true,
              project: {
                include: {
                  brand: true,
                },
              },
            },
          },
          deliverables: true,
        },
      });

      if (!milestone) {
        logger.warn(`Milestone ${milestoneId} not found, skipping auto-release`);
        return { success: false, reason: 'Milestone not found' };
      }

      // Check if milestone is still in SUBMITTED state
      if (milestone.state !== 'SUBMITTED') {
        logger.info(`Milestone ${milestoneId} is no longer in SUBMITTED state (${milestone.state}), skipping auto-release`);
        return { success: false, reason: `Milestone state is ${milestone.state}` };
      }

      // Check if there are any deliverables
      if (milestone.deliverables.length === 0) {
        logger.warn(`Milestone ${milestoneId} has no deliverables, cannot auto-release`);
        return { success: false, reason: 'No deliverables found' };
      }

      // Verify the auto-release timeout has passed
      const submittedAt = milestone.submitted_at;
      if (!submittedAt) {
        logger.warn(`Milestone ${milestoneId} has no submitted_at timestamp`);
        return { success: false, reason: 'No submission timestamp' };
      }

      const daysSinceSubmission = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceSubmission < autoReleaseDays) {
        logger.warn(`Auto-release attempted too early for milestone ${milestoneId}. Days since submission: ${daysSinceSubmission}, Required: ${autoReleaseDays}`);
        return { success: false, reason: 'Auto-release period not yet elapsed' };
      }

      // Begin transaction for atomic operations
      const result = await prisma.$transaction(async (tx) => {
        // Update milestone to APPROVED state first
        const updatedMilestone = await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            state: 'APPROVED',
            approved_at: now,
            auto_released: true,
          },
        });

        // Process payment release through payment provider
        let paymentResult;
        try {
          paymentResult = await paymentsProvider.releaseMilestonePayment({
            milestoneId,
            dealId,
            creatorId: milestone.deal.creator_id!,
            amount: milestone.amount,
            currency: milestone.deal.currency,
          });
        } catch (paymentError: any) {
          logger.error(`Payment release failed for milestone ${milestoneId}:`, paymentError);
          throw paymentError;
        }

        // Update milestone to RELEASED state
        await tx.milestone.update({
          where: { id: milestoneId },
          data: {
            state: 'RELEASED',
            released_at: now,
            payout_id: paymentResult.payoutId,
          },
        });

        // Check if all milestones in the deal are completed
        const dealMilestones = await tx.milestone.findMany({
          where: { deal_id: dealId },
        });

        const allCompleted = dealMilestones.every(m => m.state === 'RELEASED');
        
        if (allCompleted) {
          // Mark deal as completed
          await tx.deal.update({
            where: { id: dealId },
            data: {
              state: 'RELEASED',
              completed_at: now,
            },
          });
        }

        // Create audit log event
        await tx.event.create({
          data: {
            type: 'milestone.auto_released',
            actor_user_id: 'system',
            payload: {
              milestone_id: milestoneId,
              deal_id: dealId,
              amount: milestone.amount,
              currency: milestone.deal.currency,
              auto_release_days: autoReleaseDays,
              days_since_submission: daysSinceSubmission,
              payout_id: paymentResult.payoutId,
            },
          },
        });

        return {
          milestone: updatedMilestone,
          paymentResult,
          dealCompleted: allCompleted,
        };
      });

      logger.info(`Auto-released milestone ${milestoneId} after ${daysSinceSubmission} days`);

      // Emit events for notifications
      autoReleaseEvents.emit('milestone.auto_released', {
        milestone,
        deal: milestone.deal,
        paymentResult: result.paymentResult,
        dealCompleted: result.dealCompleted,
      });

      return {
        success: true,
        milestoneId,
        dealId,
        amount: milestone.amount,
        currency: milestone.deal.currency,
        daysSinceSubmission,
        payoutId: result.paymentResult.payoutId,
      };

    } catch (error: any) {
      logger.error(`Auto-release job failed for milestone ${milestoneId}:`, error);
      
      // Emit error event
      autoReleaseEvents.emit('auto_release.failed', {
        milestoneId,
        dealId,
        error: error.message,
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs per minute
      duration: 60000,
    },
  }
);

// Schedule auto-release for a milestone
export async function scheduleAutoRelease(
  milestoneId: string,
  dealId: string,
  autoReleaseDays: number = 5
): Promise<Job<AutoReleaseJobData> | null> {
  try {
    // Fetch milestone to get submission time
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!milestone || !milestone.submitted_at) {
      logger.warn(`Cannot schedule auto-release for milestone ${milestoneId}: not submitted`);
      return null;
    }

    // Calculate release time
    const submissionTime = new Date(milestone.submitted_at);
    const releaseTime = new Date(submissionTime.getTime() + (autoReleaseDays * 24 * 60 * 60 * 1000));

    // Check if the release time is in the past (edge case)
    const now = new Date();
    if (releaseTime <= now) {
      logger.warn(`Auto-release time for milestone ${milestoneId} is in the past, executing immediately`);
      // Schedule for immediate execution
      releaseTime.setTime(now.getTime() + 60000); // 1 minute from now
    }

    const jobData: AutoReleaseJobData = {
      milestoneId,
      dealId,
      scheduledFor: releaseTime,
      autoReleaseDays,
    };

    // Add job to queue with delay
    const delay = Math.max(0, releaseTime.getTime() - now.getTime());
    const job = await autoReleaseQueue.add(
      `auto-release-${milestoneId}`,
      jobData,
      {
        delay,
        jobId: `auto-release-${milestoneId}`, // Unique job ID to prevent duplicates
      }
    );

    logger.info(`Scheduled auto-release for milestone ${milestoneId} at ${releaseTime.toISOString()}`);
    return job;

  } catch (error: any) {
    logger.error(`Failed to schedule auto-release for milestone ${milestoneId}:`, error);
    throw error;
  }
}

// Cancel auto-release for a milestone
export async function cancelAutoRelease(milestoneId: string): Promise<boolean> {
  try {
    const jobId = `auto-release-${milestoneId}`;
    const job = await autoReleaseQueue.getJob(jobId);
    
    if (job) {
      await job.remove();
      logger.info(`Cancelled auto-release job for milestone ${milestoneId}`);
      return true;
    } else {
      logger.info(`No auto-release job found for milestone ${milestoneId}`);
      return false;
    }
  } catch (error: any) {
    logger.error(`Failed to cancel auto-release for milestone ${milestoneId}:`, error);
    return false;
  }
}

// Get pending auto-release jobs
export async function getPendingAutoReleases(): Promise<Job<AutoReleaseJobData>[]> {
  try {
    const jobs = await autoReleaseQueue.getJobs(['delayed', 'waiting']);
    return jobs as Job<AutoReleaseJobData>[];
  } catch (error: any) {
    logger.error('Failed to get pending auto-releases:', error);
    return [];
  }
}

// Clean up completed jobs (run periodically)
export async function cleanupCompletedJobs(): Promise<void> {
  try {
    await autoReleaseQueue.clean(24 * 60 * 60 * 1000, 100, 'completed'); // Clean jobs older than 24 hours
    await autoReleaseQueue.clean(7 * 24 * 60 * 60 * 1000, 50, 'failed'); // Clean failed jobs older than 7 days
    logger.info('Cleaned up completed auto-release jobs');
  } catch (error: any) {
    logger.error('Failed to cleanup completed jobs:', error);
  }
}

// Health check for the queue system
export async function checkQueueHealth(): Promise<{
  isHealthy: boolean;
  stats: any;
  error?: string;
}> {
  try {
    const [waiting, active, completed, failed] = await Promise.all([
      autoReleaseQueue.getWaiting(),
      autoReleaseQueue.getActive(),
      autoReleaseQueue.getCompleted(),
      autoReleaseQueue.getFailed(),
    ]);

    const stats = {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };

    return {
      isHealthy: true,
      stats,
    };
  } catch (error: any) {
    return {
      isHealthy: false,
      stats: null,
      error: error.message,
    };
  }
}

// Graceful shutdown
export async function shutdownAutoReleaseSystem(): Promise<void> {
  logger.info('Shutting down auto-release system...');
  
  try {
    await autoReleaseWorker.close();
    await autoReleaseQueue.close();
    logger.info('Auto-release system shut down successfully');
  } catch (error: any) {
    logger.error('Error during auto-release system shutdown:', error);
  }
}

// Handle worker events
autoReleaseWorker.on('completed', (job: Job<AutoReleaseJobData>, result: any) => {
  logger.info(`Auto-release job ${job.id} completed successfully:`, result);
});

autoReleaseWorker.on('failed', (job: Job<AutoReleaseJobData> | undefined, error: Error) => {
  logger.error(`Auto-release job ${job?.id || 'unknown'} failed:`, error);
});

autoReleaseWorker.on('error', (error: Error) => {
  logger.error('Auto-release worker error:', error);
});

export default {
  queue: autoReleaseQueue,
  worker: autoReleaseWorker,
  scheduleAutoRelease,
  cancelAutoRelease,
  getPendingAutoReleases,
  cleanupCompletedJobs,
  checkQueueHealth,
  shutdownAutoReleaseSystem,
};
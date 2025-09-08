import { PrismaClient, AgencyTier, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';

export interface AgencyPricingTier {
  tier: AgencyTier;
  name: string;
  description: string;
  basePrice: number; // Monthly price in dollars
  perCreatorPrice: number; // Additional price per creator
  maxCreators: number;
  platformFeeRate: number; // Percentage
  features: string[];
  stripePriceId?: string;
}

export const AGENCY_PRICING_TIERS: Record<AgencyTier, AgencyPricingTier> = {
  STARTER: {
    tier: 'STARTER',
    name: 'Starter',
    description: 'Perfect for new agencies getting started',
    basePrice: 99,
    perCreatorPrice: 15,
    maxCreators: 5,
    platformFeeRate: 5.0,
    features: [
      'Up to 5 creators',
      'Basic analytics',
      'Email support',
      'Standard platform fee (5%)',
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    description: 'Ideal for growing agencies',
    basePrice: 299,
    perCreatorPrice: 12,
    maxCreators: 25,
    platformFeeRate: 3.5,
    features: [
      'Up to 25 creators',
      'Advanced analytics',
      'Priority support',
      'Reduced platform fee (3.5%)',
      'White-label options',
      'Custom reporting',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL,
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large agencies and maximum flexibility',
    basePrice: 999,
    perCreatorPrice: 10,
    maxCreators: 100,
    platformFeeRate: 2.5,
    features: [
      'Up to 100 creators',
      'Full analytics suite',
      'Dedicated account manager',
      'Lowest platform fee (2.5%)',
      'Full white-label solution',
      'Custom integrations',
      'API access',
      'Custom contracts',
    ],
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
  },
};

export class AgencySubscriptionService {
  constructor(
    private prisma: PrismaClient,
    private stripe: Stripe
  ) {}

  /**
   * Calculate the monthly cost for an agency based on tier and creator count
   */
  calculateMonthlyCost(tier: AgencyTier, creatorCount: number): number {
    const tierConfig = AGENCY_PRICING_TIERS[tier];
    const basePrice = tierConfig.basePrice;
    
    // Only charge per-creator pricing for creators beyond the included amount
    const extraCreators = Math.max(0, creatorCount - Math.floor(tierConfig.maxCreators / 2));
    const perCreatorCost = extraCreators * tierConfig.perCreatorPrice;
    
    return basePrice + perCreatorCost;
  }

  /**
   * Get recommended tier based on creator count and requirements
   */
  getRecommendedTier(creatorCount: number): AgencyTier {
    if (creatorCount <= 5) return 'STARTER';
    if (creatorCount <= 25) return 'PROFESSIONAL';
    return 'ENTERPRISE';
  }

  /**
   * Create a new agency subscription
   */
  async createSubscription(agencyId: string, tier: AgencyTier, stripeCustomerId: string): Promise<void> {
    const tierConfig = AGENCY_PRICING_TIERS[tier];
    
    // Create Stripe subscription
    const stripeSubscription = await this.stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [
        {
          price: tierConfig.stripePriceId,
        },
      ],
      trial_period_days: 30,
      metadata: {
        agencyId,
        tier,
      },
    });

    // Create database record
    await this.prisma.agencySubscription.create({
      data: {
        agencyId,
        tier,
        status: 'TRIALING',
        basePrice: tierConfig.basePrice,
        perCreatorPrice: tierConfig.perCreatorPrice,
        platformFeeRate: tierConfig.platformFeeRate,
        billingCycle: 'monthly',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: tierConfig.stripePriceId,
      },
    });

    // Update agency tier and limits
    await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        tier,
        maxCreators: tierConfig.maxCreators,
        platformFeeRate: tierConfig.platformFeeRate,
      },
    });
  }

  /**
   * Upgrade agency subscription to a higher tier
   */
  async upgradeSubscription(agencyId: string, newTier: AgencyTier): Promise<void> {
    const subscription = await this.prisma.agencySubscription.findUnique({
      where: { agencyId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new Error('Active subscription not found');
    }

    const newTierConfig = AGENCY_PRICING_TIERS[newTier];

    // Update Stripe subscription
    const stripeSubscription = await this.stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newTierConfig.stripePriceId,
        },
      ],
      proration_behavior: 'always_invoice',
    });

    // Update database records
    await Promise.all([
      this.prisma.agencySubscription.update({
        where: { agencyId },
        data: {
          tier: newTier,
          basePrice: newTierConfig.basePrice,
          perCreatorPrice: newTierConfig.perCreatorPrice,
          platformFeeRate: newTierConfig.platformFeeRate,
          stripePriceId: newTierConfig.stripePriceId,
        },
      }),
      this.prisma.agency.update({
        where: { id: agencyId },
        data: {
          tier: newTier,
          maxCreators: newTierConfig.maxCreators,
          platformFeeRate: newTierConfig.platformFeeRate,
        },
      }),
    ]);
  }

  /**
   * Cancel agency subscription
   */
  async cancelSubscription(agencyId: string, cancelImmediately = false): Promise<void> {
    const subscription = await this.prisma.agencySubscription.findUnique({
      where: { agencyId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      throw new Error('Active subscription not found');
    }

    if (cancelImmediately) {
      // Cancel immediately
      await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      
      await this.prisma.agencySubscription.update({
        where: { agencyId },
        data: {
          status: 'CANCELED',
          canceledAt: new Date(),
        },
      });
    } else {
      // Cancel at period end
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
  }

  /**
   * Handle Stripe webhook events for subscription changes
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const agencyId = stripeSubscription.metadata?.agencyId;
    if (!agencyId) return;

    const status = this.mapStripeStatus(stripeSubscription.status);
    
    await this.prisma.agencySubscription.update({
      where: { agencyId },
      data: {
        status,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const agencyId = stripeSubscription.metadata?.agencyId;
    if (!agencyId) return;

    await this.prisma.agencySubscription.update({
      where: { agencyId },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
      },
    });

    // Downgrade to starter tier
    await this.prisma.agency.update({
      where: { id: agencyId },
      data: {
        tier: 'STARTER',
        maxCreators: AGENCY_PRICING_TIERS.STARTER.maxCreators,
        platformFeeRate: AGENCY_PRICING_TIERS.STARTER.platformFeeRate,
        isActive: false, // Deactivate agency
      },
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    // Payment successful - subscription should remain active
    if (invoice.subscription && typeof invoice.subscription === 'string') {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
      const agencyId = stripeSubscription.metadata?.agencyId;
      
      if (agencyId) {
        await this.prisma.agencySubscription.update({
          where: { agencyId },
          data: {
            status: 'ACTIVE',
          },
        });
      }
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Payment failed - mark as past due
    if (invoice.subscription && typeof invoice.subscription === 'string') {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
      const agencyId = stripeSubscription.metadata?.agencyId;
      
      if (agencyId) {
        await this.prisma.agencySubscription.update({
          where: { agencyId },
          data: {
            status: 'PAST_DUE',
          },
        });
      }
    }
  }

  private mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
    switch (stripeStatus) {
      case 'active':
        return 'ACTIVE';
      case 'trialing':
        return 'TRIALING';
      case 'past_due':
        return 'PAST_DUE';
      case 'canceled':
      case 'unpaid':
        return 'CANCELED';
      case 'incomplete':
      case 'incomplete_expired':
        return 'INCOMPLETE';
      default:
        return 'CANCELED';
    }
  }

  /**
   * Get subscription details for an agency
   */
  async getSubscriptionDetails(agencyId: string): Promise<any> {
    const subscription = await this.prisma.agencySubscription.findUnique({
      where: { agencyId },
      include: {
        agency: {
          include: {
            _count: {
              select: {
                managedCreators: true,
              },
            },
          },
        },
      },
    });

    if (!subscription) {
      return null;
    }

    const tierConfig = AGENCY_PRICING_TIERS[subscription.tier];
    const creatorCount = subscription.agency._count.managedCreators;
    const monthlyCost = this.calculateMonthlyCost(subscription.tier, creatorCount);

    return {
      ...subscription,
      tierConfig,
      creatorCount,
      monthlyCost,
      usage: {
        creators: `${creatorCount}/${subscription.agency.maxCreators}`,
        creatorUtilization: (creatorCount / subscription.agency.maxCreators) * 100,
      },
    };
  }
}
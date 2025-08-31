export type PlanType = 'free' | 'starter' | 'professional' | 'enterprise';

export interface PlanLimits {
  dealsPerMonth: number;
  transactionVolume: number; // USD per month
  stripeFeeCap: number; // USD per transaction
  supportLevel: 'email' | 'priority' | 'dedicated';
  customBranding: boolean;
  apiAccess: boolean;
  advancedAnalytics: boolean;
  bulkPayouts: boolean;
  whiteLabeling: boolean;
}

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  price: number; // USD per month
  yearlyPrice?: number; // USD per year (with discount)
  description: string;
  popular?: boolean;
  limits: PlanLimits;
  features: string[];
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: PlanType;
  status: 'active' | 'cancelled' | 'expired' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UsageMetrics {
  userId: string;
  planId: PlanType;
  currentPeriod: {
    start: Date;
    end: Date;
  };
  usage: {
    dealsCreated: number;
    transactionVolume: number;
    apiCalls?: number;
  };
  limits: PlanLimits;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for trying out FlowPay',
    limits: {
      dealsPerMonth: 3,
      transactionVolume: 1000,
      stripeFeeCap: 50,
      supportLevel: 'email',
      customBranding: false,
      apiAccess: false,
      advancedAnalytics: false,
      bulkPayouts: false,
      whiteLabeling: false,
    },
    features: [
      'Up to 3 deals per month',
      '$1,000 transaction volume',
      'Basic escrow protection',
      'Email support',
      'Standard payout speed (24-48h)',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    yearlyPrice: 290, // ~17% discount
    description: 'Great for growing creators and small brands',
    popular: true,
    limits: {
      dealsPerMonth: 15,
      transactionVolume: 10000,
      stripeFeeCap: 100,
      supportLevel: 'email',
      customBranding: true,
      apiAccess: false,
      advancedAnalytics: true,
      bulkPayouts: false,
      whiteLabeling: false,
    },
    features: [
      'Up to 15 deals per month',
      '$10,000 transaction volume',
      'Custom branding on invoices',
      'Advanced analytics',
      'Priority email support',
      'Instant payouts',
      '2.5% platform fee',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    yearlyPrice: 990, // ~17% discount
    description: 'For established creators and growing brands',
    limits: {
      dealsPerMonth: 50,
      transactionVolume: 50000,
      stripeFeeCap: 250,
      supportLevel: 'priority',
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true,
      bulkPayouts: true,
      whiteLabeling: false,
    },
    features: [
      'Up to 50 deals per month',
      '$50,000 transaction volume',
      'API access for integrations',
      'Bulk payout management',
      'Priority support (24h response)',
      'Custom contract templates',
      '2% platform fee',
      'Advanced reporting',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    yearlyPrice: 2990, // ~17% discount
    description: 'For agencies and large-scale operations',
    limits: {
      dealsPerMonth: -1, // Unlimited
      transactionVolume: -1, // Unlimited
      stripeFeeCap: -1, // Unlimited
      supportLevel: 'dedicated',
      customBranding: true,
      apiAccess: true,
      advancedAnalytics: true,
      bulkPayouts: true,
      whiteLabeling: true,
    },
    features: [
      'Unlimited deals',
      'Unlimited transaction volume',
      'White-label solution',
      'Dedicated account manager',
      '24/7 phone support',
      'Custom integrations',
      '1.5% platform fee',
      'Multi-user team management',
      'Advanced compliance tools',
    ],
  },
];

export function getPlanById(planId: PlanType): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

export function canUserPerformAction(
  subscription: UserSubscription | null,
  usage: UsageMetrics | null,
  action: 'create_deal' | 'process_payment' | 'use_api' | 'bulk_payout'
): { allowed: boolean; reason?: string; upgradeRequired?: PlanType } {
  if (!subscription) {
    return {
      allowed: false,
      reason: 'No active subscription',
      upgradeRequired: 'starter'
    };
  }

  const plan = getPlanById(subscription.planId);
  if (!plan) {
    return {
      allowed: false,
      reason: 'Invalid plan'
    };
  }

  if (!usage) {
    return { allowed: true };
  }

  switch (action) {
    case 'create_deal':
      if (plan.limits.dealsPerMonth === -1) return { allowed: true };
      if (usage.usage.dealsCreated >= plan.limits.dealsPerMonth) {
        return {
          allowed: false,
          reason: `Monthly deal limit reached (${plan.limits.dealsPerMonth})`,
          upgradeRequired: getNextPlan(subscription.planId)
        };
      }
      break;

    case 'process_payment':
      if (plan.limits.transactionVolume === -1) return { allowed: true };
      if (usage.usage.transactionVolume >= plan.limits.transactionVolume) {
        return {
          allowed: false,
          reason: `Monthly transaction volume limit reached ($${plan.limits.transactionVolume.toLocaleString()})`,
          upgradeRequired: getNextPlan(subscription.planId)
        };
      }
      break;

    case 'use_api':
      if (!plan.limits.apiAccess) {
        return {
          allowed: false,
          reason: 'API access not included in current plan',
          upgradeRequired: 'professional'
        };
      }
      break;

    case 'bulk_payout':
      if (!plan.limits.bulkPayouts) {
        return {
          allowed: false,
          reason: 'Bulk payouts not included in current plan',
          upgradeRequired: 'professional'
        };
      }
      break;
  }

  return { allowed: true };
}

function getNextPlan(currentPlan: PlanType): PlanType {
  const planOrder: PlanType[] = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  return planOrder[currentIndex + 1] || 'enterprise';
}

export function calculatePlatformFee(planId: PlanType, transactionAmount: number): number {
  switch (planId) {
    case 'free': return transactionAmount * 0.035; // 3.5%
    case 'starter': return transactionAmount * 0.025; // 2.5%
    case 'professional': return transactionAmount * 0.02; // 2%
    case 'enterprise': return transactionAmount * 0.015; // 1.5%
    default: return transactionAmount * 0.035;
  }
}
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  UserSubscription, 
  UsageMetrics, 
  PlanType,
  getPlanById,
  canUserPerformAction,
  SUBSCRIPTION_PLANS
} from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  usage: UsageMetrics | null;
  loading: boolean;
  canCreateDeal: () => { allowed: boolean; reason?: string; upgradeRequired?: PlanType };
  canProcessPayment: (amount: number) => { allowed: boolean; reason?: string; upgradeRequired?: PlanType };
  canUseAPI: () => { allowed: boolean; reason?: string; upgradeRequired?: PlanType };
  canUseBulkPayouts: () => { allowed: boolean; reason?: string; upgradeRequired?: PlanType };
  getCurrentPlan: () => typeof SUBSCRIPTION_PLANS[0] | undefined;
  upgradeToUser: (planId: PlanType) => Promise<void>;
  trackUsage: (action: 'deal_created' | 'payment_processed', amount?: number) => void;
  getRemainingLimits: () => {
    deals: number | 'unlimited';
    transactionVolume: number | 'unlimited';
  };
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      loadUserSubscription();
      loadUsageMetrics();
    } else {
      setSubscription(null);
      setUsage(null);
      setLoading(false);
    }
  }, [userProfile]);

  const loadUserSubscription = async () => {
    try {
      // In a real app, this would fetch from your API/database
      // For now, we'll simulate with localStorage and default to free plan
      const storedSub = localStorage.getItem(`subscription_${userProfile?.id}`);
      
      if (storedSub) {
        const parsed = JSON.parse(storedSub);
        setSubscription({
          ...parsed,
          currentPeriodStart: new Date(parsed.currentPeriodStart),
          currentPeriodEnd: new Date(parsed.currentPeriodEnd),
          createdAt: new Date(parsed.createdAt),
          updatedAt: new Date(parsed.updatedAt),
          trialEnd: parsed.trialEnd ? new Date(parsed.trialEnd) : undefined,
        });
      } else {
        // Default to free plan for new users
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const freeSubscription: UserSubscription = {
          id: `sub_${userProfile?.id}_${Date.now()}`,
          userId: userProfile?.id || '',
          planId: 'free',
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: endOfMonth,
          cancelAtPeriodEnd: false,
          createdAt: now,
          updatedAt: now,
        };
        setSubscription(freeSubscription);
        localStorage.setItem(`subscription_${userProfile?.id}`, JSON.stringify(freeSubscription));
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const loadUsageMetrics = async () => {
    try {
      // In a real app, this would fetch from your API/database
      const storedUsage = localStorage.getItem(`usage_${userProfile?.id}`);
      
      if (storedUsage) {
        const parsed = JSON.parse(storedUsage);
        setUsage({
          ...parsed,
          currentPeriod: {
            start: new Date(parsed.currentPeriod.start),
            end: new Date(parsed.currentPeriod.end),
          }
        });
      } else {
        // Initialize usage metrics
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const plan = getPlanById('free');
        
        const initialUsage: UsageMetrics = {
          userId: userProfile?.id || '',
          planId: 'free',
          currentPeriod: {
            start: now,
            end: endOfMonth,
          },
          usage: {
            dealsCreated: 0,
            transactionVolume: 0,
            apiCalls: 0,
          },
          limits: plan?.limits || SUBSCRIPTION_PLANS[0].limits,
        };
        setUsage(initialUsage);
        localStorage.setItem(`usage_${userProfile?.id}`, JSON.stringify(initialUsage));
      }
    } catch (error) {
      console.error('Error loading usage metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreateDeal = () => {
    return canUserPerformAction(subscription, usage, 'create_deal');
  };

  const canProcessPayment = (amount: number) => {
    const basicCheck = canUserPerformAction(subscription, usage, 'process_payment');
    if (!basicCheck.allowed) return basicCheck;
    
    // Additional check for transaction amount + current usage
    if (usage && subscription) {
      const plan = getPlanById(subscription.planId);
      if (plan && plan.limits.transactionVolume !== -1) {
        const newTotal = usage.usage.transactionVolume + amount;
        if (newTotal > plan.limits.transactionVolume) {
          return {
            allowed: false,
            reason: `This transaction would exceed your monthly limit ($${plan.limits.transactionVolume.toLocaleString()})`,
            upgradeRequired: getNextPlan(subscription.planId)
          };
        }
      }
    }
    
    return { allowed: true };
  };

  const canUseAPI = () => {
    return canUserPerformAction(subscription, usage, 'use_api');
  };

  const canUseBulkPayouts = () => {
    return canUserPerformAction(subscription, usage, 'bulk_payout');
  };

  const getCurrentPlan = () => {
    return subscription ? getPlanById(subscription.planId) : undefined;
  };

  const upgradeToUser = async (planId: PlanType) => {
    if (!userProfile || !subscription) return;
    
    try {
      // In a real app, this would integrate with Stripe or your payment processor
      const now = new Date();
      const endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const updatedSubscription: UserSubscription = {
        ...subscription,
        planId,
        currentPeriodStart: now,
        currentPeriodEnd: endOfPeriod,
        updatedAt: now,
      };

      setSubscription(updatedSubscription);
      localStorage.setItem(`subscription_${userProfile.id}`, JSON.stringify(updatedSubscription));

      // Update usage limits
      const newPlan = getPlanById(planId);
      if (newPlan && usage) {
        const updatedUsage: UsageMetrics = {
          ...usage,
          planId,
          limits: newPlan.limits,
        };
        setUsage(updatedUsage);
        localStorage.setItem(`usage_${userProfile.id}`, JSON.stringify(updatedUsage));
      }

      toast({
        title: "Plan Updated! 🎉",
        description: `You've successfully upgraded to the ${newPlan?.name} plan.`,
      });
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast({
        variant: "destructive",
        title: "Upgrade Failed",
        description: "There was an error upgrading your plan. Please try again.",
      });
    }
  };

  const trackUsage = (action: 'deal_created' | 'payment_processed', amount?: number) => {
    if (!usage || !userProfile) return;

    const updatedUsage = { ...usage };

    switch (action) {
      case 'deal_created':
        updatedUsage.usage.dealsCreated += 1;
        break;
      case 'payment_processed':
        if (amount) {
          updatedUsage.usage.transactionVolume += amount;
        }
        break;
    }

    setUsage(updatedUsage);
    localStorage.setItem(`usage_${userProfile.id}`, JSON.stringify(updatedUsage));
  };

  const getRemainingLimits = () => {
    if (!subscription || !usage) {
      return { deals: 0, transactionVolume: 0 };
    }

    const plan = getPlanById(subscription.planId);
    if (!plan) {
      return { deals: 0, transactionVolume: 0 };
    }

    return {
      deals: plan.limits.dealsPerMonth === -1 
        ? 'unlimited' 
        : Math.max(0, plan.limits.dealsPerMonth - usage.usage.dealsCreated),
      transactionVolume: plan.limits.transactionVolume === -1 
        ? 'unlimited' 
        : Math.max(0, plan.limits.transactionVolume - usage.usage.transactionVolume),
    };
  };

  const value = {
    subscription,
    usage,
    loading,
    canCreateDeal,
    canProcessPayment,
    canUseAPI,
    canUseBulkPayouts,
    getCurrentPlan,
    upgradeToUser,
    trackUsage,
    getRemainingLimits,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

function getNextPlan(currentPlan: PlanType): PlanType {
  const planOrder: PlanType[] = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlan);
  return planOrder[currentIndex + 1] || 'enterprise';
}
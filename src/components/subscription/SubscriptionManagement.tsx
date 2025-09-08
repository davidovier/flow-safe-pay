import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Crown, Users, TrendingUp, Calendar, CreditCard, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PricingTier {
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  name: string;
  description: string;
  basePrice: number;
  perCreatorPrice: number;
  maxCreators: number;
  platformFeeRate: number;
  features: string[];
}

interface SubscriptionDetails {
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';
  currentPeriodEnd: string;
  trialEndsAt?: string;
  creatorCount: number;
  monthlyCost: number;
  utilizationPercentage: number;
  recommendedTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  billingCycle: string;
  platformFeeRate: number;
  isTrialing: boolean;
}

interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  invoiceUrl: string | null;
  periodStart: string;
  periodEnd: string;
}

const PRICING_TIERS: Record<string, PricingTier> = {
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
  },
};

export function SubscriptionManagement() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Get user's agency ID from profile
      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('Not authenticated');

      // Mock API calls - replace with actual API calls
      const agencyResponse = await fetch('/api/agencies/me', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      
      if (!agencyResponse.ok) throw new Error('Failed to load agency data');
      const agency = await agencyResponse.json();

      // Load subscription details
      const subscriptionResponse = await fetch(`/api/subscriptions/agency/${agency.id}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscription(subscriptionData);

        // Load billing history
        const billingResponse = await fetch(`/api/subscriptions/agency/${agency.id}/billing-history`, {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        });

        if (billingResponse.ok) {
          const billingData = await billingResponse.json();
          setBillingHistory(billingData.invoices || []);
        }
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    try {
      setUpgrading(true);
      setSelectedTier(tier);

      // Create Stripe checkout session
      const response = await fetch('/api/subscriptions/checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          tier,
          successUrl: `${window.location.origin}/dashboard/subscription?success=true`,
          cancelUrl: `${window.location.origin}/dashboard/subscription?canceled=true`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout session');

      const { url } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start upgrade process',
        variant: 'destructive',
      });
      setUpgrading(false);
      setSelectedTier(null);
    }
  };

  const handleCancelSubscription = async (immediate = false) => {
    try {
      if (!subscription) return;

      const { data: profile } = await supabase.auth.getUser();
      if (!profile.user) throw new Error('Not authenticated');

      const response = await fetch(`/api/subscriptions/agency/${subscription.agencyId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ immediate }),
      });

      if (!response.ok) throw new Error('Failed to cancel subscription');

      toast({
        title: 'Success',
        description: immediate 
          ? 'Subscription canceled immediately' 
          : 'Subscription will be canceled at the end of current period',
      });

      setCancelDialogOpen(false);
      loadSubscriptionData();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      TRIALING: 'secondary',
      ACTIVE: 'default',
      PAST_DUE: 'destructive',
      CANCELED: 'destructive',
      INCOMPLETE: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Subscription Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            You don't have an active subscription. Choose a plan to get started.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.values(PRICING_TIERS).map((tier) => (
              <Card key={tier.tier} className="relative">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    {tier.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${tier.basePrice}/mo</div>
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => handleUpgrade(tier.tier)}
                    disabled={upgrading}
                  >
                    {upgrading && selectedTier === tier.tier && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentTier = PRICING_TIERS[subscription.tier];

  return (
    <div className="space-y-6">
      {/* Current Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Subscription</span>
            {getStatusBadge(subscription.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h3 className="font-semibold mb-2">{currentTier.name} Plan</h3>
              <p className="text-sm text-muted-foreground mb-4">{currentTier.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Monthly Cost:</span>
                  <span className="font-semibold">${subscription.monthlyCost}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee:</span>
                  <span>{subscription.platformFeeRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Billing Cycle:</span>
                  <span className="capitalize">{subscription.billingCycle}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" />
                <span className="font-semibold">Creator Usage</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{subscription.creatorCount} of {currentTier.maxCreators} creators</span>
                  <span>{Math.round(subscription.utilizationPercentage)}% used</span>
                </div>
                <Progress value={subscription.utilizationPercentage} className="h-2" />
              </div>

              {subscription.utilizationPercentage > 80 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      Approaching Limit
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Consider upgrading to {PRICING_TIERS[subscription.recommendedTier].name} 
                    for more creators and better rates.
                  </p>
                </div>
              )}
            </div>
          </div>

          {subscription.isTrialing && subscription.trialEndsAt && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Free Trial Active</span>
              </div>
              <p className="text-sm text-blue-800 mt-1">
                Your free trial ends on {formatDate(subscription.trialEndsAt)}. 
                Your subscription will automatically start after the trial period.
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {subscription.tier !== 'ENTERPRISE' && (
              <Button onClick={() => handleUpgrade('PROFESSIONAL')} disabled={upgrading}>
                {upgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade Plan
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => setCancelDialogOpen(true)}
              disabled={subscription.status === 'CANCELED'}
            >
              Cancel Subscription
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.values(PRICING_TIERS).map((tier) => (
              <Card 
                key={tier.tier} 
                className={`relative ${tier.tier === subscription.tier ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    {tier.name}
                    {tier.tier === subscription.tier && (
                      <Badge variant="default">Current</Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${tier.basePrice}/mo</div>
                  <p className="text-sm text-muted-foreground">
                    + ${tier.perCreatorPrice}/creator after {Math.floor(tier.maxCreators / 2)}
                  </p>
                  
                  <ul className="mt-4 space-y-2">
                    {tier.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {tier.tier !== subscription.tier && (
                    <Button 
                      className="w-full mt-4" 
                      onClick={() => handleUpgrade(tier.tier)}
                      disabled={upgrading}
                      variant={tier.tier === subscription.recommendedTier ? 'default' : 'outline'}
                    >
                      {upgrading && selectedTier === tier.tier && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {tier.tier === subscription.recommendedTier ? 'Recommended' : 'Switch Plan'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {billingHistory.length === 0 ? (
            <p className="text-muted-foreground">No billing history available.</p>
          ) : (
            <div className="space-y-4">
              {billingHistory.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {formatCurrency(invoice.amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                      {invoice.status}
                    </Badge>
                    {invoice.invoiceUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={invoice.invoiceUrl} target="_blank" rel="noopener noreferrer">
                          Download
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your subscription? This action cannot be undone.
              You can choose to cancel immediately or at the end of your current billing period.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction 
              variant="outline"
              onClick={() => handleCancelSubscription(false)}
            >
              Cancel at Period End
            </AlertDialogAction>
            <AlertDialogAction 
              variant="destructive"
              onClick={() => handleCancelSubscription(true)}
            >
              Cancel Immediately
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
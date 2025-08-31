import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Zap, 
  Shield, 
  Crown, 
  Building,
  ArrowLeft,
  Star
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, PlanType } from '@/types/subscription';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const { subscription, getCurrentPlan, upgradeToUser, loading } = useSubscription();
  const navigate = useNavigate();

  const currentPlan = getCurrentPlan();

  const planIcons = {
    free: Zap,
    starter: Shield,
    professional: Crown,
    enterprise: Building,
  };

  const handlePlanSelect = async (planId: PlanType) => {
    if (!userProfile) {
      navigate('/auth');
      return;
    }

    if (subscription?.planId === planId) return;

    await upgradeToUser(planId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(userProfile ? '/dashboard' : '/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {userProfile ? t('dashboard') : t('home')}
              </Button>
            </div>
            {!userProfile && (
              <Button onClick={() => navigate('/auth')}>{t('signIn')}</Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('chooseYourPlan')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('startFreeScale')}
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>
              {t('monthly')}
            </Label>
            <Switch
              id="billing-toggle"
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
              {t('yearly')}
            </Label>
            <Badge variant="secondary" className="ml-2">
              {t('save17Percent')}
            </Badge>
          </div>
        </div>

        {/* Current Plan Notice */}
        {currentPlan && (
          <div className="text-center mb-8">
            <Badge variant="secondary" className="text-sm">
              {t('currentlyOnPlan', { plan: currentPlan.name })}
            </Badge>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const Icon = planIcons[plan.id];
            const isCurrentPlan = subscription?.planId === plan.id;
            const price = isYearly && plan.yearlyPrice ? plan.yearlyPrice / 12 : plan.price;
            const yearlyPrice = plan.yearlyPrice;

            return (
              <Card 
                key={plan.id} 
                className={`relative border-2 ${
                  plan.popular 
                    ? 'border-primary shadow-lg scale-105' 
                    : isCurrentPlan 
                    ? 'border-success' 
                    : 'border-border'
                } ${plan.id === 'enterprise' ? 'bg-gradient-to-b from-primary/5 to-background' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      {t('mostPopular')}
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge variant="success" className="px-4 py-1">
                      {t('currentPlan')}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold">
                      ${price.toFixed(0)}
                      <span className="text-lg text-muted-foreground font-normal">/mo</span>
                    </div>
                    {isYearly && yearlyPrice && (
                      <div className="text-sm text-muted-foreground">
                        ${yearlyPrice}/year • Save ${((plan.price * 12) - yearlyPrice).toFixed(0)}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Key Limits */}
                  <div className="space-y-2 pb-4 border-b">
                    <div className="flex justify-between text-sm">
                      <span>{t('dealsPerMonth')}</span>
                      <span className="font-semibold">
                        {plan.limits.dealsPerMonth === -1 ? t('unlimited') : plan.limits.dealsPerMonth}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t('transactionVolume')}</span>
                      <span className="font-semibold">
                        {plan.limits.transactionVolume === -1 
                          ? t('unlimited') 
                          : `$${plan.limits.transactionVolume.toLocaleString()}/mo`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>{t('platformFee')}</span>
                      <span className="font-semibold">
                        {plan.id === 'free' ? '3.5%' : 
                         plan.id === 'starter' ? '2.5%' :
                         plan.id === 'professional' ? '2%' : '1.5%'}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2">
                    {plan.features.slice(0, 6).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : isCurrentPlan ? "secondary" : "outline"}
                    disabled={loading || isCurrentPlan}
                    onClick={() => handlePlanSelect(plan.id)}
                  >
                    {isCurrentPlan 
                      ? t('currentPlan') 
                      : subscription && subscription.planId !== 'free' && plan.id === 'free'
                      ? t('downgrade')
                      : plan.id === 'free' 
                      ? t('getStartedFree') 
                      : t('upgradeNow')
                    }
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">{t('pricingFAQ')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold mb-2">{t('faqChangePlans')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('faqChangePlansAnswer')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('faqExceedLimits')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('faqExceedLimitsAnswer')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('faqFreeTrial')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('faqFreeTrialAnswer')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('faqPlatformFees')}</h3>
              <p className="text-muted-foreground text-sm">
                {t('faqPlatformFeesAnswer')}
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">{t('trustedByThousands')}</p>
          <div className="flex justify-center items-center gap-6 opacity-60">
            <Shield className="h-6 w-6" />
            <span className="text-sm font-medium">{t('soc2Compliant')}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm font-medium">{t('pciDssLevel1')}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm font-medium">{t('uptimeGuarantee')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
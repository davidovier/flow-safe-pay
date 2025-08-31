import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  Crown, 
  ArrowUp 
} from 'lucide-react';

export function UsageDashboard() {
  const { 
    subscription, 
    usage, 
    getCurrentPlan, 
    getRemainingLimits,
    loading 
  } = useSubscription();
  const navigate = useNavigate();

  if (loading || !subscription || !usage) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = getCurrentPlan();
  const remaining = getRemainingLimits();

  if (!currentPlan) return null;

  const dealsUsedPercent = currentPlan.limits.dealsPerMonth === -1 
    ? 0 
    : (usage.usage.dealsCreated / currentPlan.limits.dealsPerMonth) * 100;

  const volumeUsedPercent = currentPlan.limits.transactionVolume === -1 
    ? 0 
    : (usage.usage.transactionVolume / currentPlan.limits.transactionVolume) * 100;

  const isNearLimit = dealsUsedPercent > 80 || volumeUsedPercent > 80;
  const isOverLimit = dealsUsedPercent > 100 || volumeUsedPercent > 100;

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {currentPlan.id === 'free' && <Zap className="h-5 w-5 text-primary" />}
              {currentPlan.id === 'starter' && <TrendingUp className="h-5 w-5 text-primary" />}
              {currentPlan.id === 'professional' && <Crown className="h-5 w-5 text-primary" />}
              {currentPlan.id === 'enterprise' && <Crown className="h-5 w-5 text-primary" />}
              {currentPlan.name} Plan
            </CardTitle>
            <CardDescription>
              {currentPlan.description}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">
              ${currentPlan.price}
              <span className="text-sm text-muted-foreground font-normal">/mo</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/pricing')}
              className="mt-2"
            >
              <ArrowUp className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Usage Alerts */}
      {(isNearLimit || isOverLimit) && (
        <Card className={`border-${isOverLimit ? 'destructive' : 'warning'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              {isOverLimit ? 'Usage Limit Exceeded' : 'Approaching Usage Limits'}
            </CardTitle>
            <CardDescription>
              {isOverLimit 
                ? "You've exceeded your plan limits. Upgrade to continue using FlowPay without interruption."
                : "You're approaching your plan limits. Consider upgrading to avoid interruptions."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/pricing')}>
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deals Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deals This Month</CardTitle>
            <CardDescription>
              {usage.usage.dealsCreated} of {currentPlan.limits.dealsPerMonth === -1 ? '∞' : currentPlan.limits.dealsPerMonth} used
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPlan.limits.dealsPerMonth !== -1 && (
              <Progress 
                value={Math.min(dealsUsedPercent, 100)} 
                className="w-full"
              />
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium">
                {remaining.deals === 'unlimited' ? '∞' : remaining.deals} deals
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaction Volume</CardTitle>
            <CardDescription>
              ${usage.usage.transactionVolume.toLocaleString()} of ${currentPlan.limits.transactionVolume === -1 ? '∞' : currentPlan.limits.transactionVolume.toLocaleString()} processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentPlan.limits.transactionVolume !== -1 && (
              <Progress 
                value={Math.min(volumeUsedPercent, 100)} 
                className="w-full"
              />
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining</span>
              <span className="font-medium">
                {remaining.transactionVolume === 'unlimited' 
                  ? '∞' 
                  : `$${remaining.transactionVolume.toLocaleString()}`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Your Plan Includes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="w-fit">
                {currentPlan.id === 'free' ? '3.5%' : 
                 currentPlan.id === 'starter' ? '2.5%' :
                 currentPlan.id === 'professional' ? '2%' : '1.5%'}
              </Badge>
              <span className="text-sm">Platform fee</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={currentPlan.limits.customBranding ? "success" : "secondary"}>
                {currentPlan.limits.customBranding ? '✓' : '✗'}
              </Badge>
              <span className="text-sm">Custom branding</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={currentPlan.limits.apiAccess ? "success" : "secondary"}>
                {currentPlan.limits.apiAccess ? '✓' : '✗'}
              </Badge>
              <span className="text-sm">API access</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={currentPlan.limits.advancedAnalytics ? "success" : "secondary"}>
                {currentPlan.limits.advancedAnalytics ? '✓' : '✗'}
              </Badge>
              <span className="text-sm">Advanced analytics</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant={currentPlan.limits.bulkPayouts ? "success" : "secondary"}>
                {currentPlan.limits.bulkPayouts ? '✓' : '✗'}
              </Badge>
              <span className="text-sm">Bulk payouts</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {currentPlan.limits.supportLevel}
              </Badge>
              <span className="text-sm">Support level</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
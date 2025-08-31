import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getPlanById, PlanType } from '@/types/subscription';
import { 
  Crown, 
  Zap, 
  X, 
  ArrowRight,
  Lock,
  TrendingUp
} from 'lucide-react';

interface UpgradePromptProps {
  reason: string;
  suggestedPlan?: PlanType;
  feature?: string;
  onDismiss?: () => void;
  variant?: 'card' | 'banner' | 'inline';
  blocking?: boolean; // If true, shows as a blocking modal-like experience
}

export function UpgradePrompt({ 
  reason, 
  suggestedPlan = 'starter', 
  feature,
  onDismiss,
  variant = 'card',
  blocking = false
}: UpgradePromptProps) {
  const navigate = useNavigate();
  const { getCurrentPlan } = useSubscription();
  
  const currentPlan = getCurrentPlan();
  const targetPlan = getPlanById(suggestedPlan);
  
  if (!targetPlan) return null;

  const planIcon = suggestedPlan === 'starter' ? Zap : 
                   suggestedPlan === 'professional' ? Crown :
                   suggestedPlan === 'enterprise' ? Crown : TrendingUp;
  
  const PlanIcon = planIcon;

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-l-4 border-primary p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/20 rounded-full">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">{reason}</p>
              {feature && (
                <p className="text-sm text-muted-foreground">
                  Upgrade to access {feature}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={handleUpgrade}>
              Upgrade to {targetPlan.name}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{reason}</span>
        </div>
        <Button size="sm" variant="outline" onClick={handleUpgrade}>
          Upgrade
        </Button>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`${blocking ? 'shadow-lg border-primary' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <PlanIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Upgrade Required</CardTitle>
              <CardDescription>{reason}</CardDescription>
            </div>
          </div>
          {onDismiss && !blocking && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {feature && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm">
              <strong>{feature}</strong> is available on the {targetPlan.name} plan and above.
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{targetPlan.name} Plan</p>
            <p className="text-2xl font-bold">
              ${targetPlan.price}
              <span className="text-sm text-muted-foreground font-normal">/month</span>
            </p>
          </div>
          
          {currentPlan && (
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                Current: {currentPlan.name}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Save on platform fees: {
                  currentPlan.id === 'free' ? '3.5%' : 
                  currentPlan.id === 'starter' ? '2.5%' :
                  currentPlan.id === 'professional' ? '2%' : '1.5%'
                } → {
                  targetPlan.id === 'starter' ? '2.5%' :
                  targetPlan.id === 'professional' ? '2%' : '1.5%'
                }
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">What you'll get:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            {targetPlan.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      
      <CardFooter className="flex space-x-2">
        <Button onClick={handleUpgrade} className="flex-1">
          Upgrade to {targetPlan.name}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        {!blocking && onDismiss && (
          <Button variant="outline" onClick={onDismiss}>
            Later
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
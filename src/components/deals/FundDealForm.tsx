import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  CreditCard, 
  Shield, 
  Info, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';

const fundingSchema = z.object({
  payment_method_id: z.string().min(1, 'Please select a payment method'),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  auto_release_enabled: z.boolean().default(true),
  auto_release_days: z.number().min(1).max(30).default(5),
});

type FundingForm = z.infer<typeof fundingSchema>;

interface Deal {
  id: string;
  amount_total: number;
  currency: string;
  state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  projects: {
    title: string;
  };
  users: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  milestones: Array<{
    id: string;
    title: string;
    amount: number;
  }>;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  bank_name?: string;
}

interface FundDealFormProps {
  deal: Deal;
  onSuccess: () => void;
  onCancel: () => void;
}

export function FundDealForm({ deal, onSuccess, onCancel }: FundDealFormProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  const form = useForm<FundingForm>({
    resolver: zodResolver(fundingSchema),
    defaultValues: {
      payment_method_id: '',
      terms_accepted: false,
      auto_release_enabled: true,
      auto_release_days: 5,
    },
  });

  const autoReleaseEnabled = form.watch('auto_release_enabled');
  const autoReleaseDays = form.watch('auto_release_days');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    if (!userProfile) return;

    try {
      setLoadingPaymentMethods(true);
      
      // For now, use mock payment methods until payment_methods table is created
      const mockPaymentMethods = [
        {
          id: 'default-card',
          type: 'card' as const,
          last4: '****',
          brand: 'visa'
        }
      ];
      
      setPaymentMethods(mockPaymentMethods);
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load payment methods.',
      });
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  const onSubmit = async (data: FundingForm) => {
    if (!userProfile) return;

    setIsLoading(true);
    try {
      // Call backend API to fund the deal
      const response = await fetch('/api/deals/fund', {
        method: 'POST',
        headers: {
          // Remove Authorization header with access_token
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deal_id: deal.id,
          payment_method_id: data.payment_method_id,
          auto_release_enabled: data.auto_release_enabled,
          auto_release_days: data.auto_release_days,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fund deal');
      }

      const result = await response.json();

      // Update deal state in Supabase
      const { error: updateError } = await supabase
        .from('deals')
        .update({
          state: 'FUNDED',
          escrow_id: result.escrow_id,
          funded_at: new Date().toISOString(),
        })
        .eq('id', deal.id);

      if (updateError) throw updateError;

      // Log funding event
      await supabase.from('events').insert({
        actor_user_id: userProfile.id,
        type: 'deal.funded',
        payload: {
          deal_id: deal.id,
          escrow_id: result.escrow_id,
          amount_total: deal.amount_total,
          payment_method_id: data.payment_method_id,
          auto_release_enabled: data.auto_release_enabled,
          auto_release_days: data.auto_release_days,
        },
      });

      toast({
        title: 'Deal Funded Successfully! 🎉',
        description: 'Funds have been securely escrowed. The creator can now start working on milestones.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Funding error:', error);
      toast({
        variant: 'destructive',
        title: 'Funding Failed',
        description: error.message || 'Failed to fund deal. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getCreatorName = () => {
    if (!deal.users) return 'Creator';
    const name = `${deal.users.first_name || ''} ${deal.users.last_name || ''}`.trim();
    return name || deal.users.email;
  };

  const getPaymentMethodDisplay = (pm: PaymentMethod) => {
    if (pm.type === 'card') {
      return `${pm.brand?.toUpperCase()} •••• ${pm.last4}`;
    } else {
      return `${pm.bank_name} •••• ${pm.last4}`;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Fund Deal
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">{deal.projects.title}</p>
          <p>Creator: {getCreatorName()}</p>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Deal Summary */}
          <Card className="bg-muted/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Deal Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatAmount(deal.amount_total, deal.currency)}
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="font-medium text-sm">Milestones:</p>
                {deal.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex justify-between text-sm">
                    <span>{index + 1}. {milestone.title}</span>
                    <span>{formatAmount(milestone.amount, deal.currency)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label htmlFor="payment_method_id">Payment Method</Label>
            {loadingPaymentMethods ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : paymentMethods.length === 0 ? (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No payment methods found. Please add a payment method in your account settings before funding deals.
                </AlertDescription>
              </Alert>
            ) : (
              <Select onValueChange={(value) => form.setValue('payment_method_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        {getPaymentMethodDisplay(pm)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {form.formState.errors.payment_method_id && (
              <p className="text-sm text-red-600">
                {form.formState.errors.payment_method_id.message}
              </p>
            )}
          </div>

          {/* Auto-Release Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Auto-Release Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="auto_release_enabled"
                  checked={autoReleaseEnabled}
                  onCheckedChange={(checked) => 
                    form.setValue('auto_release_enabled', checked as boolean)
                  }
                />
                <Label htmlFor="auto_release_enabled" className="text-sm">
                  Enable automatic release
                </Label>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Automatically release milestone payments if you don't review within the specified timeframe.
              </p>

              {autoReleaseEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="auto_release_days">Auto-release after (days)</Label>
                  <Select 
                    value={autoReleaseDays.toString()} 
                    onValueChange={(value) => form.setValue('auto_release_days', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 5, 7, 10, 14, 30].map((days) => (
                        <SelectItem key={days} value={days.toString()}>
                          {days} days
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Recommended: 5 days. Gives you time to review while ensuring timely payments.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              <strong>Secure Escrow:</strong> Your funds will be held securely in escrow until milestones are completed and approved. Funds can only be released to the creator upon your approval or automatic release (if enabled).
            </AlertDescription>
          </Alert>

          {/* Terms and Conditions */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms_accepted"
                checked={form.watch('terms_accepted')}
                onCheckedChange={(checked) => 
                  form.setValue('terms_accepted', checked as boolean)
                }
              />
              <div className="space-y-1">
                <Label htmlFor="terms_accepted" className="text-sm leading-none">
                  I accept the terms and conditions
                </Label>
                <p className="text-xs text-muted-foreground">
                  By funding this deal, you agree to FlowPay's{' '}
                  <a href="/terms" target="_blank" className="underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" target="_blank" className="underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
            {form.formState.errors.terms_accepted && (
              <p className="text-sm text-red-600">
                {form.formState.errors.terms_accepted.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || paymentMethods.length === 0}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Fund Deal {formatAmount(deal.amount_total, deal.currency)}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
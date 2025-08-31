import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, Clock, CheckCircle, AlertCircle, CreditCard, Landmark, Plus, Download, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Payout {
  id: string;
  deal_id?: string;
  user_id: string;
  payment_method_id?: string;
  amount: number;
  amount_requested: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  description: string;
  requested_at: string;
  processed_at?: string;
  failed_reason?: string;
  currency: string;
  // Joined data
  payment_method?: {
    id: string;
    type: string;
    name: string;
    details: any;
  };
  deal?: {
    id: string;
    project?: {
      title: string;
      users?: {
        first_name: string;
        last_name: string;
      };
    };
  };
}

interface PaymentMethod {
  id: string;
  type: 'bank_transfer' | 'paypal' | 'stripe';
  name: string;
  details: any;
  is_default: boolean;
  is_verified: boolean;
}

interface UserBalance {
  available_amount: number;
  pending_amount: number;
  total_earned: number;
  currency: string;
}

export default function Payouts() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [userBalance, setUserBalance] = useState<UserBalance>({
    available_amount: 0,
    pending_amount: 0,
    total_earned: 0,
    currency: 'usd'
  });
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [payoutLoading, setPayoutLoading] = useState(false);
  
  // Modal states
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  useEffect(() => {
    if (userProfile?.role === 'CREATOR') {
      fetchPayoutData();
    }
  }, [userProfile]);

  const fetchPayoutData = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      // Fetch payouts with related data
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('payouts')
        .select(`
          *,
          payment_methods!payment_method_id (
            id, type, name, details
          ),
          deals!deal_id (
            id,
            projects!project_id (
              title,
              users!brand_id (
                first_name, last_name
              )
            )
          )
        `)
        .eq('user_id', userProfile.id)
        .order('requested_at', { ascending: false });

      if (payoutsError) throw payoutsError;

      // Fetch payment methods
      const { data: paymentMethodsData, error: paymentMethodsError } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('is_default', { ascending: false });

      if (paymentMethodsError) throw paymentMethodsError;

      // Fetch user balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('user_balances')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('currency', 'usd')
        .single();

      // If no balance record exists, create one by calling the calculation function
      if (balanceError?.code === 'PGRST116') {
        const { error: updateError } = await supabase.rpc('update_user_balance', {
          user_uuid: userProfile.id
        });
        
        if (!updateError) {
          // Fetch again after creation
          const { data: newBalanceData } = await supabase
            .from('user_balances')
            .select('*')
            .eq('user_id', userProfile.id)
            .eq('currency', 'usd')
            .single();
          
          if (newBalanceData) {
            setUserBalance(newBalanceData);
          }
        }
      } else if (!balanceError && balanceData) {
        setUserBalance(balanceData);
      }

      setPayouts(payoutsData || []);
      setPaymentMethods(paymentMethodsData || []);

    } catch (error) {
      console.error('Error fetching payout data:', error);
      toast({
        title: "Error",
        description: "Failed to load payout information. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!userProfile) return;
    
    const amount = parseFloat(selectedAmount);
    const amountCents = Math.round(amount * 100);
    
    if (!amount || amount <= 0 || amountCents > userBalance.available_amount) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a valid amount. Available: $${(userBalance.available_amount / 100).toFixed(2)}`,
        variant: "destructive"
      });
      return;
    }

    if (!selectedPaymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive"
      });
      return;
    }

    setPayoutLoading(true);
    try {
      const { data, error } = await supabase.rpc('request_payout', {
        user_uuid: userProfile.id,
        amount_cents: amountCents,
        payment_method_uuid: selectedPaymentMethod,
        description_text: 'Balance withdrawal request'
      });

      if (error) throw error;

      toast({
        title: "Payout Requested! 💰",
        description: `Your $${amount.toFixed(2)} payout request has been submitted and will be processed within 1-3 business days.`,
      });

      // Refresh data and close modal
      await fetchPayoutData();
      setIsPayoutModalOpen(false);
      setSelectedAmount('');
      setSelectedPaymentMethod('');

    } catch (error: any) {
      console.error('Error requesting payout:', error);
      toast({
        title: "Payout Request Failed",
        description: error.message || "Failed to submit payout request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPayoutLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'default';
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return <Landmark className="h-4 w-4" />;
      case 'paypal': return <CreditCard className="h-4 w-4" />;
      case 'stripe': return <CreditCard className="h-4 w-4" />;
      default: return <Wallet className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportPayouts = async () => {
    try {
      const csvContent = [
        ['Date', 'Amount', 'Status', 'Payment Method', 'Description'].join(','),
        ...payouts.map(payout => [
          formatDate(payout.requested_at),
          `$${(payout.amount / 100).toFixed(2)}`,
          payout.status,
          payout.payment_method?.name || 'N/A',
          payout.description
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `payouts-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Your payout history has been downloaded as a CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export payout history. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (!userProfile || userProfile.role !== 'CREATOR') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is for creators only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'processing');
  const availableBalance = userBalance.available_amount / 100;
  const totalEarnings = userBalance.total_earned / 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground">Manage your earnings and payment requests</p>
        </div>
        <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
          <DialogTrigger asChild>
            <Button disabled={availableBalance <= 0}>
              <Plus className="h-4 w-4 mr-2" />
              Request Payout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Request Payout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                    max={availableBalance}
                    step="0.01"
                    disabled={payoutLoading}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Available balance: ${availableBalance.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod} disabled={payoutLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(method.type)}
                          <span>{method.name}</span>
                          {method.is_verified && <CheckCircle className="h-3 w-3 text-success" />}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {paymentMethods.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No payment methods configured. Add one below.
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsPayoutModalOpen(false)}
                  disabled={payoutLoading}
                >
                  Cancel
                </Button>
                <Button onClick={handleRequestPayout} disabled={payoutLoading}>
                  {payoutLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Request Payout
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Balance Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${availableBalance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Ready to withdraw</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPayouts.length}</div>
            <p className="text-xs text-muted-foreground">Being processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payouts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Recent Payouts</h2>
          <Button variant="outline" size="sm" onClick={exportPayouts} disabled={payouts.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        {payouts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payouts yet. Complete deals to start earning!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {payouts.map((payout) => (
              <Card key={payout.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">${(payout.amount / 100).toFixed(2)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {payout.deal?.project?.users?.first_name && payout.deal?.project?.users?.last_name 
                          ? `${payout.deal.project.users.first_name} ${payout.deal.project.users.last_name} • ${payout.deal.project.title}`
                          : payout.description
                        }
                      </p>
                    </div>
                    <Badge 
                      variant={getStatusColor(payout.status) as any}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(payout.status)}
                      {payout.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{payout.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        {getPaymentMethodIcon(payout.payment_method?.type || '')}
                        <span className="capitalize">
                          {payout.payment_method?.name || 'N/A'}
                        </span>
                      </div>
                      <span>•</span>
                      <span>
                        Requested: {formatDate(payout.requested_at)}
                      </span>
                      {payout.processed_at && (
                        <>
                          <span>•</span>
                          <span>
                            Processed: {formatDate(payout.processed_at)}
                          </span>
                        </>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>
                  {payout.failed_reason && (
                    <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-sm text-destructive">
                      <strong>Failed:</strong> {payout.failed_reason}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Payment Methods</h2>
        <div className="grid gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className={method.is_default ? 'ring-2 ring-primary' : ''}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  {getPaymentMethodIcon(method.type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{method.name}</p>
                      {method.is_verified && <CheckCircle className="h-4 w-4 text-success" />}
                      {!method.is_verified && <AlertCircle className="h-4 w-4 text-warning" />}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {method.type === 'bank_transfer' && method.details?.account_number
                        ? `Account ${method.details.account_number}`
                        : method.type === 'paypal' && method.details?.email
                        ? method.details.email
                        : method.type === 'stripe' && method.details?.last4
                        ? `Card ending in ${method.details.last4}`
                        : 'No details available'
                      }
                    </p>
                  </div>
                  {method.is_default && (
                    <Badge variant="secondary" className="ml-2">Default</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </CardContent>
            </Card>
          ))}
          <Button variant="outline" className="h-16 border-dashed">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      </div>
    </div>
  );
}
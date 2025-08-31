import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, Clock, CheckCircle, AlertCircle, CreditCard, Bank, Plus, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Payout {
  id: string;
  dealId: string;
  dealTitle: string;
  brandName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedDate: string;
  completedDate?: string;
  paymentMethod: 'bank_transfer' | 'paypal' | 'stripe';
  description: string;
}

interface PaymentMethod {
  id: string;
  type: 'bank_transfer' | 'paypal' | 'stripe';
  name: string;
  details: string;
  isDefault: boolean;
}

export default function Payouts() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  // Mock data - in real app this would come from API
  const [payouts, setPayouts] = useState<Payout[]>([
    {
      id: '1',
      dealId: 'deal-1',
      dealTitle: 'Summer Campaign Video',
      brandName: 'TechFlow',
      amount: 500,
      status: 'completed',
      requestedDate: '2025-08-20',
      completedDate: '2025-08-22',
      paymentMethod: 'bank_transfer',
      description: 'Payment for completed Instagram reel campaign'
    },
    {
      id: '2',
      dealId: 'deal-2',
      dealTitle: 'Brand Partnership',
      brandName: 'StyleCo',
      amount: 750,
      status: 'processing',
      requestedDate: '2025-08-25',
      paymentMethod: 'paypal',
      description: 'YouTube video collaboration payment'
    },
    {
      id: '3',
      dealId: 'deal-3',
      dealTitle: 'Product Review',
      brandName: 'GearHub',
      amount: 300,
      status: 'pending',
      requestedDate: '2025-08-30',
      paymentMethod: 'stripe',
      description: 'Product review and photo content'
    }
  ]);

  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'bank_transfer',
      name: 'Bank Transfer',
      details: 'Chase Bank ****1234',
      isDefault: true
    },
    {
      id: '2',
      type: 'paypal',
      name: 'PayPal',
      details: 'user@example.com',
      isDefault: false
    },
    {
      id: '3',
      type: 'stripe',
      name: 'Debit Card',
      details: 'Visa ****5678',
      isDefault: false
    }
  ]);

  // Mock available balance
  const availableBalance = 1250;
  const totalEarnings = 2800;
  const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'processing');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <AlertCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'secondary';
      case 'completed': return 'success';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'bank_transfer': return <Bank className="h-4 w-4" />;
      case 'paypal': return <CreditCard className="h-4 w-4" />;
      case 'stripe': return <CreditCard className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const handleRequestPayout = () => {
    const amount = parseFloat(selectedAmount);
    if (!amount || amount <= 0 || amount > availableBalance) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount within your available balance.",
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

    // Add new payout request
    const newPayout: Payout = {
      id: Date.now().toString(),
      dealId: 'general',
      dealTitle: 'Balance Withdrawal',
      brandName: 'FlowPay',
      amount: amount,
      status: 'pending',
      requestedDate: new Date().toISOString().split('T')[0],
      paymentMethod: selectedPaymentMethod as any,
      description: 'Balance withdrawal request'
    };

    setPayouts(prev => [newPayout, ...prev]);

    toast({
      title: "Payout Requested! 💰",
      description: `Your $${amount} payout request has been submitted and will be processed within 1-3 business days.`,
    });

    setIsPayoutModalOpen(false);
    setSelectedAmount('');
    setSelectedPaymentMethod('');
  };

  if (!userProfile || userProfile.role !== 'CREATOR') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is for creators only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payouts</h1>
          <p className="text-muted-foreground">Manage your earnings and payment requests</p>
        </div>
        <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
          <DialogTrigger asChild>
            <Button>
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
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    type="number"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-9"
                    max={availableBalance}
                    step="0.01"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Available balance: ${availableBalance.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.id} value={method.type}>
                        <div className="flex items-center space-x-2">
                          {getPaymentMethodIcon(method.type)}
                          <span>{method.name}</span>
                          <span className="text-muted-foreground">- {method.details}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsPayoutModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRequestPayout}>
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
            <DollarSign className="h-4 w-4 text-success" />
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        {payouts.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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
                      <CardTitle className="text-lg">${payout.amount.toFixed(2)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {payout.brandName} • {payout.dealTitle}
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
                        {getPaymentMethodIcon(payout.paymentMethod)}
                        <span className="capitalize">
                          {payout.paymentMethod.replace('_', ' ')}
                        </span>
                      </div>
                      <span>•</span>
                      <span>
                        Requested: {new Date(payout.requestedDate).toLocaleDateString()}
                      </span>
                      {payout.completedDate && (
                        <>
                          <span>•</span>
                          <span>
                            Completed: {new Date(payout.completedDate).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                  </div>
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
            <Card key={method.id} className={method.isDefault ? 'ring-2 ring-primary' : ''}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  {getPaymentMethodIcon(method.type)}
                  <div>
                    <p className="font-medium">{method.name}</p>
                    <p className="text-sm text-muted-foreground">{method.details}</p>
                  </div>
                  {method.isDefault && (
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
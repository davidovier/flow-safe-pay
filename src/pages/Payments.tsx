import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, CreditCard, Clock, CheckCircle, AlertCircle, ArrowUpRight } from 'lucide-react';

interface Payment {
  id: string;
  dealId: string;
  dealTitle: string;
  creatorName: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  paymentDate: string;
  description: string;
}

export default function Payments() {
  const { userProfile } = useAuth();

  // Mock data - in real app this would come from API
  const payments: Payment[] = [
    {
      id: '1',
      dealId: 'deal-1',
      dealTitle: 'Summer Campaign Video',
      creatorName: 'Alice Johnson',
      amount: 500,
      status: 'completed',
      paymentDate: '2025-08-20',
      description: 'Payment for completed Instagram reel campaign'
    },
    {
      id: '2',
      dealId: 'deal-2',
      dealTitle: 'Brand Partnership',
      creatorName: 'Bob Smith',
      amount: 750,
      status: 'processing',
      paymentDate: '2025-08-25',
      description: 'YouTube video collaboration payment in escrow'
    },
    {
      id: '3',
      dealId: 'deal-3',
      dealTitle: 'Product Review',
      creatorName: 'Carol Wilson',
      amount: 300,
      status: 'pending',
      paymentDate: '2025-08-30',
      description: 'Product review and photo content - awaiting approval'
    }
  ];

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
  const totalInEscrow = payments.filter(p => p.status === 'processing').reduce((sum, p) => sum + p.amount, 0);

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

  if (!userProfile || userProfile.role !== 'BRAND') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is for brands only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">Manage creator payments and escrow funds</p>
        </div>
        <Button>
          <CreditCard className="h-4 w-4 mr-2" />
          Add Funds
        </Button>
      </div>

      {/* Payment Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalPaid.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Completed payments</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Escrow</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">${totalInEscrow.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Funds in escrow</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPending.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Recent Payments</h2>
        
        {payments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No payments yet. Create a deal to get started!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">${payment.amount.toFixed(2)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {payment.creatorName} • {payment.dealTitle}
                      </p>
                    </div>
                    <Badge 
                      variant={getStatusColor(payment.status) as any}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{payment.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Payment Date: {new Date(payment.paymentDate).toLocaleDateString()}
                    </div>
                    <Button variant="ghost" size="sm">
                      <ArrowUpRight className="h-4 w-4 mr-2" />
                      View Deal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-5 w-5" />
              <div>
                <p className="font-medium">Stripe Account</p>
                <p className="text-sm text-muted-foreground">Connected and verified</p>
              </div>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
          <Button variant="outline" className="w-full h-16 border-dashed">
            <CreditCard className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
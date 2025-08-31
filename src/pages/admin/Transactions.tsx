import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { CreditCard, Search, Download, TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'payment' | 'payout' | 'refund' | 'fee';
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fromUser: string;
  toUser: string;
  dealId?: string;
  dealTitle?: string;
  date: string;
  paymentMethod: string;
  description: string;
}

export default function AdminTransactions() {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock data - in real app this would come from API
  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'payment',
      amount: 500,
      status: 'completed',
      fromUser: 'TechFlow',
      toUser: 'Alice Johnson',
      dealId: 'deal-1',
      dealTitle: 'Summer Campaign Video',
      date: '2025-08-20T10:30:00Z',
      paymentMethod: 'stripe',
      description: 'Payment for completed deliverable'
    },
    {
      id: '2',
      type: 'payout',
      amount: 475,
      status: 'completed',
      fromUser: 'FlowPay',
      toUser: 'Alice Johnson',
      date: '2025-08-20T11:00:00Z',
      paymentMethod: 'bank_transfer',
      description: 'Creator payout (after 5% fee)'
    },
    {
      id: '3',
      type: 'fee',
      amount: 25,
      status: 'completed',
      fromUser: 'Alice Johnson',
      toUser: 'FlowPay',
      date: '2025-08-20T11:00:00Z',
      paymentMethod: 'platform',
      description: 'Platform fee (5%)'
    },
    {
      id: '4',
      type: 'payment',
      amount: 750,
      status: 'processing',
      fromUser: 'StyleCo',
      toUser: 'Bob Smith',
      dealId: 'deal-2',
      dealTitle: 'Brand Partnership',
      date: '2025-08-25T14:15:00Z',
      paymentMethod: 'stripe',
      description: 'Escrow payment for active deal'
    },
    {
      id: '5',
      type: 'refund',
      amount: 300,
      status: 'pending',
      fromUser: 'FlowPay',
      toUser: 'GearHub',
      dealId: 'deal-3',
      dealTitle: 'Product Review',
      date: '2025-08-30T09:00:00Z',
      paymentMethod: 'stripe',
      description: 'Refund for cancelled deal'
    }
  ];

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.fromUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.toUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.dealTitle && transaction.dealTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment': return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'payout': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'refund': return <TrendingUp className="h-4 w-4 text-warning" />;
      case 'fee': return <DollarSign className="h-4 w-4 text-muted-foreground" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <AlertCircle className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'destructive';
      case 'payout': return 'success';
      case 'refund': return 'warning';
      case 'fee': return 'secondary';
      default: return 'secondary';
    }
  };

  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
  const completedTransactions = transactions.filter(t => t.status === 'completed').length;
  const pendingTransactions = transactions.filter(t => t.status === 'pending' || t.status === 'processing').length;
  const totalFees = transactions.filter(t => t.type === 'fee').reduce((sum, t) => sum + t.amount, 0);

  if (!userProfile || userProfile.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is for administrators only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction Management</h1>
          <p className="text-muted-foreground">Monitor all financial transactions on the platform</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Transaction Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalVolume.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTransactions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{pendingTransactions}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFees.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="payout">Payouts</SelectItem>
            <SelectItem value="refund">Refunds</SelectItem>
            <SelectItem value="fee">Platform Fees</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(transaction.type)}
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">${transaction.amount.toFixed(2)}</span>
                      <Badge variant={getTypeColor(transaction.type) as any} className="text-xs">
                        {transaction.type}
                      </Badge>
                      <Badge variant={getStatusColor(transaction.status) as any} className="flex items-center gap-1 text-xs">
                        {getStatusIcon(transaction.status)}
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{transaction.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">From:</span> {transaction.fromUser}
                    </div>
                    <div>
                      <span className="font-medium">To:</span> {transaction.toUser}
                    </div>
                    <div>
                      <span className="font-medium">Method:</span> {transaction.paymentMethod}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Date:</span> {new Date(transaction.date).toLocaleString()}
                    </div>
                    {transaction.dealTitle && (
                      <div>
                        <span className="font-medium">Deal:</span> {transaction.dealTitle}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            ))}
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No transactions found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
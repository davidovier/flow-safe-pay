import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Eye, 
  Edit, 
  AlertTriangle, 
  DollarSign, 
  Users, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Download,
  Loader2
} from 'lucide-react';

interface Deal {
  id: string;
  amount_total: number;
  currency: string;
  state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  created_at: string;
  updated_at: string;
  funded_at?: string;
  completed_at?: string;
  projects: {
    title: string;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
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
    state: string;
  }>;
}

interface DealStats {
  total: number;
  draft: number;
  funded: number;
  completed: number;
  disputed: number;
  totalValue: number;
}

export function DealsManagement() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<DealStats>({
    total: 0,
    draft: 0,
    funded: 0,
    completed: 0,
    disputed: 0,
    totalValue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    filterDeals();
  }, [deals, searchTerm, statusFilter]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          projects (
            title,
            users!brand_id (
              first_name, last_name, email
            )
          ),
          users (
            first_name, last_name, email
          ),
          milestones (
            id, title, amount, state
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDeals(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      console.error('Error fetching deals:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load deals data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (dealsData: Deal[]) => {
    const stats = dealsData.reduce((acc, deal) => {
      acc.total++;
      acc.totalValue += deal.amount_total;
      
      switch (deal.state) {
        case 'DRAFT':
          acc.draft++;
          break;
        case 'FUNDED':
          acc.funded++;
          break;
        case 'RELEASED':
          acc.completed++;
          break;
        case 'DISPUTED':
          acc.disputed++;
          break;
      }
      
      return acc;
    }, {
      total: 0,
      draft: 0,
      funded: 0,
      completed: 0,
      disputed: 0,
      totalValue: 0
    });
    
    setStats(stats);
  };

  const filterDeals = () => {
    let filtered = deals;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(deal =>
        deal.projects.title.toLowerCase().includes(term) ||
        deal.projects.users.email.toLowerCase().includes(term) ||
        deal.users?.email.toLowerCase().includes(term) ||
        deal.id.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(deal => deal.state === statusFilter);
    }

    setFilteredDeals(filtered);
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'FUNDED': return 'bg-blue-100 text-blue-800';
      case 'RELEASED': return 'bg-green-100 text-green-800';
      case 'DISPUTED': return 'bg-red-100 text-red-800';
      case 'REFUNDED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getBrandName = (deal: Deal) => {
    const brand = deal.projects.users;
    return `${brand.first_name || ''} ${brand.last_name || ''}`.trim() || brand.email;
  };

  const getCreatorName = (deal: Deal) => {
    if (!deal.users) return 'Unassigned';
    return `${deal.users.first_name || ''} ${deal.users.last_name || ''}`.trim() || deal.users.email;
  };

  const exportDeals = () => {
    const csvContent = [
      ['Deal ID', 'Project', 'Brand', 'Creator', 'Amount', 'Status', 'Created Date'].join(','),
      ...filteredDeals.map(deal => [
        deal.id,
        deal.projects.title,
        getBrandName(deal),
        getCreatorName(deal),
        formatAmount(deal.amount_total, deal.currency),
        deal.state,
        formatDate(deal.created_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'deals-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Deals Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage all deals on the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportDeals}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={fetchDeals}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.funded}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(stats.totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by deal ID, project, brand, or creator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="FUNDED">Active</SelectItem>
                <SelectItem value="RELEASED">Completed</SelectItem>
                <SelectItem value="DISPUTED">Disputed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Creator</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    No deals found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-mono text-sm">
                      {deal.id.slice(-8)}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{deal.projects.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{getBrandName(deal)}</div>
                        <div className="text-muted-foreground">{deal.projects.users.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{getCreatorName(deal)}</div>
                        <div className="text-muted-foreground">{deal.users?.email || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatAmount(deal.amount_total, deal.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStateColor(deal.state)}>
                        {deal.state}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {deal.milestones.filter(m => m.state === 'RELEASED').length} / {deal.milestones.length}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(deal.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDeal(deal);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Deal Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Deal Details</DialogTitle>
          </DialogHeader>
          {selectedDeal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">Project</h4>
                  <p>{selectedDeal.projects.title}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <Badge className={getStateColor(selectedDeal.state)}>
                    {selectedDeal.state}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Brand</h4>
                  <p>{getBrandName(selectedDeal)}</p>
                  <p className="text-sm text-muted-foreground">{selectedDeal.projects.users.email}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Creator</h4>
                  <p>{getCreatorName(selectedDeal)}</p>
                  <p className="text-sm text-muted-foreground">{selectedDeal.users?.email || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold">Amount</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(selectedDeal.amount_total, selectedDeal.currency)}
                </p>
              </div>

              <div>
                <h4 className="font-semibold">Milestones ({selectedDeal.milestones.length})</h4>
                <div className="space-y-2">
                  {selectedDeal.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex justify-between items-center p-2 border rounded">
                      <span>{index + 1}. {milestone.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatAmount(milestone.amount)}</span>
                        <Badge variant="outline">{milestone.state}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold">Created</h4>
                  <p>{formatDate(selectedDeal.created_at)}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Last Updated</h4>
                  <p>{formatDate(selectedDeal.updated_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
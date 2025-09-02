import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DealsManagement } from '@/components/admin/DealsManagement';
import { 
  Users, 
  Handshake, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Loader2
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalCreators: number;
  totalBrands: number;
  totalDeals: number;
  activeDeals: number;
  completedDeals: number;
  disputedDeals: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalVolume: number;
  averageDealValue: number;
  platformFeeRevenue: number;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user_email?: string;
  amount?: number;
}

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Check if user has admin access
    if (userProfile?.role !== 'ADMIN') {
      toast({
        variant: 'destructive',
        title: 'Access Denied',
        description: 'You do not have permission to access the admin dashboard.',
      });
      return;
    }

    fetchDashboardData();
  }, [userProfile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data in parallel
      const [usersResult, dealsResult, eventsResult] = await Promise.all([
        supabase.from('users').select('id, role, created_at'),
        supabase.from('deals').select('id, amount_total, currency, state, created_at, updated_at'),
        supabase.from('events').select('*').order('created_at', { ascending: false }).limit(50)
      ]);

      if (usersResult.error) throw usersResult.error;
      if (dealsResult.error) throw dealsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const users = usersResult.data || [];
      const deals = dealsResult.data || [];
      const events = eventsResult.data || [];

      // Calculate stats
      const totalUsers = users.length;
      const totalCreators = users.filter(u => u.role === 'CREATOR').length;
      const totalBrands = users.filter(u => u.role === 'BRAND').length;
      
      const totalDeals = deals.length;
      const activeDeals = deals.filter(d => d.state === 'FUNDED').length;
      const completedDeals = deals.filter(d => d.state === 'RELEASED').length;
      const disputedDeals = deals.filter(d => d.state === 'DISPUTED').length;

      const totalVolume = deals.reduce((sum, deal) => sum + deal.amount_total, 0);
      const averageDealValue = totalDeals > 0 ? totalVolume / totalDeals : 0;

      // Calculate monthly revenue (completed deals from this month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyDeals = deals.filter(d => {
        if (d.state !== 'RELEASED') return false;
        const dealDate = new Date(d.created_at);
        return dealDate.getMonth() === currentMonth && dealDate.getFullYear() === currentYear;
      });
      const monthlyRevenue = monthlyDeals.reduce((sum, deal) => sum + deal.amount_total, 0);

      // Platform fee calculation (assuming 5% fee)
      const platformFeeRevenue = Math.floor(totalVolume * 0.05);
      const totalRevenue = platformFeeRevenue;

      setStats({
        totalUsers,
        totalCreators,
        totalBrands,
        totalDeals,
        activeDeals,
        completedDeals,
        disputedDeals,
        totalRevenue,
        monthlyRevenue: Math.floor(monthlyRevenue * 0.05),
        totalVolume,
        averageDealValue,
        platformFeeRevenue,
      });

      // Process recent activity
      const activities = events.map(event => ({
        id: event.id,
        type: event.type,
        description: getActivityDescription(event),
        timestamp: event.created_at,
        user_email: event.payload?.user_email,
        amount: event.payload?.amount,
      }));

      setRecentActivity(activities);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load dashboard data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityDescription = (event: any) => {
    const payload = event.payload || {};
    
    switch (event.type) {
      case 'deal.created':
        return 'New deal created';
      case 'deal.funded':
        return 'Deal funded';
      case 'milestone.submitted':
        return 'Milestone submitted for review';
      case 'milestone.approved':
        return 'Milestone approved';
      case 'dispute.created':
        return 'Dispute opened';
      case 'user.created':
        return 'New user registered';
      case 'payout.completed':
        return 'Payout processed';
      default:
        return event.type;
    }
  };

  const formatAmount = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deal.created':
      case 'deal.funded':
        return <Handshake className="h-4 w-4 text-blue-600" />;
      case 'milestone.submitted':
      case 'milestone.approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'dispute.created':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'user.created':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'payout.completed':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userProfile?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto py-8">
        <Alert className="max-w-lg mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Monitor platform performance and manage operations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="deals" className="flex items-center gap-2">
            <Handshake className="h-4 w-4" />
            Deals
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalBrands || 0} brands, {stats?.totalCreators || 0} creators
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
                <Handshake className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalDeals || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeDeals || 0} active, {stats?.completedDeals || 0} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? formatAmount(stats.totalVolume) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg: {stats ? formatAmount(stats.averageDealValue) : '$0'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats ? formatAmount(stats.totalRevenue) : '$0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  This month: {stats ? formatAmount(stats.monthlyRevenue) : '$0'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Status Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Deal Status Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Active Deals</span>
                  </div>
                  <Badge variant="outline">{stats?.activeDeals || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Completed Deals</span>
                  </div>
                  <Badge variant="outline">{stats?.completedDeals || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span>Disputed Deals</span>
                  </div>
                  <Badge variant="outline">{stats?.disputedDeals || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {recentActivity.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No recent activity
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deals Management Tab */}
        <TabsContent value="deals">
          <DealsManagement />
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Users Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Users management interface will be implemented in the next phase.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Database Connection</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Stripe Integration</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>S3 Storage</span>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Audit Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Audit log viewer will be implemented in the next phase.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
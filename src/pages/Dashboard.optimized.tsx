// OPTIMIZATION: Progressive loading dashboard with parallel data fetching
import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { 
  Handshake, 
  Clock, 
  CheckCircle,
  Plus,
  TrendingUp,
  Wallet,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalDeals: number;
  activeDeals: number;
  totalAmount: number;
  completedDeals: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentDeals: any[];
  loaded: boolean;
  error?: string;
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData>({
    stats: { totalDeals: 0, activeDeals: 0, totalAmount: 0, completedDeals: 0 },
    recentDeals: [],
    loaded: false
  });
  const navigate = useNavigate();

  // OPTIMIZATION: Progressive loading states
  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    deals: true,
    profile: true
  });

  // OPTIMIZATION: Memoized welcome message
  const welcomeMessage = useMemo(() => {
    if (!userProfile) return t('welcomeToFlowPay');
    
    const name = userProfile.first_name || t('there');
    switch (userProfile.role) {
      case 'CREATOR': return `Welcome back, ${name}! 🎨`;
      case 'BRAND': return `Welcome back, ${name}! 🏢`;
      case 'ADMIN': return `Welcome back, ${name}! ⚡`;
      default: return `Welcome back, ${name}!`;
    }
  }, [userProfile, t]);

  // OPTIMIZATION: Memoized quick actions
  const quickActions = useMemo(() => {
    if (!userProfile) return [];

    switch (userProfile.role) {
      case 'BRAND':
        return [
          { label: 'New Project', action: () => navigate('/projects/new'), icon: Plus, color: 'bg-blue-500' },
          { label: 'Browse Creators', action: () => navigate('/creators'), icon: TrendingUp, color: 'bg-green-500' },
        ];
      case 'CREATOR':
        return [
          { label: 'Submit Work', action: () => navigate('/deliverables'), icon: Plus, color: 'bg-purple-500' },
          { label: 'View Payouts', action: () => navigate('/payouts'), icon: Wallet, color: 'bg-emerald-500' },
        ];
      default:
        return [];
    }
  }, [userProfile, navigate]);

  // OPTIMIZATION: Parallel data fetching with progressive updates
  useEffect(() => {
    if (!userProfile) return;

    const fetchData = async () => {
      try {
        // Fetch stats and deals in parallel
        const [statsResult, dealsResult] = await Promise.allSettled([
          fetchStats(),
          fetchRecentDeals()
        ]);

        // Update loading states as data comes in
        if (statsResult.status === 'fulfilled') {
          setLoadingStates(prev => ({ ...prev, stats: false }));
        }
        
        if (dealsResult.status === 'fulfilled') {
          setLoadingStates(prev => ({ ...prev, deals: false }));
        }

        setData(prev => ({
          ...prev,
          loaded: true,
          error: statsResult.status === 'rejected' || dealsResult.status === 'rejected' 
            ? 'Some data could not be loaded' 
            : undefined
        }));

      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setData(prev => ({
          ...prev,
          loaded: true,
          error: 'Failed to load dashboard data'
        }));
      }
    };

    fetchData();
  }, [userProfile]);

  const fetchStats = async () => {
    if (!userProfile) return;

    // OPTIMIZATION: Optimized query with count aggregations
    let query = supabase
      .from('deals')
      .select('state, amount_total', { count: 'exact' });

    if (userProfile.role === 'CREATOR') {
      query = query.eq('creator_id', userProfile.id);
    } else if (userProfile.role === 'BRAND') {
      query = query.eq('projects.brand_id', userProfile.id);
    }

    const { data: deals, error, count } = await query;

    if (error) throw error;

    // Calculate stats client-side for better performance
    const stats = deals?.reduce((acc, deal) => {
      acc.totalAmount += deal.amount_total;
      if (deal.state === 'FUNDED') acc.activeDeals++;
      if (deal.state === 'RELEASED') acc.completedDeals++;
      return acc;
    }, { totalAmount: 0, activeDeals: 0, completedDeals: 0 }) || { totalAmount: 0, activeDeals: 0, completedDeals: 0 };

    setData(prev => ({
      ...prev,
      stats: {
        ...stats,
        totalDeals: count || 0
      }
    }));
  };

  const fetchRecentDeals = async () => {
    if (!userProfile) return;

    // OPTIMIZATION: Lighter query for recent deals
    let query = supabase
      .from('deals')
      .select(`
        id,
        amount_total,
        currency,
        state,
        created_at,
        projects!inner(title, brand_id)
      `);

    if (userProfile.role === 'CREATOR') {
      query = query.eq('creator_id', userProfile.id);
    } else if (userProfile.role === 'BRAND') {
      query = query.eq('projects.brand_id', userProfile.id);
    }

    const { data: deals, error } = await query
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) throw error;

    setData(prev => ({ ...prev, recentDeals: deals || [] }));
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'secondary';
      case 'FUNDED': return 'default';
      case 'RELEASED': return 'success';
      case 'DISPUTED': return 'destructive';
      default: return 'secondary';
    }
  };

  if (!userProfile) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {welcomeMessage}
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your {userProfile.role.toLowerCase()} account
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {userProfile.role}
        </Badge>
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="flex gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={action.action}
                className={`${action.color} hover:opacity-90 text-white border-0`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            );
          })}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Deals"
          value={data.stats.totalDeals}
          icon={Handshake}
          loading={loadingStates.stats}
        />
        <StatCard
          title="Active Deals"
          value={data.stats.activeDeals}
          icon={Clock}
          loading={loadingStates.stats}
        />
        <StatCard
          title="Total Amount"
          value={`$${(data.stats.totalAmount / 100).toLocaleString()}`}
          icon={DollarSign}
          loading={loadingStates.stats}
        />
        <StatCard
          title="Completed"
          value={data.stats.completedDeals}
          icon={CheckCircle}
          loading={loadingStates.stats}
        />
      </div>

      {/* Recent Deals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deals</CardTitle>
          <CardDescription>
            Your latest {userProfile.role === 'BRAND' ? 'projects' : 'collaborations'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStates.deals ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : data.recentDeals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Handshake className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No deals yet. {userProfile.role === 'BRAND' ? 'Create your first project!' : 'Start collaborating!'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <h4 className="font-medium">{deal.projects?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {userProfile.role === 'BRAND' ? 'Brand project' : 'Collaboration'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-medium">${(deal.amount_total / 100).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{deal.currency?.toUpperCase()}</p>
                    </div>
                    <Badge variant={getStateColor(deal.state)}>
                      {deal.state}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {data.error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800">{data.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// OPTIMIZATION: Reusable stat card component
function StatCard({ title, value, icon: Icon, loading }: {
  title: string;
  value: string | number;
  icon: any;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-16 mt-2" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
          </div>
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

// OPTIMIZATION: Dashboard loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
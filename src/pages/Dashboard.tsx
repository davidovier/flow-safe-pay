import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { UsageDashboard } from '@/components/subscription/UsageDashboard';
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt';
import { 
  Handshake, 
  Clock, 
  CheckCircle,
  Plus,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalDeals: number;
  activeDeals: number;
  totalAmount: number;
  completedDeals: number;
}

export default function Dashboard() {
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const { 
    canCreateDeal, 
    getRemainingLimits, 
    getCurrentPlan,
    trackUsage 
  } = useSubscription();
  const [stats, setStats] = useState<DashboardStats>({
    totalDeals: 0,
    activeDeals: 0,
    totalAmount: 0,
    completedDeals: 0,
  });
  const [recentDeals, setRecentDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState<{
    show: boolean;
    reason: string;
    suggestedPlan?: any;
  }>({ show: false, reason: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (userProfile) {
      fetchDashboardData();
    }
  }, [userProfile]);

  const fetchDashboardData = async () => {
    if (!userProfile) return;

    try {
      let dealsQuery = supabase
        .from('deals')
        .select(`
          *,
          projects!inner(title, brand_id),
          users!deals_creator_id_fkey(first_name, last_name)
        `);

      if (userProfile.role === 'CREATOR') {
        dealsQuery = dealsQuery.eq('creator_id', userProfile.id);
      } else if (userProfile.role === 'BRAND') {
        dealsQuery = dealsQuery.eq('projects.brand_id', userProfile.id);
      }

      const { data: deals, error } = await dealsQuery.limit(5).order('created_at', { ascending: false });

      if (error) throw error;

      setRecentDeals(deals || []);

      // Calculate stats
      const totalDeals = deals?.length || 0;
      const activeDeals = deals?.filter(deal => deal.state === 'FUNDED').length || 0;
      const completedDeals = deals?.filter(deal => deal.state === 'RELEASED').length || 0;
      const totalAmount = deals?.reduce((sum, deal) => sum + deal.amount_total, 0) || 0;

      setStats({
        totalDeals,
        activeDeals,
        totalAmount,
        completedDeals,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    if (!userProfile) return t('welcomeToFlowPay');
    
    const name = userProfile.first_name || t('there');
    if (userProfile.role === 'CREATOR') {
      return t('welcomeBackCreator', { name });
    } else if (userProfile.role === 'BRAND') {
      return t('welcomeBackBrand', { name });
    } else {
      return t('welcomeBackAdmin', { name });
    }
  };

  const handleCreateProject = () => {
    const check = canCreateDeal();
    if (!check.allowed) {
      setShowUpgradePrompt({
        show: true,
        reason: check.reason || 'Upgrade required',
        suggestedPlan: check.upgradeRequired
      });
      return;
    }
    trackUsage('deal_created');
    navigate('/projects/new');
  };

  const getQuickActions = () => {
    const currentPlan = getCurrentPlan();
    const remaining = getRemainingLimits();

    if (userProfile?.role === 'BRAND') {
      const canCreate = canCreateDeal();
      return [
        { 
          label: canCreate.allowed ? t('newProject') : t('newProjectUpgradeRequired'), 
          action: handleCreateProject, 
          icon: Plus,
          disabled: !canCreate.allowed,
          tooltip: !canCreate.allowed ? canCreate.reason : undefined
        },
        { label: t('browseCreators'), action: () => navigate('/creators'), icon: TrendingUp },
      ];
    } else if (userProfile?.role === 'CREATOR') {
      return [
        { label: t('submitDeliverable'), action: () => navigate('/deliverables'), icon: Plus },
        { label: t('viewPayouts'), action: () => navigate('/payouts'), icon: Wallet },
      ];
    }
    return [];
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'secondary';
      case 'FUNDED': return 'default';
      case 'RELEASED': return 'success' as any;
      case 'DISPUTED': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-2">{getWelcomeMessage()}</h1>
        <div className="flex flex-wrap gap-2">
          {getQuickActions().map((action, index) => (
            <Button 
              key={index} 
              onClick={action.action} 
              size="sm"
              disabled={action.disabled}
              title={action.tooltip}
            >
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompt.show && (
        <UpgradePrompt 
          reason={showUpgradePrompt.reason}
          suggestedPlan={showUpgradePrompt.suggestedPlan}
          variant="banner"
          onDismiss={() => setShowUpgradePrompt({ show: false, reason: '' })}
        />
      )}

      {/* Usage Dashboard */}
      <UsageDashboard />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalDeals')}</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDeals}</div>
            <p className="text-xs text-muted-foreground">
              {t('allTimePartnerships')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeDeals')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDeals}</div>
            <p className="text-xs text-muted-foreground">
              {t('currentlyFunded')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalValue')}</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(stats.totalAmount / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('acrossAllDeals')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('completed')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedDeals}</div>
            <p className="text-xs text-muted-foreground">
              {t('successfullyReleased')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deals */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentDeals')}</CardTitle>
          <CardDescription>
            {t('latestPartnerships')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentDeals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Handshake className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('noDealsYet')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentDeals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{deal.projects.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {userProfile?.role === 'BRAND' 
                        ? t('creatorName', { name: `${deal.users?.first_name} ${deal.users?.last_name}` })
                        : t('brandProject')
                      }
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="font-medium">${(deal.amount_total / 100).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{deal.currency.toUpperCase()}</p>
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
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText as Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  MessageSquare,
  Star,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BrandStats {
  activeCampaigns: number;
  totalSpend: number;
  totalCreators: number;
  averageROI: number;
  pendingApprovals: number;
  completionRate: number;
  monthlySpend: number;
  quarterlySpend: number;
}

interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  creatorsCount: number;
  deliverablesCount: number;
  pendingApprovals: number;
  completedDeliverables: number;
}

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  niche: string[];
  rating: number;
  completedDeals: number;
  lastActive: string;
  status: 'available' | 'busy' | 'offline';
}

interface RecentActivity {
  id: string;
  type: 'deliverable_submitted' | 'campaign_completed' | 'creator_invited' | 'payment_released';
  title: string;
  description: string;
  timestamp: string;
  creator?: Creator;
  campaign?: Campaign;
}

export function BrandDashboard() {
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const mockStats: BrandStats = {
        activeCampaigns: 8,
        totalSpend: 45280,
        totalCreators: 23,
        averageROI: 320,
        pendingApprovals: 12,
        completionRate: 87,
        monthlySpend: 12450,
        quarterlySpend: 35600,
      };

      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Summer Fashion Collection',
          status: 'ACTIVE',
          budget: 15000,
          spent: 8500,
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          creatorsCount: 8,
          deliverablesCount: 24,
          pendingApprovals: 3,
          completedDeliverables: 18,
        },
        {
          id: '2',
          name: 'Tech Product Launch',
          status: 'ACTIVE',
          budget: 25000,
          spent: 18750,
          startDate: '2024-07-15',
          endDate: '2024-09-15',
          creatorsCount: 12,
          deliverablesCount: 36,
          pendingApprovals: 6,
          completedDeliverables: 28,
        },
        {
          id: '3',
          name: 'Holiday Promotion',
          status: 'DRAFT',
          budget: 20000,
          spent: 0,
          startDate: '2024-11-01',
          endDate: '2024-12-31',
          creatorsCount: 0,
          deliverablesCount: 0,
          pendingApprovals: 0,
          completedDeliverables: 0,
        },
      ];

      const mockTopCreators: Creator[] = [
        {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah@example.com',
          niche: ['Fashion', 'Lifestyle'],
          rating: 4.9,
          completedDeals: 15,
          lastActive: '2024-01-15T10:30:00Z',
          status: 'available',
        },
        {
          id: '2',
          firstName: 'Mike',
          lastName: 'Chen',
          email: 'mike@example.com',
          niche: ['Tech', 'Gaming'],
          rating: 4.8,
          completedDeals: 12,
          lastActive: '2024-01-15T09:15:00Z',
          status: 'busy',
        },
        {
          id: '3',
          firstName: 'Emma',
          lastName: 'Wilson',
          email: 'emma@example.com',
          niche: ['Beauty', 'Wellness'],
          rating: 4.7,
          completedDeals: 18,
          lastActive: '2024-01-15T11:45:00Z',
          status: 'available',
        },
      ];

      const mockRecentActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'deliverable_submitted',
          title: 'New deliverable submitted',
          description: 'Sarah Johnson submitted Instagram post for Summer Fashion Collection',
          timestamp: '2024-01-15T10:30:00Z',
          creator: mockTopCreators[0],
          campaign: mockCampaigns[0],
        },
        {
          id: '2',
          type: 'creator_invited',
          title: 'Creator invitation sent',
          description: 'Invitation sent to Mike Chen for Tech Product Launch campaign',
          timestamp: '2024-01-15T09:15:00Z',
          creator: mockTopCreators[1],
          campaign: mockCampaigns[1],
        },
        {
          id: '3',
          type: 'payment_released',
          title: 'Payment released',
          description: 'Payment of $750 released to Emma Wilson',
          timestamp: '2024-01-15T08:45:00Z',
          creator: mockTopCreators[2],
        },
      ];

      setStats(mockStats);
      setCampaigns(mockCampaigns);
      setTopCreators(mockTopCreators);
      setRecentActivity(mockRecentActivity);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCreatorStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'deliverable_submitted': return <Upload className="h-4 w-4" />;
      case 'creator_invited': return <Users className="h-4 w-4" />;
      case 'payment_released': return <DollarSign className="h-4 w-4" />;
      case 'campaign_completed': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brand Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your campaigns.
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
          <Button variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Find Creators
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingApprovals} pending approvals
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.monthlySpend || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.quarterlySpend || 0)} this quarter
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCreators}</div>
            <p className="text-xs text-muted-foreground">
              Across all campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageROI}%</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completionRate}% completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="creators">Top Creators</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Active Campaigns</h3>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
          
          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((campaign.spent / campaign.budget) * 100)}% spent
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Creators</div>
                        <div className="font-semibold">{campaign.creatorsCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Deliverables</div>
                        <div className="font-semibold">
                          {campaign.completedDeliverables}/{campaign.deliverablesCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Pending</div>
                        <div className="font-semibold text-yellow-600">
                          {campaign.pendingApprovals}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Progress</div>
                        <div className="font-semibold">
                          {Math.round((campaign.completedDeliverables / campaign.deliverablesCount) * 100) || 0}%
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="creators" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Top Creators</h3>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Invite More
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topCreators.map((creator) => (
              <Card key={creator.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback>
                          {creator.firstName[0]}{creator.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div 
                        className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white ${getCreatorStatusColor(creator.status)}`}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">
                        {creator.firstName} {creator.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {creator.niche.join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{creator.rating}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {creator.completedDeals} deals completed
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
          
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {activity.description}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                        {activity.creator && (
                          <span>
                            by {activity.creator.firstName} {activity.creator.lastName}
                          </span>
                        )}
                        {activity.campaign && (
                          <span>
                            in {activity.campaign.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Plus className="h-6 w-6 mb-2" />
              <span className="font-medium">Create Campaign</span>
              <span className="text-xs text-muted-foreground">Start a new creator campaign</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col">
              <Users className="h-6 w-6 mb-2" />
              <span className="font-medium">Browse Creators</span>
              <span className="text-xs text-muted-foreground">Discover new talent</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col">
              <CheckCircle className="h-6 w-6 mb-2" />
              <span className="font-medium">Review Content</span>
              <span className="text-xs text-muted-foreground">{stats?.pendingApprovals} pending</span>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="font-medium">View Analytics</span>
              <span className="text-xs text-muted-foreground">Campaign performance</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
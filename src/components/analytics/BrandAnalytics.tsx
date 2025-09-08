import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Users,
  Target,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Calendar as CalendarIcon,
  Download,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Award,
  Zap,
  Globe,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalSpend: number;
    totalSpendChange: number;
    totalReach: number;
    totalReachChange: number;
    totalEngagements: number;
    totalEngagementsChange: number;
    averageROI: number;
    averageROIChange: number;
    activeCampaigns: number;
    completedCampaigns: number;
  };
  campaignPerformance: {
    id: string;
    name: string;
    spend: number;
    reach: number;
    engagements: number;
    roi: number;
    status: string;
    completionRate: number;
  }[];
  creatorPerformance: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
    totalEarnings: number;
    averageEngagementRate: number;
    completedDeals: number;
    averageRating: number;
    topPerformingContent: string;
  }[];
  contentMetrics: {
    totalPosts: number;
    avgEngagementRate: number;
    topPerformingPlatform: string;
    contentTypes: {
      type: string;
      count: number;
      avgEngagement: number;
    }[];
  };
  audienceInsights: {
    demographics: {
      ageGroups: { range: string; percentage: number }[];
      genders: { gender: string; percentage: number }[];
      locations: { country: string; percentage: number }[];
    };
    interests: { category: string; percentage: number }[];
    platforms: { platform: string; reach: number; engagement: number }[];
  };
  timeSeriesData: {
    date: string;
    spend: number;
    reach: number;
    engagements: number;
    conversions: number;
  }[];
}

export function BrandAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCampaign, setSelectedCampaign] = useState('all');

  const { toast } = useToast();

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedCampaign]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        overview: {
          totalSpend: 45280,
          totalSpendChange: 12.5,
          totalReach: 2840000,
          totalReachChange: 18.3,
          totalEngagements: 156000,
          totalEngagementsChange: 24.7,
          averageROI: 320,
          averageROIChange: 8.2,
          activeCampaigns: 8,
          completedCampaigns: 12,
        },
        campaignPerformance: [
          {
            id: '1',
            name: 'Summer Fashion Collection',
            spend: 15000,
            reach: 850000,
            engagements: 45000,
            roi: 280,
            status: 'active',
            completionRate: 75,
          },
          {
            id: '2',
            name: 'Tech Product Launch',
            spend: 25000,
            reach: 1200000,
            engagements: 78000,
            roi: 420,
            status: 'active',
            completionRate: 60,
          },
          {
            id: '3',
            name: 'Spring Wellness Series',
            spend: 12000,
            reach: 650000,
            engagements: 38000,
            roi: 190,
            status: 'completed',
            completionRate: 100,
          },
        ],
        creatorPerformance: [
          {
            id: '1',
            name: 'Sarah Johnson',
            username: '@sarahjohnson',
            totalEarnings: 8500,
            averageEngagementRate: 4.2,
            completedDeals: 15,
            averageRating: 4.9,
            topPerformingContent: 'Instagram Reel - Summer Outfit',
          },
          {
            id: '2',
            name: 'Mike Chen',
            username: '@miketechtalk',
            totalEarnings: 12000,
            averageEngagementRate: 5.1,
            completedDeals: 12,
            averageRating: 4.8,
            topPerformingContent: 'YouTube Review - Smart Watch',
          },
          {
            id: '3',
            name: 'Emma Wilson',
            username: '@emmawellness',
            totalEarnings: 6800,
            averageEngagementRate: 6.8,
            completedDeals: 18,
            averageRating: 4.7,
            topPerformingContent: 'TikTok Video - Morning Routine',
          },
        ],
        contentMetrics: {
          totalPosts: 156,
          avgEngagementRate: 5.2,
          topPerformingPlatform: 'TikTok',
          contentTypes: [
            { type: 'Instagram Post', count: 45, avgEngagement: 3.8 },
            { type: 'Instagram Reel', count: 38, avgEngagement: 6.2 },
            { type: 'TikTok Video', count: 32, avgEngagement: 7.1 },
            { type: 'YouTube Video', count: 25, avgEngagement: 4.5 },
            { type: 'Instagram Story', count: 16, avgEngagement: 2.9 },
          ],
        },
        audienceInsights: {
          demographics: {
            ageGroups: [
              { range: '18-24', percentage: 35 },
              { range: '25-34', percentage: 28 },
              { range: '35-44', percentage: 22 },
              { range: '45-54', percentage: 10 },
              { range: '55+', percentage: 5 },
            ],
            genders: [
              { gender: 'Female', percentage: 68 },
              { gender: 'Male', percentage: 30 },
              { gender: 'Other', percentage: 2 },
            ],
            locations: [
              { country: 'United States', percentage: 45 },
              { country: 'Canada', percentage: 12 },
              { country: 'United Kingdom', percentage: 8 },
              { country: 'Australia', percentage: 6 },
              { country: 'Germany', percentage: 5 },
            ],
          },
          interests: [
            { category: 'Fashion & Style', percentage: 78 },
            { category: 'Technology', percentage: 42 },
            { category: 'Health & Fitness', percentage: 36 },
            { category: 'Travel', percentage: 28 },
            { category: 'Food & Cooking', percentage: 24 },
          ],
          platforms: [
            { platform: 'Instagram', reach: 1200000, engagement: 4.8 },
            { platform: 'TikTok', reach: 890000, engagement: 7.2 },
            { platform: 'YouTube', reach: 650000, engagement: 3.9 },
            { platform: 'Twitter', reach: 340000, engagement: 2.1 },
          ],
        },
        timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          spend: Math.floor(Math.random() * 2000) + 1000,
          reach: Math.floor(Math.random() * 100000) + 50000,
          engagements: Math.floor(Math.random() * 5000) + 2000,
          conversions: Math.floor(Math.random() * 100) + 50,
        })),
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center p-8">
        <p>No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your campaign performance and ROI insights.
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analyticsData.overview.totalSpend)}</div>
            <div className={`flex items-center text-xs ${getChangeColor(analyticsData.overview.totalSpendChange)}`}>
              {getChangeIcon(analyticsData.overview.totalSpendChange)}
              <span>{Math.abs(analyticsData.overview.totalSpendChange)}% from last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalReach)}</div>
            <div className={`flex items-center text-xs ${getChangeColor(analyticsData.overview.totalReachChange)}`}>
              {getChangeIcon(analyticsData.overview.totalReachChange)}
              <span>{Math.abs(analyticsData.overview.totalReachChange)}% from last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagements</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.overview.totalEngagements)}</div>
            <div className={`flex items-center text-xs ${getChangeColor(analyticsData.overview.totalEngagementsChange)}`}>
              {getChangeIcon(analyticsData.overview.totalEngagementsChange)}
              <span>{Math.abs(analyticsData.overview.totalEngagementsChange)}% from last period</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ROI</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.averageROI}%</div>
            <div className={`flex items-center text-xs ${getChangeColor(analyticsData.overview.averageROIChange)}`}>
              {getChangeIcon(analyticsData.overview.averageROIChange)}
              <span>{Math.abs(analyticsData.overview.averageROIChange)}% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaign Performance</TabsTrigger>
          <TabsTrigger value="creators">Creator Performance</TabsTrigger>
          <TabsTrigger value="content">Content Analytics</TabsTrigger>
          <TabsTrigger value="audience">Audience Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.campaignPerformance.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Spend</div>
                          <div className="font-medium">{formatCurrency(campaign.spend)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Reach</div>
                          <div className="font-medium">{formatNumber(campaign.reach)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Engagements</div>
                          <div className="font-medium">{formatNumber(campaign.engagements)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">ROI</div>
                          <div className="font-medium">{campaign.roi}%</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-sm text-muted-foreground mb-1">Progress</div>
                      <div className="font-semibold">{campaign.completionRate}%</div>
                      <div className="w-20 bg-muted rounded-full h-2 mt-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${campaign.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="creators" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Creators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.creatorPerformance.map((creator, index) => (
                  <div key={creator.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-lg font-bold text-muted-foreground w-8">
                        #{index + 1}
                      </div>
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-semibold">{creator.name}</div>
                        <div className="text-sm text-muted-foreground">{creator.username}</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-8 text-sm">
                      <div className="text-center">
                        <div className="text-muted-foreground">Earnings</div>
                        <div className="font-semibold">{formatCurrency(creator.totalEarnings)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Avg. Engagement</div>
                        <div className="font-semibold">{creator.averageEngagementRate}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Completed</div>
                        <div className="font-semibold">{creator.completedDeals}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-muted-foreground">Rating</div>
                        <div className="font-semibold flex items-center gap-1">
                          <span>{creator.averageRating}</span>
                          <span className="text-yellow-400">★</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Content Performance by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.contentMetrics.contentTypes.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{type.type}</div>
                        <div className="text-sm text-muted-foreground">{type.count} posts</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{type.avgEngagement}%</div>
                        <div className="text-sm text-muted-foreground">avg. engagement</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.audienceInsights.platforms.map((platform) => (
                    <div key={platform.platform} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{platform.platform}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatNumber(platform.reach)} reach</div>
                        <div className="text-sm text-muted-foreground">{platform.engagement}% engagement</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">{analyticsData.contentMetrics.totalPosts}</div>
                  <div className="text-muted-foreground">Total Posts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{analyticsData.contentMetrics.avgEngagementRate}%</div>
                  <div className="text-muted-foreground">Avg. Engagement Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{analyticsData.contentMetrics.topPerformingPlatform}</div>
                  <div className="text-muted-foreground">Top Platform</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audience" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Age Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.audienceInsights.demographics.ageGroups.map((group) => (
                    <div key={group.range} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{group.range}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${group.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-8">{group.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.audienceInsights.demographics.genders.map((gender) => (
                    <div key={gender.gender} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{gender.gender}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${gender.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold w-8">{gender.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.audienceInsights.demographics.locations.map((location) => (
                    <div key={location.country} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{location.country}</span>
                      <span className="text-sm font-semibold">{location.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Audience Interests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {analyticsData.audienceInsights.interests.map((interest) => (
                  <div key={interest.category} className="text-center p-4 border rounded-lg">
                    <div className="font-semibold">{interest.percentage}%</div>
                    <div className="text-sm text-muted-foreground">{interest.category}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
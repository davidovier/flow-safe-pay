import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Briefcase,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Upload,
  Star,
  Calendar,
  AlertCircle,
  Award,
  MessageSquare,
  Camera,
  Play,
  FileImage,
  Target,
  Users,
  Building2,
  Edit,
  Eye,
  Download,
  Send,
  Plus,
  Search,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  title: string;
  brand: {
    id: string;
    name: string;
    logo?: string;
  };
  agency?: {
    id: string;
    name: string;
  };
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  paidAmount: number;
  deadline: string;
  createdAt: string;
  milestones: Milestone[];
  requirements: string[];
  brief: string;
  tags: string[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  deadline: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
  deliverables: Deliverable[];
  feedback?: string;
  rating?: number;
}

interface Deliverable {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LINK';
  url: string;
  filename?: string;
  description: string;
  submittedAt: string;
  approvedAt?: string;
  feedback?: string;
}

interface CreatorStats {
  totalEarnings: number;
  pendingPayouts: number;
  activeDeals: number;
  completedDeals: number;
  averageRating: number;
  completionRate: number;
  responseTime: number; // in hours
  monthlyGrowth: number;
  portfolio: {
    followers: number;
    engagementRate: number;
    platforms: string[];
    specialties: string[];
  };
}

interface Opportunity {
  id: string;
  title: string;
  brand: {
    name: string;
    logo?: string;
  };
  agency?: {
    name: string;
  };
  budget: number;
  deadline: string;
  requirements: string[];
  tags: string[];
  postedAt: string;
  applicants: number;
  status: 'OPEN' | 'APPLIED' | 'SHORTLISTED' | 'CLOSED';
}

// Mock data - replace with actual API calls
const mockStats: CreatorStats = {
  totalEarnings: 45000,
  pendingPayouts: 3200,
  activeDeals: 5,
  completedDeals: 23,
  averageRating: 4.8,
  completionRate: 96,
  responseTime: 2,
  monthlyGrowth: 24,
  portfolio: {
    followers: 125000,
    engagementRate: 4.2,
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    specialties: ['Fashion', 'Lifestyle', 'Beauty'],
  },
};

const mockDeals: Deal[] = [
  {
    id: '1',
    title: 'Summer Fashion Campaign',
    brand: { id: '1', name: 'StyleCorp' },
    agency: { id: '1', name: 'Creative Agency' },
    status: 'IN_PROGRESS',
    totalAmount: 5000,
    paidAmount: 2000,
    deadline: '2024-03-15',
    createdAt: '2024-02-01',
    brief: 'Create authentic summer fashion content showcasing our new collection...',
    requirements: ['3 Instagram posts', '2 TikTok videos', '1 YouTube Shorts'],
    tags: ['Fashion', 'Summer', 'Lifestyle'],
    milestones: [
      {
        id: '1',
        title: 'Instagram Posts',
        description: '3 high-quality Instagram posts featuring summer outfits',
        amount: 2000,
        deadline: '2024-02-20',
        status: 'APPROVED',
        deliverables: [
          {
            id: '1',
            type: 'IMAGE',
            url: '/placeholder-image.jpg',
            filename: 'summer_outfit_1.jpg',
            description: 'Casual summer look with floral dress',
            submittedAt: '2024-02-18',
            approvedAt: '2024-02-19',
            feedback: 'Perfect! Love the natural lighting.',
          },
        ],
        feedback: 'Outstanding work! The aesthetics perfectly match our brand.',
        rating: 5,
      },
      {
        id: '2',
        title: 'TikTok Videos',
        description: '2 engaging TikTok videos with trending audio',
        amount: 1500,
        deadline: '2024-03-01',
        status: 'IN_PROGRESS',
        deliverables: [],
      },
      {
        id: '3',
        title: 'YouTube Shorts',
        description: '1 YouTube Shorts showcasing outfit transition',
        amount: 1500,
        deadline: '2024-03-10',
        status: 'PENDING',
        deliverables: [],
      },
    ],
  },
  {
    id: '2',
    title: 'Tech Product Review',
    brand: { id: '2', name: 'TechFlow' },
    status: 'PENDING',
    totalAmount: 3500,
    paidAmount: 0,
    deadline: '2024-03-25',
    createdAt: '2024-02-25',
    brief: 'Comprehensive review of our new smartwatch...',
    requirements: ['1 YouTube video review', '5 Instagram stories', '3 Instagram posts'],
    tags: ['Tech', 'Review', 'Innovation'],
    milestones: [
      {
        id: '4',
        title: 'Unboxing & First Impressions',
        description: 'YouTube video showcasing unboxing and initial thoughts',
        amount: 2000,
        deadline: '2024-03-10',
        status: 'PENDING',
        deliverables: [],
      },
    ],
  },
];

const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    title: 'Fitness Equipment Campaign',
    brand: { name: 'FitLife' },
    agency: { name: 'Health Marketing Co' },
    budget: 4000,
    deadline: '2024-04-15',
    requirements: ['Gym content', 'Before/after shots', 'Workout videos'],
    tags: ['Fitness', 'Health', 'Wellness'],
    postedAt: '2024-02-28',
    applicants: 12,
    status: 'OPEN',
  },
  {
    id: '2',
    title: 'Sustainable Beauty Brand',
    brand: { name: 'EcoBeauty' },
    budget: 2800,
    deadline: '2024-04-01',
    requirements: ['Skincare routine', 'Product photography', 'GRWM videos'],
    tags: ['Beauty', 'Sustainable', 'Skincare'],
    postedAt: '2024-02-26',
    applicants: 8,
    status: 'APPLIED',
  },
];

export function CreatorDashboard() {
  const [stats, setStats] = useState<CreatorStats>(mockStats);
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOpportunities = opportunities.filter(opp =>
    opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    opp.brand.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'IN_PROGRESS':
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
      case 'SUBMITTED':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
      case 'REVISION_REQUESTED':
        return 'bg-red-100 text-red-800';
      case 'SHORTLISTED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApplyToOpportunity = async (opportunityId: string) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setOpportunities(prev => 
        prev.map(opp => 
          opp.id === opportunityId 
            ? { ...opp, status: 'APPLIED', applicants: opp.applicants + 1 }
            : opp
        )
      );
      
      toast({
        title: "Application Submitted",
        description: "Your application has been sent to the brand!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDeliverable = async (milestoneId: string, dealId: string) => {
    toast({
      title: "Upload Deliverable",
      description: "File upload functionality would be implemented here",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your deals, track earnings, and discover new opportunities
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Apply to Deal
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalEarnings)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{stats.monthlyGrowth}% this month
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Deals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeDeals}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatCurrency(stats.pendingPayouts)} pending
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.completedDeals} completed
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold text-gray-900 mr-1">{stats.averageRating}</p>
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.responseTime}h avg response
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="deals">My Deals</TabsTrigger>
          <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Current Projects */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Deals</CardTitle>
                <CardDescription>Current projects and their progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deals.filter(deal => deal.status === 'IN_PROGRESS' || deal.status === 'ACCEPTED').slice(0, 3).map((deal) => (
                    <div key={deal.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{deal.title}</h4>
                        <Badge className={getStatusColor(deal.status)}>
                          {deal.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {deal.brand.name} {deal.agency && `via ${deal.agency.name}`}
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium">{formatCurrency(deal.totalAmount)}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatCurrency(deal.paidAmount)} paid
                          </span>
                        </div>
                        <Progress 
                          value={(deal.milestones.filter(m => m.status === 'APPROVED').length / deal.milestones.length) * 100} 
                          className="w-20 h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Opportunities</CardTitle>
                <CardDescription>New deals matching your profile</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunities.slice(0, 3).map((opportunity) => (
                    <div key={opportunity.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{opportunity.title}</h4>
                        <Badge className={getStatusColor(opportunity.status)}>
                          {opportunity.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {opportunity.brand.name} {opportunity.agency && `via ${opportunity.agency.name}`}
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium">{formatCurrency(opportunity.budget)}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            {opportunity.applicants} applicants
                          </span>
                        </div>
                        {opportunity.status === 'OPEN' && (
                          <Button size="sm" onClick={() => handleApplyToOpportunity(opportunity.id)}>
                            Apply
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Portfolio Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Your Portfolio</CardTitle>
              <CardDescription>Social media metrics and specialties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.portfolio.followers)}</p>
                  <p className="text-sm text-gray-600">Total Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.portfolio.engagementRate}%</p>
                  <p className="text-sm text-gray-600">Engagement Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.portfolio.platforms.length}</p>
                  <p className="text-sm text-gray-600">Platforms</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats.portfolio.specialties.length}</p>
                  <p className="text-sm text-gray-600">Specialties</p>
                </div>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Platforms</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.portfolio.platforms.map((platform) => (
                      <Badge key={platform} variant="secondary">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {stats.portfolio.specialties.map((specialty) => (
                      <Badge key={specialty} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
          {/* Deal Management Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Deal Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'].map((status) => (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {deals.filter(d => d.status === status).length}
                    </p>
                    <p className="text-sm text-gray-600">{status.replace('_', ' ')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Deal List */}
          <div className="grid gap-4">
            {filteredDeals.map((deal) => (
              <Card key={deal.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{deal.title}</h3>
                      <p className="text-sm text-gray-500">
                        {deal.brand.name} {deal.agency && `via ${deal.agency.name}`}
                      </p>
                    </div>
                    <Badge className={getStatusColor(deal.status)}>
                      {deal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Total Value</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Paid So Far</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(deal.paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Progress</p>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(deal.milestones.filter(m => m.status === 'APPROVED').length / deal.milestones.length) * 100} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-sm text-gray-600">
                          {deal.milestones.filter(m => m.status === 'APPROVED').length}/{deal.milestones.length}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Deadline</p>
                      <p className="text-sm text-gray-900">
                        {new Date(deal.deadline).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Milestones</h4>
                    {deal.milestones.map((milestone) => (
                      <div key={milestone.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h5 className="font-medium">{milestone.title}</h5>
                            <p className="text-sm text-gray-600">{milestone.description}</p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(milestone.status)}>
                              {milestone.status.replace('_', ' ')}
                            </Badge>
                            <p className="text-sm font-medium mt-1">{formatCurrency(milestone.amount)}</p>
                          </div>
                        </div>
                        
                        {milestone.status === 'IN_PROGRESS' && (
                          <div className="mt-3">
                            <Button 
                              size="sm" 
                              onClick={() => handleSubmitDeliverable(milestone.id, deal.id)}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Submit Deliverable
                            </Button>
                          </div>
                        )}
                        
                        {milestone.feedback && milestone.rating && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-2">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`h-4 w-4 ${i < milestone.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600 ml-2">Client Feedback</span>
                            </div>
                            <p className="text-sm text-gray-700">{milestone.feedback}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Brief
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Message Client
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          {/* Opportunities Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search opportunities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>

          {/* Opportunity Categories */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Camera className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                <p className="font-medium">Photography</p>
                <p className="text-sm text-gray-600">12 open deals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Play className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="font-medium">Video Content</p>
                <p className="text-sm text-gray-600">8 open deals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium">Lifestyle</p>
                <p className="text-sm text-gray-600">15 open deals</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="font-medium">Tech Reviews</p>
                <p className="text-sm text-gray-600">6 open deals</p>
              </CardContent>
            </Card>
          </div>

          {/* Opportunities List */}
          <div className="grid gap-4">
            {filteredOpportunities.map((opportunity) => (
              <Card key={opportunity.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{opportunity.title}</h3>
                      <p className="text-sm text-gray-500">
                        {opportunity.brand.name} {opportunity.agency && `via ${opportunity.agency.name}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Posted {new Date(opportunity.postedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(opportunity.budget)}</p>
                      <p className="text-sm text-gray-600">{opportunity.applicants} applicants</p>
                      <Badge className={getStatusColor(opportunity.status)}>
                        {opportunity.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Requirements:</p>
                    <div className="flex flex-wrap gap-2">
                      {opportunity.requirements.map((req, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {req}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {opportunity.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      {opportunity.status === 'OPEN' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleApplyToOpportunity(opportunity.id)}
                          disabled={loading}
                        >
                          <Send className="h-4 w-4 mr-1" />
                          Apply Now
                        </Button>
                      )}
                      {opportunity.status === 'APPLIED' && (
                        <Button variant="outline" size="sm" disabled>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Applied
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="earnings" className="space-y-6">
          {/* Earnings Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Earnings</CardTitle>
                <CardDescription>All-time creator earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(stats.totalEarnings)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  +{stats.monthlyGrowth}% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Payouts</CardTitle>
                <CardDescription>Awaiting payment release</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {formatCurrency(stats.pendingPayouts)}
                </div>
                <div className="text-sm text-gray-600">
                  From {deals.filter(d => d.status === 'DELIVERED').length} completed milestones
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Deal Size</CardTitle>
                <CardDescription>Mean value per deal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {formatCurrency(deals.length > 0 ? deals.reduce((sum, d) => sum + d.totalAmount, 0) / deals.length : 0)}
                </div>
                <div className="text-sm text-gray-600">
                  Across {deals.length} total deals
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Recent payments and transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deals
                  .filter(deal => deal.paidAmount > 0)
                  .map((deal) => 
                    deal.milestones
                      .filter(milestone => milestone.status === 'APPROVED')
                      .map((milestone) => (
                        <div key={`${deal.id}-${milestone.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                              <p className="font-medium">{milestone.title}</p>
                              <p className="text-sm text-gray-600">{deal.brand.name} • {deal.title}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{formatCurrency(milestone.amount)}</p>
                            <p className="text-sm text-gray-600">Paid Feb 19, 2024</p>
                          </div>
                        </div>
                      ))
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Payout Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Settings</CardTitle>
              <CardDescription>Manage your payment preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Bank Account</p>
                    <p className="text-sm text-gray-600">****1234 - Chase Bank</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
                <div className="flex justify-between items-center p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Tax Information</p>
                    <p className="text-sm text-gray-600">W-9 on file</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Management */}
          <Card>
            <CardHeader>
              <CardTitle>Creator Profile</CardTitle>
              <CardDescription>Manage your public creator profile and portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback className="text-lg">CR</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">Sarah Creator</h3>
                    <p className="text-gray-600">Fashion & Lifestyle Content Creator</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Social Media</h4>
                    <div className="space-y-3">
                      {stats.portfolio.platforms.map((platform) => (
                        <div key={platform} className="flex justify-between items-center p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-bold text-xs">{platform[0]}</span>
                            </div>
                            <span className="font-medium">{platform}</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Platform
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Specialties & Skills</h4>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {stats.portfolio.specialties.map((specialty) => (
                          <Badge key={specialty} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Specialty
                      </Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Portfolio & Rates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-600">Instagram Post Rate</p>
                      <p className="font-bold text-lg">$500</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-600">Story Rate</p>
                      <p className="font-bold text-lg">$100</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-600">Video Rate</p>
                      <p className="font-bold text-lg">$800</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-gray-600">Package Deal</p>
                      <p className="font-bold text-lg">$1,200</p>
                    </div>
                  </div>
                  <Button variant="outline" className="mt-4">
                    <Edit className="h-4 w-4 mr-2" />
                    Update Rates
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
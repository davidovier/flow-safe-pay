import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Plus, 
  Search,
  Filter,
  Mail,
  Calendar,
  Activity,
  ChevronRight,
  Settings,
  BarChart3,
  UserCheck,
  Clock,
  AlertCircle,
  Building2,
  Target,
  Briefcase,
  Star,
  Eye,
  Edit,
  MessageSquare,
  Phone,
  Globe,
  PieChart,
  Zap,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  name: string;
  industry: string;
  logo?: string;
  email: string;
  onboardedAt: string;
  status: 'active' | 'pending' | 'paused';
  activeCampaigns: number;
  totalSpent: number;
  dealsCount: number;
  averageRating: number;
  nextBilling: string;
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
}

interface Creator {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  joinedAt: string;
  status: 'active' | 'pending' | 'inactive';
  dealsCount: number;
  totalEarnings: number;
  averageRating: number;
  lastActive: string;
  categories: string[];
  portfolio: {
    followers: number;
    engagementRate: number;
    platforms: string[];
    avgViews: number;
  };
  specialties: string[];
  location: string;
}

interface Deal {
  id: string;
  title: string;
  client: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    name: string;
  };
  status: 'DRAFT' | 'PENDING' | 'ACTIVE' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  value: number;
  commission: number;
  createdAt: string;
  deadline: string;
  milestones: number;
  completedMilestones: number;
}

interface AgencyStats {
  totalClients: number;
  totalCreators: number;
  activeDeals: number;
  totalRevenue: number;
  totalCommission: number;
  avgDealValue: number;
  monthlyGrowth: number;
  conversionRate: number;
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  creatorLimit: number;
  clientLimit: number;
}

// Mock data - replace with actual API calls
const mockStats: AgencyStats = {
  totalClients: 8,
  totalCreators: 24,
  activeDeals: 15,
  totalRevenue: 340000,
  totalCommission: 51000,
  avgDealValue: 4200,
  monthlyGrowth: 18,
  conversionRate: 68,
  subscriptionTier: 'PROFESSIONAL',
  creatorLimit: 50,
  clientLimit: 15,
};

const mockClients: Client[] = [
  {
    id: '1',
    name: 'TechFlow',
    industry: 'Technology',
    email: 'partnerships@techflow.com',
    onboardedAt: '2024-01-15',
    status: 'active',
    activeCampaigns: 3,
    totalSpent: 85000,
    dealsCount: 12,
    averageRating: 4.7,
    nextBilling: '2024-02-15',
    tier: 'PROFESSIONAL',
  },
  {
    id: '2',
    name: 'StyleCorp',
    industry: 'Fashion',
    email: 'marketing@stylecorp.com',
    onboardedAt: '2024-02-01',
    status: 'active',
    activeCampaigns: 2,
    totalSpent: 62000,
    dealsCount: 8,
    averageRating: 4.9,
    nextBilling: '2024-03-01',
    tier: 'ENTERPRISE',
  },
  {
    id: '3',
    name: 'FitLife',
    industry: 'Health & Fitness',
    email: 'content@fitlife.com',
    onboardedAt: '2024-02-20',
    status: 'pending',
    activeCampaigns: 1,
    totalSpent: 15000,
    dealsCount: 2,
    averageRating: 4.5,
    nextBilling: '2024-03-20',
    tier: 'STARTER',
  },
];

const mockCreators: Creator[] = [
  {
    id: '1',
    email: 'sarah@example.com',
    name: 'Sarah Johnson',
    firstName: 'Sarah',
    lastName: 'Johnson',
    joinedAt: '2024-01-15',
    status: 'active',
    dealsCount: 15,
    totalEarnings: 45000,
    averageRating: 4.8,
    lastActive: '2024-01-10',
    categories: ['Fashion', 'Lifestyle'],
    portfolio: {
      followers: 125000,
      engagementRate: 4.2,
      platforms: ['Instagram', 'TikTok', 'YouTube'],
      avgViews: 25000,
    },
    specialties: ['Fashion Photography', 'Brand Collaborations'],
    location: 'New York, NY',
  },
  {
    id: '2',
    email: 'mike@example.com',
    name: 'Mike Chen',
    firstName: 'Mike',
    lastName: 'Chen',
    joinedAt: '2024-02-01',
    status: 'active',
    dealsCount: 8,
    totalEarnings: 22000,
    averageRating: 4.6,
    lastActive: '2024-01-09',
    categories: ['Tech', 'Gaming'],
    portfolio: {
      followers: 89000,
      engagementRate: 5.1,
      platforms: ['YouTube', 'Twitch', 'Twitter'],
      avgViews: 45000,
    },
    specialties: ['Tech Reviews', 'Gaming Content'],
    location: 'San Francisco, CA',
  },
  {
    id: '3',
    email: 'emma@example.com',
    name: 'Emma Davis',
    firstName: 'Emma',
    lastName: 'Davis',
    joinedAt: '2024-02-20',
    status: 'pending',
    dealsCount: 0,
    totalEarnings: 0,
    averageRating: 0,
    lastActive: '2024-02-20',
    categories: ['Beauty', 'Health'],
    portfolio: {
      followers: 67000,
      engagementRate: 3.8,
      platforms: ['Instagram', 'YouTube'],
      avgViews: 18000,
    },
    specialties: ['Beauty Tutorials', 'Wellness Content'],
    location: 'Los Angeles, CA',
  },
];

const mockDeals: Deal[] = [
  {
    id: '1',
    title: 'TechFlow Q1 Product Launch',
    client: { id: '1', name: 'TechFlow' },
    creator: { id: '1', name: 'Sarah Johnson' },
    status: 'ACTIVE',
    value: 8500,
    commission: 1275,
    createdAt: '2024-01-20',
    deadline: '2024-03-15',
    milestones: 3,
    completedMilestones: 1,
  },
  {
    id: '2',
    title: 'StyleCorp Summer Collection',
    client: { id: '2', name: 'StyleCorp' },
    creator: { id: '2', name: 'Mike Chen' },
    status: 'DELIVERED',
    value: 6200,
    commission: 930,
    createdAt: '2024-02-01',
    deadline: '2024-02-28',
    milestones: 2,
    completedMilestones: 2,
  },
  {
    id: '3',
    title: 'FitLife Wellness Campaign',
    client: { id: '3', name: 'FitLife' },
    creator: { id: '3', name: 'Emma Davis' },
    status: 'PENDING',
    value: 3200,
    commission: 480,
    createdAt: '2024-02-25',
    deadline: '2024-03-25',
    milestones: 2,
    completedMilestones: 0,
  },
];

export function AgencyDashboard() {
  const [stats, setStats] = useState<AgencyStats>(mockStats);
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [creators, setCreators] = useState<Creator[]>(mockCreators);
  const [deals, setDeals] = useState<Deal[]>(mockDeals);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteType, setInviteType] = useState<'creator' | 'client'>('creator');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDeals = deals.filter(deal =>
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.creator.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Invitation Sent",
        description: `${inviteType === 'creator' ? 'Creator' : 'Client'} invitation sent to ${inviteEmail}`,
      });
      setInviteEmail('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
      case 'active':
      case 'ACTIVE':
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'PENDING':
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'DELIVERED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agency Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Orchestrate campaigns across clients and creators
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalClients}
                  <span className="text-sm text-gray-500">/{stats.clientLimit}</span>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{stats.monthlyGrowth}% growth
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Creators</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCreators}
                  <span className="text-sm text-gray-500">/{stats.creatorLimit}</span>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Active portfolio
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
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
                  {formatCurrency(stats.avgDealValue)} avg
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Commission</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalCommission)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  15% rate
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion</p>
                <p className="text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                <p className="text-sm text-green-600 mt-1">
                  Deal success rate
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Orchestrate deals between clients and creators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Building2 className="h-5 w-5 mb-2" />
                  <span>Onboard Client</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Users className="h-5 w-5 mb-2" />
                  <span>Invite Creator</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Plus className="h-5 w-5 mb-2" />
                  <span>Create Deal</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-5 w-5 mb-2" />
                  <span>View Reports</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Deals Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle>Active Deals Pipeline</CardTitle>
                <CardDescription>Current deal progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deals.slice(0, 3).map((deal) => (
                    <div key={deal.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{deal.title}</h4>
                        <Badge className={getStatusColor(deal.status)}>
                          {deal.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        {deal.client.name} → {deal.creator.name}
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-sm font-medium">{formatCurrency(deal.value)}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            Commission: {formatCurrency(deal.commission)}
                          </span>
                        </div>
                        <Progress 
                          value={(deal.completedMilestones / deal.milestones) * 100} 
                          className="w-20 h-2" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      type: 'deal_completed',
                      message: 'StyleCorp campaign completed by Mike Chen',
                      time: '2 hours ago',
                      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
                      amount: '$930 commission earned',
                    },
                    {
                      type: 'client_onboarded',
                      message: 'FitLife joined as new client',
                      time: '1 day ago',
                      icon: <Building2 className="h-4 w-4 text-blue-600" />,
                      amount: 'STARTER tier',
                    },
                    {
                      type: 'deal_created',
                      message: 'New deal created: TechFlow Q1 Launch',
                      time: '2 days ago',
                      icon: <Plus className="h-4 w-4 text-purple-600" />,
                      amount: '$8,500 value',
                    },
                    {
                      type: 'creator_invited',
                      message: 'Emma Davis accepted creator invitation',
                      time: '3 days ago',
                      icon: <UserCheck className="h-4 w-4 text-green-600" />,
                      amount: 'Beauty & Health niche',
                    },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                      {activity.icon}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <div className="flex justify-between">
                          <p className="text-xs text-gray-500">{activity.time}</p>
                          <p className="text-xs text-gray-700 font-medium">{activity.amount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Creators</CardTitle>
                <CardDescription>Based on earnings and ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {creators
                    .filter(c => c.status === 'active')
                    .sort((a, b) => b.totalEarnings - a.totalEarnings)
                    .slice(0, 3)
                    .map((creator, index) => (
                      <div key={creator.id} className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{creator.firstName[0]}{creator.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{creator.name}</p>
                          <p className="text-xs text-gray-500">{creator.categories[0]}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(creator.totalEarnings)}</p>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600 ml-1">{creator.averageRating}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Spending Clients</CardTitle>
                <CardDescription>Based on total campaign spend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients
                    .filter(c => c.status === 'active')
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .map((client, index) => (
                      <div key={client.id} className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{client.name[0]}{client.name[1] || ''}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{client.name}</p>
                          <p className="text-xs text-gray-500">{client.industry}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{formatCurrency(client.totalSpent)}</p>
                          <p className="text-xs text-gray-600">{client.dealsCount} deals</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {/* Client Management Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients..."
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
              <Button size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Onboard Client
              </Button>
            </div>
          </div>

          {/* Client Onboarding */}
          <Card>
            <CardHeader>
              <CardTitle>Onboard New Client</CardTitle>
              <CardDescription>
                Invite a brand to join your agency for campaign management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="client@brand.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Select value={inviteType} onValueChange={(value: 'creator' | 'client') => setInviteType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Clients will receive onboarding instructions and access to your agency services
              </p>
            </CardContent>
          </Card>

          {/* Client List */}
          <div className="grid gap-4">
            {filteredClients.map((client) => (
              <Card key={client.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {client.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">{client.name}</h3>
                        <p className="text-sm text-gray-500">{client.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                          <Badge variant="outline">
                            {client.industry}
                          </Badge>
                          <Badge variant="outline">
                            {client.tier}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{client.activeCampaigns}</p>
                          <p className="text-xs text-gray-500">Active Campaigns</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(client.totalSpent)}
                          </p>
                          <p className="text-xs text-gray-500">Total Spent</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {client.averageRating > 0 ? client.averageRating.toFixed(1) : '—'}
                          </p>
                          <p className="text-xs text-gray-500">Rating</p>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 mt-3">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          {/* Creator Portfolio Header */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search creators..."
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
              <Button size="sm">
                <Users className="h-4 w-4 mr-2" />
                Invite Creator
              </Button>
            </div>
          </div>

          {/* Creator Portfolio Management */}
          <div className="grid gap-4">
            {filteredCreators.map((creator) => (
              <Card key={creator.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-purple-100 text-purple-600 text-lg font-bold">
                        {creator.firstName[0]}{creator.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{creator.name}</h3>
                          <p className="text-sm text-gray-500">{creator.location}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getStatusColor(creator.status)}>
                              {creator.status}
                            </Badge>
                            {creator.categories.map((category) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Portfolio
                          </Button>
                          <Button variant="outline" size="sm">
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Propose Deal
                          </Button>
                        </div>
                      </div>
                      
                      {/* Creator Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-lg font-bold text-gray-900">{formatNumber(creator.portfolio.followers)}</p>
                          <p className="text-xs text-gray-500">Followers</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-lg font-bold text-gray-900">{creator.portfolio.engagementRate}%</p>
                          <p className="text-xs text-gray-500">Engagement</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(creator.totalEarnings)}</p>
                          <p className="text-xs text-gray-500">Earned</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                            <span className="text-lg font-bold text-gray-900">
                              {creator.averageRating > 0 ? creator.averageRating.toFixed(1) : '—'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">Rating</p>
                        </div>
                      </div>
                      
                      {/* Platforms & Specialties */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {creator.portfolio.platforms.map((platform) => (
                          <Badge key={platform} variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {platform}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {creator.specialties.map((specialty) => (
                          <Badge key={specialty} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
          {/* Deal Pipeline Header */}
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
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
            </div>
          </div>

          {/* Deal Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {['DRAFT', 'PENDING', 'ACTIVE', 'DELIVERED', 'COMPLETED'].map((status) => (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {deals.filter(d => d.status === status).length}
                    </p>
                    <p className="text-sm text-gray-600">{status}</p>
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
                        {deal.client.name} → {deal.creator.name}
                      </p>
                    </div>
                    <Badge className={getStatusColor(deal.status)}>
                      {deal.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Deal Value</p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(deal.value)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Your Commission</p>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(deal.commission)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Progress</p>
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={(deal.completedMilestones / deal.milestones) * 100} 
                          className="flex-1 h-2" 
                        />
                        <span className="text-sm text-gray-600">
                          {deal.completedMilestones}/{deal.milestones}
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
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Messages
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Commission Revenue</CardTitle>
                <CardDescription>Your earnings from facilitated deals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(stats.totalCommission)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-600" />
                  +{stats.monthlyGrowth}% from last month
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deal Success Rate</CardTitle>
                <CardDescription>Percentage of completed deals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.conversionRate}%
                </div>
                <div className="text-sm text-gray-600">
                  {deals.filter(d => d.status === 'COMPLETED').length} of {deals.length} deals completed
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Deal Value</CardTitle>
                <CardDescription>Mean value per deal</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {formatCurrency(stats.avgDealValue)}
                </div>
                <div className="text-sm text-gray-600">
                  Across {deals.length} total deals
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Client Performance</CardTitle>
              <CardDescription>Spend and activity by client</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {clients
                  .sort((a, b) => b.totalSpent - a.totalSpent)
                  .map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {client.name.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-gray-500">{client.industry}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(client.totalSpent)}</p>
                        <p className="text-sm text-gray-500">{client.dealsCount} deals</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Creator Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Creator Performance</CardTitle>
              <CardDescription>Earnings and ratings by creator</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {creators
                  .filter(c => c.status === 'active')
                  .sort((a, b) => b.totalEarnings - a.totalEarnings)
                  .map((creator) => (
                    <div key={creator.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-purple-100 text-purple-600">
                            {creator.firstName[0]}{creator.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{creator.name}</p>
                          <p className="text-sm text-gray-500">{creator.categories[0]}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(creator.totalEarnings)}</p>
                        <div className="flex items-center">
                          <Star className="h-3 w-3 text-yellow-400 fill-current mr-1" />
                          <span className="text-sm text-gray-600">{creator.averageRating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Warning */}
      {stats.totalCreators >= stats.creatorLimit * 0.8 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Approaching Creator Limit
                </p>
                <p className="text-sm text-yellow-700">
                  You're using {stats.totalCreators} of {stats.creatorLimit} creator slots. 
                  Consider upgrading your plan to add more creators.
                </p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">
                Upgrade Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
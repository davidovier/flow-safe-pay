import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Creator {
  id: string;
  email: string;
  name: string;
  joinedAt: string;
  status: 'active' | 'pending' | 'inactive';
  dealsCount: number;
  totalEarnings: number;
  averageRating: number;
  lastActive: string;
  categories: string[];
}

interface AgencyStats {
  totalCreators: number;
  activeDeals: number;
  totalRevenue: number;
  avgDealValue: number;
  monthlyGrowth: number;
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  creatorLimit: number;
}

// Mock data - replace with actual API calls
const mockStats: AgencyStats = {
  totalCreators: 12,
  activeDeals: 8,
  totalRevenue: 125000,
  avgDealValue: 2500,
  monthlyGrowth: 23,
  subscriptionTier: 'PROFESSIONAL',
  creatorLimit: 25,
};

const mockCreators: Creator[] = [
  {
    id: '1',
    email: 'sarah@example.com',
    name: 'Sarah Johnson',
    joinedAt: '2024-01-15',
    status: 'active',
    dealsCount: 15,
    totalEarnings: 45000,
    averageRating: 4.8,
    lastActive: '2024-01-10',
    categories: ['Fashion', 'Lifestyle'],
  },
  {
    id: '2',
    email: 'mike@example.com',
    name: 'Mike Chen',
    joinedAt: '2024-02-01',
    status: 'active',
    dealsCount: 8,
    totalEarnings: 22000,
    averageRating: 4.6,
    lastActive: '2024-01-09',
    categories: ['Tech', 'Gaming'],
  },
  {
    id: '3',
    email: 'emma@example.com',
    name: 'Emma Davis',
    joinedAt: '2024-02-20',
    status: 'pending',
    dealsCount: 0,
    totalEarnings: 0,
    averageRating: 0,
    lastActive: '2024-02-20',
    categories: ['Beauty', 'Health'],
  },
];

export function AgencyDashboard() {
  const [stats, setStats] = useState<AgencyStats>(mockStats);
  const [creators, setCreators] = useState<Creator[]>(mockCreators);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    creator.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteCreator = async () => {
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
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${inviteEmail}`,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agency Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your creators and track performance
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Creators</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalCreators}
                  <span className="text-sm text-gray-500">/{stats.creatorLimit}</span>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{stats.monthlyGrowth}% this month
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
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalRevenue)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% vs last month
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
                <p className="text-sm font-medium text-gray-600">Subscription</p>
                <p className="text-lg font-bold text-gray-900">{stats.subscriptionTier}</p>
                <Button variant="link" className="p-0 h-auto text-sm text-purple-600">
                  Upgrade Plan <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="creators">Creators</TabsTrigger>
          <TabsTrigger value="deals">Deals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to manage your agency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Plus className="h-5 w-5 mb-2" />
                  <span>Invite Creator</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <BarChart3 className="h-5 w-5 mb-2" />
                  <span>View Analytics</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Settings className="h-5 w-5 mb-2" />
                  <span>Manage Settings</span>
                </Button>
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
                    message: 'Sarah Johnson completed a $3,500 deal',
                    time: '2 hours ago',
                    icon: <UserCheck className="h-4 w-4 text-green-600" />,
                  },
                  {
                    type: 'creator_joined',
                    message: 'Emma Davis accepted your invitation',
                    time: '1 day ago',
                    icon: <Users className="h-4 w-4 text-blue-600" />,
                  },
                  {
                    type: 'payment_received',
                    message: 'Monthly subscription payment processed',
                    time: '3 days ago',
                    icon: <DollarSign className="h-4 w-4 text-green-600" />,
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                    {activity.icon}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="creators" className="space-y-6">
          {/* Creator Management Header */}
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
            </div>
          </div>

          {/* Invite Creator */}
          <Card>
            <CardHeader>
              <CardTitle>Invite New Creator</CardTitle>
              <CardDescription>
                Send an invitation to a creator to join your agency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="creator@example.com"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleInviteCreator} disabled={loading}>
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
                Creators will receive an email invitation to join your agency
              </p>
            </CardContent>
          </Card>

          {/* Creator List */}
          <div className="grid gap-4">
            {filteredCreators.map((creator) => (
              <Card key={creator.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-purple-600">
                          {creator.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{creator.name}</h3>
                        <p className="text-sm text-gray-500">{creator.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge 
                            variant={creator.status === 'active' ? 'default' : 
                                   creator.status === 'pending' ? 'secondary' : 'outline'}
                          >
                            {creator.status}
                          </Badge>
                          <div className="flex space-x-1">
                            {creator.categories.map((category) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{creator.dealsCount}</p>
                          <p className="text-xs text-gray-500">Deals</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(creator.totalEarnings)}
                          </p>
                          <p className="text-xs text-gray-500">Earned</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {creator.averageRating > 0 ? creator.averageRating.toFixed(1) : '—'}
                          </p>
                          <p className="text-xs text-gray-500">Rating</p>
                        </div>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        Last active: {new Date(creator.lastActive).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deals" className="space-y-6">
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Deals Management</h3>
              <p className="text-gray-600 mb-4">
                View and manage all deals created by your creators
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
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
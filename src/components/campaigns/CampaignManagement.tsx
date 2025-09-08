import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar as CalendarIcon,
  DollarSign,
  Users,
  Target,
  TrendingUp,
  Edit,
  Trash2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  targetAudience: string;
  objectives: string[];
  creatorsCount: number;
  deliverablesCount: number;
  pendingApprovals: number;
  completedDeliverables: number;
  createdAt: string;
  updatedAt: string;
}

interface CampaignFormData {
  name: string;
  description: string;
  budget: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  objectives: string[];
  contentTypes: string[];
  requirements: string;
}

export function CampaignManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
    targetAudience: '',
    objectives: [],
    contentTypes: [],
    requirements: '',
  });

  const { toast } = useToast();

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchTerm, statusFilter]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Summer Fashion Collection',
          description: 'Promote our new summer collection with lifestyle content',
          status: 'ACTIVE',
          budget: 15000,
          spent: 8500,
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          targetAudience: 'Women 18-35, fashion enthusiasts',
          objectives: ['Brand Awareness', 'Sales Conversion'],
          creatorsCount: 8,
          deliverablesCount: 24,
          pendingApprovals: 3,
          completedDeliverables: 18,
          createdAt: '2024-05-15T10:00:00Z',
          updatedAt: '2024-07-01T14:30:00Z',
        },
        {
          id: '2',
          name: 'Tech Product Launch',
          description: 'Launch campaign for our new smart watch',
          status: 'ACTIVE',
          budget: 25000,
          spent: 18750,
          startDate: '2024-07-15',
          endDate: '2024-09-15',
          targetAudience: 'Tech enthusiasts 25-45',
          objectives: ['Product Launch', 'Brand Awareness', 'Sales Conversion'],
          creatorsCount: 12,
          deliverablesCount: 36,
          pendingApprovals: 6,
          completedDeliverables: 28,
          createdAt: '2024-06-20T09:00:00Z',
          updatedAt: '2024-07-20T16:45:00Z',
        },
        {
          id: '3',
          name: 'Holiday Promotion',
          description: 'Holiday season promotional campaign',
          status: 'DRAFT',
          budget: 20000,
          spent: 0,
          startDate: '2024-11-01',
          endDate: '2024-12-31',
          targetAudience: 'General audience, gift shoppers',
          objectives: ['Sales Conversion', 'Holiday Marketing'],
          creatorsCount: 0,
          deliverablesCount: 0,
          pendingApprovals: 0,
          completedDeliverables: 0,
          createdAt: '2024-07-25T11:00:00Z',
          updatedAt: '2024-07-25T11:00:00Z',
        },
        {
          id: '4',
          name: 'Spring Wellness Series',
          description: 'Wellness and health campaign for spring season',
          status: 'COMPLETED',
          budget: 12000,
          spent: 11850,
          startDate: '2024-03-01',
          endDate: '2024-05-31',
          targetAudience: 'Health-conscious individuals 20-50',
          objectives: ['Brand Awareness', 'Community Building'],
          creatorsCount: 6,
          deliverablesCount: 18,
          pendingApprovals: 0,
          completedDeliverables: 18,
          createdAt: '2024-02-10T10:00:00Z',
          updatedAt: '2024-06-01T10:00:00Z',
        },
      ];

      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCampaigns = () => {
    let filtered = campaigns;

    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter);
    }

    setFilteredCampaigns(filtered);
  };

  const handleCreateCampaign = async () => {
    try {
      // Validate form data
      if (!formData.name || !formData.budget || !formData.startDate || !formData.endDate) {
        toast({
          title: 'Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      // Mock API call - replace with actual implementation
      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        status: 'DRAFT',
        budget: parseFloat(formData.budget),
        spent: 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        targetAudience: formData.targetAudience,
        objectives: formData.objectives,
        creatorsCount: 0,
        deliverablesCount: 0,
        pendingApprovals: 0,
        completedDeliverables: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setCampaigns([newCampaign, ...campaigns]);
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        budget: '',
        startDate: '',
        endDate: '',
        targetAudience: '',
        objectives: [],
        contentTypes: [],
        requirements: '',
      });

      toast({
        title: 'Success',
        description: 'Campaign created successfully',
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to create campaign',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      // Mock API call - replace with actual implementation
      setCampaigns(campaigns.map(campaign =>
        campaign.id === campaignId
          ? { ...campaign, status: newStatus as Campaign['status'], updatedAt: new Date().toISOString() }
          : campaign
      ));

      toast({
        title: 'Success',
        description: `Campaign ${newStatus.toLowerCase()} successfully`,
      });
    } catch (error) {
      console.error('Error updating campaign status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update campaign status',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Play className="h-4 w-4" />;
      case 'DRAFT': return <Edit className="h-4 w-4" />;
      case 'PAUSED': return <Pause className="h-4 w-4" />;
      case 'COMPLETED': return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
      year: 'numeric',
    });
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
          <h1 className="text-3xl font-bold tracking-tight">Campaign Management</h1>
          <p className="text-muted-foreground">
            Create and manage your creator marketing campaigns.
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Set up a new creator marketing campaign with your objectives and requirements.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Summer Fashion Collection"
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Budget *</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="15000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your campaign objectives and messaging..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="Women 18-35, fashion enthusiasts"
                />
              </div>

              <div>
                <Label htmlFor="requirements">Content Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Specify content guidelines, deliverable requirements, brand messaging..."
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign}>
                Create Campaign
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Campaigns</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Grid */}
      <div className="grid gap-6">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{campaign.name}</CardTitle>
                    <Badge className={getStatusColor(campaign.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(campaign.status)}
                        {campaign.status}
                      </span>
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{campaign.description}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {campaign.objectives.join(', ')}
                    </span>
                  </div>
                </div>
                <div className="text-right ml-6">
                  <div className="text-lg font-semibold mb-1">
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
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Users className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">Creators</span>
                    </div>
                    <div className="text-lg font-semibold">{campaign.creatorsCount}</div>
                  </div>
                  
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <CheckCircle className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">Completed</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {campaign.completedDeliverables}/{campaign.deliverablesCount}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <Clock className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">Pending</span>
                    </div>
                    <div className="text-lg font-semibold text-yellow-600">
                      {campaign.pendingApprovals}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 border rounded-lg">
                    <div className="flex items-center justify-center mb-1">
                      <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">Progress</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {Math.round((campaign.completedDeliverables / campaign.deliverablesCount) * 100) || 0}%
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2">
                  <div className="text-sm text-muted-foreground">
                    Target: {campaign.targetAudience}
                  </div>
                  <div className="flex gap-2">
                    {campaign.status === 'DRAFT' && (
                      <Button 
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Launch
                      </Button>
                    )}
                    {campaign.status === 'ACTIVE' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusChange(campaign.id, 'PAUSED')}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    {campaign.status === 'PAUSED' && (
                      <Button 
                        size="sm"
                        onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters to see more campaigns.'
                : "Get started by creating your first campaign."}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
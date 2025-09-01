import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Handshake,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Settings,
  Share2,
  Loader2
} from 'lucide-react';
import { CreateDealForm } from '@/components/deals/CreateDealForm';

interface Project {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  brand_id: string;
  users: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  deals: Array<{
    id: string;
    creator_id: string | null;
    amount_total: number;
    state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
    created_at: string;
    users: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
    milestones: Array<{
      id: string;
      title: string;
      amount: number;
      state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
      due_at: string | null;
    }>;
  }>;
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDealModalOpen, setIsCreateDealModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    if (!id || !userProfile) return;
    
    setLoading(true);
    try {
      // Fetch project with all related data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          users!brand_id (
            id, email, first_name, last_name
          ),
          deals (
            id, creator_id, amount_total, state, created_at,
            users (
              id, email, first_name, last_name
            ),
            milestones (
              id, title, amount, state, due_at
            )
          )
        `)
        .eq('id', id)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError);
        if (projectError.code === 'PGRST116') {
          toast({
            title: "Project Not Found",
            description: "The requested project could not be found.",
            variant: "destructive"
          });
          navigate('/projects');
          return;
        }
        throw projectError;
      }

      // Check if user has access to this project
      const hasAccess = 
        userProfile.role === 'ADMIN' ||
        (userProfile.role === 'BRAND' && projectData.brand_id === userProfile.id);

      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this project.",
          variant: "destructive"
        });
        navigate('/projects');
        return;
      }

      setProject(projectData);

      // Initialize edit form data
      setEditFormData({
        title: projectData.title,
        description: projectData.description || '',
        status: projectData.status,
      });

    } catch (error) {
      console.error('Error fetching project details:', error);
      toast({
        title: "Error",
        description: "Failed to load project details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getProjectProgress = () => {
    if (!project?.deals || project.deals.length === 0) return 0;
    
    const totalMilestones = project.deals.reduce((sum, deal) => sum + deal.milestones.length, 0);
    const completedMilestones = project.deals.reduce(
      (sum, deal) => sum + deal.milestones.filter(m => m.state === 'RELEASED').length, 
      0
    );
    
    return totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;
  };

  const getTotalProjectValue = () => {
    if (!project?.deals) return 0;
    return project.deals.reduce((sum, deal) => sum + deal.amount_total, 0);
  };

  const getActiveDeals = () => {
    if (!project?.deals) return 0;
    return project.deals.filter(deal => deal.state === 'FUNDED').length;
  };

  const getProjectStats = () => {
    const deals = project?.deals || [];
    const totalCreators = new Set(deals.filter(d => d.creator_id).map(d => d.creator_id)).size;
    const totalMilestones = deals.reduce((sum, deal) => sum + deal.milestones.length, 0);
    const completedMilestones = deals.reduce(
      (sum, deal) => sum + deal.milestones.filter(m => m.state === 'RELEASED').length, 
      0
    );

    return {
      totalCreators,
      totalMilestones,
      completedMilestones,
      pendingDeals: deals.filter(d => d.state === 'DRAFT').length,
      activeDeals: deals.filter(d => d.state === 'FUNDED').length,
      completedDeals: deals.filter(d => d.state === 'RELEASED').length
    };
  };

  const getDealsStatusColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'secondary';
      case 'FUNDED': return 'default';
      case 'RELEASED': return 'success';
      case 'DISPUTED': return 'warning';
      case 'REFUNDED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getMilestoneStatusIcon = (state: string) => {
    switch (state) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'SUBMITTED': return <Target className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'RELEASED': return <CheckCircle className="h-4 w-4" />;
      case 'DISPUTED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !userProfile) return;

    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title: editFormData.title,
          description: editFormData.description || null,
          status: editFormData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', project.id)
        .eq('brand_id', userProfile.id); // Ensure user can only edit their own projects

      if (error) throw error;

      toast({
        title: 'Project updated!',
        description: 'Your project has been updated successfully.',
      });

      setIsEditProjectModalOpen(false);
      fetchProjectDetails(); // Refresh project data
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error updating project',
        description: error.message,
      });
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded w-48"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const stats = getProjectStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
            <p className="text-muted-foreground">Project #{project.id.slice(-8)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {project.status}
          </Badge>
          <Dialog open={isEditProjectModalOpen} onOpenChange={setIsEditProjectModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Edit Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Project Title *</Label>
                  <Input
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) => handleEditInputChange('title', e.target.value)}
                    placeholder="e.g., Summer 2024 Campaign"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => handleEditInputChange('description', e.target.value)}
                    placeholder="Describe your project goals, target audience, and key messaging..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editFormData.status} onValueChange={(value) => handleEditInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditProjectModalOpen(false)}
                    disabled={editLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editLoading}>
                    {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Project
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDealModalOpen} onOpenChange={setIsCreateDealModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Deal</DialogTitle>
              </DialogHeader>
              <CreateDealForm 
                onSuccess={() => {
                  setIsCreateDealModalOpen(false);
                  fetchProjectDetails();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(getTotalProjectValue())}</div>
            <p className="text-xs text-muted-foreground">
              Across {project.deals.length} deal{project.deals.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getProjectProgress().toFixed(0)}%</div>
            <Progress value={getProjectProgress()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getActiveDeals()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingDeals} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creators</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCreators}</div>
            <p className="text-xs text-muted-foreground">
              Working on project
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="deals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deals">Deals</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Project Deals</h2>
            <Badge variant="outline">
              {project.deals.length} deal{project.deals.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {project.deals.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Handshake className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Deals Yet</h3>
                  <p className="text-muted-foreground mb-4">Start by creating your first deal with a creator.</p>
                  <Button onClick={() => setIsCreateDealModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Deal
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {project.deals.map((deal) => (
                <Card key={deal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Deal #{deal.id.slice(-8)}
                        </CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{formatCurrency(deal.amount_total)}</span>
                          <span>•</span>
                          <span>{deal.milestones.length} milestone{deal.milestones.length !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>Created {formatDate(deal.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getDealsStatusColor(deal.state) as any}>
                          {deal.state}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/deals/${deal.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Creator</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.users ? 
                          `${deal.users.first_name || ''} ${deal.users.last_name || ''}`.trim() || deal.users.email :
                          'Not Assigned'
                        }
                      </p>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Milestones</h4>
                      <div className="space-y-2">
                        {deal.milestones.slice(0, 3).map((milestone, index) => (
                          <div key={milestone.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              {getMilestoneStatusIcon(milestone.state)}
                              <span>{index + 1}. {milestone.title}</span>
                            </div>
                            <span className="font-medium">{formatCurrency(milestone.amount)}</span>
                          </div>
                        ))}
                        {deal.milestones.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{deal.milestones.length - 3} more milestone{deal.milestones.length - 3 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="milestones" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">All Milestones</h2>
            <Badge variant="outline">
              {stats.completedMilestones} of {stats.totalMilestones} completed
            </Badge>
          </div>

          <div className="space-y-4">
            {project.deals.map((deal) =>
              deal.milestones.map((milestone, index) => (
                <Card key={milestone.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium">{milestone.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Deal #{deal.id.slice(-8)}</span>
                          <span>•</span>
                          <span>{formatCurrency(milestone.amount)}</span>
                          {milestone.due_at && (
                            <>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>Due {formatDate(milestone.due_at)}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={getDealsStatusColor(milestone.state) as any} className="flex items-center gap-1">
                        {getMilestoneStatusIcon(milestone.state)}
                        {milestone.state}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {project.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Project Details</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Status:</span> {project.status}</div>
                    <div><span className="font-medium">Created:</span> {formatDate(project.created_at)}</div>
                    <div><span className="font-medium">Last Updated:</span> {formatDate(project.updated_at)}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Statistics</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Total Deals:</span> {project.deals.length}</div>
                    <div><span className="font-medium">Active Deals:</span> {stats.activeDeals}</div>
                    <div><span className="font-medium">Total Milestones:</span> {stats.totalMilestones}</div>
                    <div><span className="font-medium">Completed Milestones:</span> {stats.completedMilestones}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Project Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="mx-auto h-16 w-16 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Analytics Coming Soon</h3>
                <p>Detailed project analytics and performance metrics will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
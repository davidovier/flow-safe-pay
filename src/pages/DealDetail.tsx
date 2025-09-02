import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FundDealForm } from '@/components/deals/FundDealForm';
import { DealStatusTimeline } from '@/components/deals/DealStatusTimeline';
import { DeliverableViewer } from '@/components/deliverables/DeliverableViewer';
import { DisputeForm } from '@/components/disputes/DisputeForm';
import { 
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  MessageSquare,
  FileText,
  Shield,
  TrendingUp,
  Eye,
  Download,
  Edit,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  CreditCard
} from 'lucide-react';

interface Deal {
  id: string;
  project_id: string;
  creator_id: string | null;
  currency: string;
  amount_total: number;
  escrow_id: string | null;
  state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  created_at: string;
  updated_at: string;
  projects: {
    id: string;
    title: string;
    description: string | null;
    users: {
      id: string;
      email: string;
      first_name: string | null;
      last_name: string | null;
    };
  };
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
    created_at: string;
    deliverables?: Array<{
      id: string;
      milestone_id: string;
      url: string | null;
      file_hash: string | null;
      submitted_at: string | null;
      checks: any;
      created_at: string;
      updated_at: string;
    }>;
  }>;
}

interface MilestoneReviewData {
  milestoneId: string;
  action: 'approve' | 'reject' | 'request_revision';
  feedback: string;
}

interface EditDealData {
  project_id: string;
  creator_id: string | null;
  amount_total: number;
  currency: string;
  state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
}

interface EditMilestoneData {
  id?: string;
  title: string;
  amount: number;
  due_at: string;
}

interface MilestoneEditFormData {
  milestones: EditMilestoneData[];
}

export default function DealDetail() {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [milestonesEditLoading, setMilestonesEditLoading] = useState(false);
  
  // Review modal state
  const [reviewData, setReviewData] = useState<MilestoneReviewData>({
    milestoneId: '',
    action: 'approve',
    feedback: ''
  });

  // Edit modal states
  const [isEditDealModalOpen, setIsEditDealModalOpen] = useState(false);
  const [isEditMilestonesModalOpen, setIsEditMilestonesModalOpen] = useState(false);
  const [editDealData, setEditDealData] = useState<EditDealData>({
    project_id: '',
    creator_id: null,
    amount_total: 0,
    currency: 'USD',
    state: 'DRAFT'
  });
  const [editMilestonesData, setEditMilestonesData] = useState<MilestoneEditFormData>({
    milestones: []
  });
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [showFundingForm, setShowFundingForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDealDetails();
    }
  }, [id]);

  const fetchDealDetails = async () => {
    if (!id || !userProfile) return;
    
    setLoading(true);
    try {
      // Fetch deal with all related data
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .select(`
          *,
          projects!inner (
            id, title, description,
            users!brand_id (
              id, email, first_name, last_name
            )
          ),
          users (
            id, email, first_name, last_name
          ),
          milestones (
            id, title, amount, state, due_at, created_at
          )
        `)
        .eq('id', id)
        .single();

      if (dealError) {
        console.error('Error fetching deal:', dealError);
        if (dealError.code === 'PGRST116') {
          toast({
            title: "Deal Not Found",
            description: "The requested deal could not be found.",
            variant: "destructive"
          });
          navigate('/deals');
          return;
        }
        throw dealError;
      }

      // Check if user has access to this deal
      const hasAccess = 
        userProfile.role === 'ADMIN' ||
        (userProfile.role === 'BRAND' && dealData.projects.users.id === userProfile.id) ||
        (userProfile.role === 'CREATOR' && dealData.creator_id === userProfile.id);

      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this deal.",
          variant: "destructive"
        });
        navigate('/deals');
        return;
      }

      // Fetch deliverables for each milestone if they exist
      const milestonesWithDeliverables = await Promise.all(
        (dealData.milestones || []).map(async (milestone) => {
          try {
            const { data: deliverables } = await supabase
              .from('deliverables')
              .select('*')
              .eq('milestone_id', milestone.id);
            
            return {
              ...milestone,
              deliverables: deliverables || []
            };
          } catch (error) {
            console.warn('Could not fetch deliverables for milestone:', milestone.id);
            return {
              ...milestone,
              deliverables: []
            };
          }
        })
      );

      setDeal({
        ...dealData,
        milestones: milestonesWithDeliverables
      });

      // Initialize edit form data
      setEditDealData({
        project_id: dealData.project_id,
        creator_id: dealData.creator_id,
        amount_total: dealData.amount_total,
        currency: dealData.currency,
        state: dealData.state
      });

      setEditMilestonesData({
        milestones: milestonesWithDeliverables.map(m => ({
          id: m.id,
          title: m.title,
          amount: m.amount,
          due_at: m.due_at ? new Date(m.due_at).toISOString().split('T')[0] : ''
        }))
      });

    } catch (error) {
      console.error('Error fetching deal details:', error);
      toast({
        title: "Error",
        description: "Failed to load deal details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMilestoneReview = async () => {
    if (!reviewData.milestoneId || !userProfile) return;

    setReviewLoading(true);
    try {
      // Find the deliverable for this milestone
      const milestone = deal?.milestones.find(m => m.id === reviewData.milestoneId);
      const deliverable = milestone?.deliverables?.[0];

      if (!deliverable) {
        toast({
          title: "No Deliverable Found",
          description: "No deliverable found for this milestone.",
          variant: "destructive"
        });
        return;
      }

      // Direct database update since review_deliverable function doesn't exist
      try {
        // Update deliverable status directly
        const status = reviewData.action === 'approve' ? 'approved' : 
                      reviewData.action === 'reject' ? 'rejected' : 'revision_requested';
        
        // Update deliverable checks field to store review data
        const { error: updateError } = await supabase
          .from('deliverables')
          .update({
            checks: { 
              status: status, 
              feedback: reviewData.feedback, 
              reviewed_at: new Date().toISOString(),
              reviewed_by: userProfile.id
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', deliverable.id);

        if (updateError) throw updateError;

        // Update milestone state
        const milestoneState = reviewData.action === 'approve' ? 'APPROVED' : 'SUBMITTED';
        await supabase
          .from('milestones')
          .update({ state: milestoneState })
          .eq('id', reviewData.milestoneId);

      } catch (error: any) {
        throw error;
      }

      toast({
        title: "Review Submitted! ✅",
        description: `Milestone ${reviewData.action}d successfully.`,
      });

      // Refresh deal data
      await fetchDealDetails();
      setIsReviewModalOpen(false);
      setReviewData({ milestoneId: '', action: 'approve', feedback: '' });

    } catch (error: any) {
      console.error('Error reviewing milestone:', error);
      toast({
        title: "Review Failed",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleEditDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || !userProfile) return;

    // Only allow editing if user is brand owner or admin and deal is in DRAFT state
    const canEdit = 
      (userProfile.role === 'BRAND' && deal.projects.users.id === userProfile.id) ||
      userProfile.role === 'ADMIN';

    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit this deal.",
        variant: "destructive"
      });
      return;
    }

    if (deal.state !== 'DRAFT') {
      toast({
        title: "Cannot Edit",
        description: "Only draft deals can be edited.",
        variant: "destructive"
      });
      return;
    }

    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('deals')
        .update({
          amount_total: editDealData.amount_total,
          currency: editDealData.currency,
          updated_at: new Date().toISOString()
        })
        .eq('id', deal.id);

      if (error) throw error;

      toast({
        title: "Deal Updated",
        description: "Deal details have been updated successfully.",
      });

      setIsEditDealModalOpen(false);
      fetchDealDetails(); // Refresh data

    } catch (error: any) {
      console.error('Error updating deal:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update deal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditMilestones = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deal || !userProfile) return;

    // Only allow editing if user is brand owner or admin and deal is in DRAFT state
    const canEdit = 
      (userProfile.role === 'BRAND' && deal.projects.users.id === userProfile.id) ||
      userProfile.role === 'ADMIN';

    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit this deal.",
        variant: "destructive"
      });
      return;
    }

    if (deal.state !== 'DRAFT') {
      toast({
        title: "Cannot Edit",
        description: "Only draft deals can be edited.",
        variant: "destructive"
      });
      return;
    }

    setMilestonesEditLoading(true);
    try {
      // Update existing milestones and create new ones
      for (const milestone of editMilestonesData.milestones) {
        if (milestone.id) {
          // Update existing milestone
          const { error } = await supabase
            .from('milestones')
            .update({
              title: milestone.title,
              amount: milestone.amount,
              due_at: milestone.due_at || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', milestone.id);

          if (error) throw error;
        } else {
          // Create new milestone
          const { error } = await supabase
            .from('milestones')
            .insert({
              deal_id: deal.id,
              title: milestone.title,
              amount: milestone.amount,
              due_at: milestone.due_at || null,
              state: 'PENDING'
            });

          if (error) throw error;
        }
      }

      // Remove milestones that were deleted (exist in original but not in edit data)
      const originalMilestoneIds = deal.milestones.map(m => m.id);
      const editMilestoneIds = editMilestonesData.milestones.filter(m => m.id).map(m => m.id);
      const toDelete = originalMilestoneIds.filter(id => !editMilestoneIds.includes(id));

      if (toDelete.length > 0) {
        const { error } = await supabase
          .from('milestones')
          .delete()
          .in('id', toDelete);

        if (error) throw error;
      }

      toast({
        title: "Milestones Updated",
        description: "Milestones have been updated successfully.",
      });

      setIsEditMilestonesModalOpen(false);
      fetchDealDetails(); // Refresh data

    } catch (error: any) {
      console.error('Error updating milestones:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update milestones. Please try again.",
        variant: "destructive"
      });
    } finally {
      setMilestonesEditLoading(false);
    }
  };

  const addMilestone = () => {
    setEditMilestonesData(prev => ({
      milestones: [...prev.milestones, {
        title: '',
        amount: 0,
        due_at: ''
      }]
    }));
  };

  const removeMilestone = (index: number) => {
    setEditMilestonesData(prev => ({
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index: number, field: keyof EditMilestoneData, value: string | number) => {
    setEditMilestonesData(prev => ({
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'secondary';
      case 'FUNDED': return 'default';
      case 'RELEASED': return 'success';
      case 'DISPUTED': return 'warning';
      case 'REFUNDED': return 'destructive';
      default: return 'secondary';
    }
  };

  const getMilestoneStateIcon = (state: string) => {
    switch (state) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'SUBMITTED': return <Upload className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'RELEASED': return <CheckCircle className="h-4 w-4" />;
      case 'DISPUTED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getMilestoneProgress = () => {
    if (!deal?.milestones) return 0;
    const completed = deal.milestones.filter(m => m.state === 'RELEASED').length;
    return (completed / deal.milestones.length) * 100;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-8 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded w-48"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Deal not found.</p>
      </div>
    );
  }

  const canReviewMilestones = userProfile?.role === 'BRAND' && 
                              deal.projects.users.id === userProfile.id;

  const canFundDeal = userProfile?.role === 'BRAND' && 
                      deal.projects.users.id === userProfile.id &&
                      deal.state === 'DRAFT';

  const canDispute = userProfile && deal.state !== 'DRAFT' && deal.state !== 'REFUNDED';

  // Show funding form
  if (showFundingForm) {
    return (
      <div className="container mx-auto py-8">
        <FundDealForm
          deal={deal}
          onSuccess={() => {
            setShowFundingForm(false);
            fetchDealDetails();
          }}
          onCancel={() => setShowFundingForm(false)}
        />
      </div>
    );
  }

  // Show dispute form
  if (showDisputeForm) {
    return (
      <div className="container mx-auto py-8">
        <DisputeForm
          dealId={deal.id}
          onSuccess={() => {
            setShowDisputeForm(false);
            fetchDealDetails();
          }}
          onCancel={() => setShowDisputeForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/deals')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deals
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{deal.projects.title}</h1>
            <p className="text-muted-foreground">Deal #{deal.id.slice(-8)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStateColor(deal.state) as any} className="text-sm">
            {deal.state}
          </Badge>
          
          {/* Fund Deal Button */}
          {canFundDeal && (
            <Button onClick={() => setShowFundingForm(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Fund Deal
            </Button>
          )}
          
          {/* Dispute Button */}
          {canDispute && (
            <Button variant="outline" onClick={() => setShowDisputeForm(true)}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Open Dispute
            </Button>
          )}
          
          {deal.state === 'DRAFT' && ((userProfile?.role === 'BRAND' && deal.projects.users.id === userProfile.id) || userProfile?.role === 'ADMIN') && (
            <Dialog open={isEditDealModalOpen} onOpenChange={setIsEditDealModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Deal</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleEditDeal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount_total">Total Amount ($)</Label>
                    <Input
                      id="amount_total"
                      type="number"
                      value={editDealData.amount_total / 100}
                      onChange={(e) => setEditDealData(prev => ({
                        ...prev,
                        amount_total: Math.round(parseFloat(e.target.value || '0') * 100)
                      }))}
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={editDealData.currency} 
                      onValueChange={(value) => setEditDealData(prev => ({
                        ...prev,
                        currency: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditDealModalOpen(false)}
                      disabled={editLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={editLoading}>
                      {editLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Deal
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(deal.amount_total)}</div>
            <p className="text-xs text-muted-foreground">
              {deal.currency.toUpperCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMilestoneProgress().toFixed(0)}%</div>
            <Progress value={getMilestoneProgress()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creator</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {deal.users ? 
                `${deal.users.first_name || ''} ${deal.users.last_name || ''}`.trim() || deal.users.email :
                'Not Assigned'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {deal.users?.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {deal.escrow_id ? 'Escrowed' : 'Not Funded'}
            </div>
            <p className="text-xs text-muted-foreground">
              Created {formatDate(deal.created_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="milestones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="communication">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="milestones" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold">Milestones</h2>
              <Badge variant="outline">
                {deal.milestones.length} milestone{deal.milestones.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            {deal.state === 'DRAFT' && ((userProfile?.role === 'BRAND' && deal.projects.users.id === userProfile.id) || userProfile?.role === 'ADMIN') && (
              <Dialog open={isEditMilestonesModalOpen} onOpenChange={setIsEditMilestonesModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Milestones
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Milestones</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleEditMilestones} className="space-y-6">
                    <div className="space-y-4">
                      {editMilestonesData.milestones.map((milestone, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`title-${index}`}>Title</Label>
                                    <Input
                                      id={`title-${index}`}
                                      value={milestone.title}
                                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                                      placeholder="Milestone title"
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`amount-${index}`}>Amount ($)</Label>
                                    <Input
                                      id={`amount-${index}`}
                                      type="number"
                                      value={milestone.amount / 100}
                                      onChange={(e) => updateMilestone(index, 'amount', Math.round(parseFloat(e.target.value || '0') * 100))}
                                      step="0.01"
                                      min="0"
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`due-${index}`}>Due Date (Optional)</Label>
                                  <Input
                                    id={`due-${index}`}
                                    type="date"
                                    value={milestone.due_at}
                                    onChange={(e) => updateMilestone(index, 'due_at', e.target.value)}
                                  />
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeMilestone(index)}
                                disabled={editMilestonesData.milestones.length === 1}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMilestone}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Milestone
                    </Button>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditMilestonesModalOpen(false)}
                        disabled={milestonesEditLoading}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={milestonesEditLoading}>
                        {milestonesEditLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Milestones
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-4">
            {deal.milestones.map((milestone, index) => (
              <Card key={milestone.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">
                        {index + 1}. {milestone.title}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
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
                    <Badge variant={getStateColor(milestone.state) as any} className="flex items-center gap-1">
                      {getMilestoneStateIcon(milestone.state)}
                      {milestone.state}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Deliverables */}
                  {milestone.deliverables && milestone.deliverables.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="font-medium">Deliverables</h4>
                      {milestone.deliverables.map((deliverable) => (
                        <DeliverableViewer
                          key={deliverable.id}
                          deliverable={{
                            ...deliverable,
                            milestone: {
                              ...milestone,
                              deal: deal,
                            },
                          }}
                          onUpdate={fetchDealDetails}
                          showReviewActions={canReviewMilestones}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-8 w-8 mb-2" />
                      <p>No deliverables yet</p>
                      {userProfile?.role === 'CREATOR' && deal.creator_id === userProfile.id && milestone.state === 'PENDING' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => navigate(`/milestones/${milestone.id}/submit`)}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Deliverable
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <DealStatusTimeline deal={deal} />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">
                  {deal.projects.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Brand</h3>
                  <p>{deal.projects.users.first_name} {deal.projects.users.last_name}</p>
                  <p className="text-sm text-muted-foreground">{deal.projects.users.email}</p>
                </div>
                
                {deal.users && (
                  <div>
                    <h3 className="font-semibold mb-2">Creator</h3>
                    <p>{deal.users.first_name} {deal.users.last_name}</p>
                    <p className="text-sm text-muted-foreground">{deal.users.email}</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Deal Information</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span> {formatDate(deal.created_at)}
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span> {formatDate(deal.updated_at)}
                  </div>
                  <div>
                    <span className="font-medium">Currency:</span> {deal.currency.toUpperCase()}
                  </div>
                  <div>
                    <span className="font-medium">Escrow ID:</span> {deal.escrow_id || 'Not funded'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="mx-auto h-16 w-16 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Messages Coming Soon</h3>
                <p>Direct messaging between brands and creators will be available soon.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Milestone</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Action</Label>
              <div className="flex space-x-2">
                {[
                  { value: 'approve', label: 'Approve', variant: 'default' },
                  { value: 'request_revision', label: 'Request Revision', variant: 'secondary' },
                  { value: 'reject', label: 'Reject', variant: 'destructive' }
                ].map(action => (
                  <Button
                    key={action.value}
                    variant={reviewData.action === action.value ? action.variant as any : 'outline'}
                    size="sm"
                    onClick={() => setReviewData({ ...reviewData, action: action.value as any })}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback {reviewData.action !== 'approve' ? '*' : '(Optional)'}</Label>
              <Textarea
                id="feedback"
                value={reviewData.feedback}
                onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                placeholder={
                  reviewData.action === 'approve' 
                    ? "Great work! (optional)" 
                    : "Please explain what needs to be changed..."
                }
                rows={4}
                disabled={reviewLoading}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsReviewModalOpen(false)}
                disabled={reviewLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleMilestoneReview}
                disabled={reviewLoading || (reviewData.action !== 'approve' && !reviewData.feedback.trim())}
              >
                {reviewLoading ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
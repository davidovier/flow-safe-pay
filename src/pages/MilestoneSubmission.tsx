import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MilestoneSubmissionForm } from '@/components/milestones/MilestoneSubmissionForm';
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
  FileText,
  MessageSquare,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
  due_at?: string;
  submitted_at?: string;
  approved_at?: string;
  released_at?: string;
  created_at: string;
  deal: {
    id: string;
    state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
    projects: {
      title: string;
      users: {
        first_name: string | null;
        last_name: string | null;
        email: string;
      };
    };
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    } | null;
  };
  deliverables: Array<{
    id: string;
    url: string | null;
    file_hash: string | null;
    submitted_at: string | null;
    checks: any;
    created_at: string;
    updated_at: string;
  }>;
}

export default function MilestoneSubmission() {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMilestoneDetails();
    }
  }, [id]);

  const fetchMilestoneDetails = async () => {
    if (!id || !userProfile) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('milestones')
        .select(`
          *,
          deal:deals!inner (
            id, state,
            projects!inner (
              title,
              users!brand_id (
                first_name, last_name, email
              )
            ),
            users (
              first_name, last_name, email
            )
          ),
          deliverables (
            id, url, file_hash, submitted_at, checks, created_at, updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching milestone:', error);
        toast({
          title: "Milestone Not Found",
          description: "The requested milestone could not be found.",
          variant: "destructive"
        });
        navigate('/deals');
        return;
      }

      // Check if user has access to this milestone
      const deal = data.deal;
      const hasAccess = 
        userProfile.role === 'ADMIN' ||
        (userProfile.role === 'BRAND' && deal.projects.users.id === userProfile.id) ||
        (userProfile.role === 'CREATOR' && deal.users?.id === userProfile.id);

      if (!hasAccess) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view this milestone.",
          variant: "destructive"
        });
        navigate('/deals');
        return;
      }

      setMilestone(data);
    } catch (error: any) {
      console.error('Error fetching milestone details:', error);
      toast({
        title: "Error",
        description: "Failed to load milestone details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'RELEASED': return 'bg-emerald-100 text-emerald-800';
      case 'DISPUTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'PENDING': return <Clock className="h-4 w-4" />;
      case 'SUBMITTED': return <Upload className="h-4 w-4" />;
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'RELEASED': return <CheckCircle className="h-4 w-4" />;
      case 'DISPUTED': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBrandName = () => {
    if (!milestone) return '';
    const brand = milestone.deal.projects.users;
    return `${brand.first_name || ''} ${brand.last_name || ''}`.trim() || brand.email;
  };

  const getCreatorName = () => {
    if (!milestone?.deal.users) return 'Creator';
    const creator = milestone.deal.users;
    return `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.email;
  };

  const canSubmit = () => {
    if (!milestone || !userProfile) return false;
    return userProfile.role === 'CREATOR' && 
           milestone.deal.users?.id === userProfile.id &&
           milestone.state === 'PENDING' &&
           milestone.deal.state === 'FUNDED';
  };

  const canReview = () => {
    if (!milestone || !userProfile) return false;
    return userProfile.role === 'BRAND' && 
           milestone.deal.projects.users.id === userProfile.id &&
           milestone.state === 'SUBMITTED';
  };

  const canDispute = () => {
    if (!milestone || !userProfile) return false;
    return milestone.state !== 'RELEASED' && milestone.state !== 'DISPUTED';
  };

  const isDueToday = () => {
    if (!milestone?.due_at) return false;
    const dueDate = new Date(milestone.due_at);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  };

  const isOverdue = () => {
    if (!milestone?.due_at) return false;
    return new Date(milestone.due_at) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Milestone not found.</p>
      </div>
    );
  }

  // Show submission form
  if (showSubmissionForm) {
    return (
      <div className="container mx-auto py-8">
        <MilestoneSubmissionForm
          milestone={milestone}
          onSuccess={() => {
            setShowSubmissionForm(false);
            fetchMilestoneDetails();
          }}
          onCancel={() => setShowSubmissionForm(false)}
        />
      </div>
    );
  }

  // Show dispute form
  if (showDisputeForm) {
    return (
      <div className="container mx-auto py-8">
        <DisputeForm
          dealId={milestone.deal.id}
          milestoneId={milestone.id}
          onSuccess={() => {
            setShowDisputeForm(false);
            fetchMilestoneDetails();
          }}
          onCancel={() => setShowDisputeForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/deals/${milestone.deal.id}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deal
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{milestone.title}</h1>
            <p className="text-muted-foreground">{milestone.deal.projects.title}</p>
          </div>
        </div>
        <Badge className={getStateColor(milestone.state)}>
          {getStateIcon(milestone.state)}
          <span className="ml-1">{milestone.state}</span>
        </Badge>
      </div>

      {/* Due Date Alert */}
      {milestone.due_at && (isDueToday() || isOverdue()) && (
        <Alert className={isOverdue() ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
          <AlertTriangle className={`h-4 w-4 ${isOverdue() ? "text-red-600" : "text-yellow-600"}`} />
          <AlertDescription className={isOverdue() ? "text-red-800" : "text-yellow-800"}>
            <strong>{isOverdue() ? "Overdue:" : "Due Today:"}</strong> This milestone was due on {formatDate(milestone.due_at)}
          </AlertDescription>
        </Alert>
      )}

      {/* Milestone Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(milestone.amount, milestone.currency)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {milestone.due_at ? formatDate(milestone.due_at) : 'No deadline'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brand</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{getBrandName()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creator</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{getCreatorName()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {milestone.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{milestone.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {canSubmit() && (
          <Button onClick={() => setShowSubmissionForm(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Submit Deliverable
          </Button>
        )}
        
        {canDispute() && (
          <Button variant="outline" onClick={() => setShowDisputeForm(true)}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Open Dispute
          </Button>
        )}
      </div>

      {/* Deliverables */}
      {milestone.deliverables.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Deliverables</h2>
          {milestone.deliverables.map((deliverable) => (
            <DeliverableViewer
              key={deliverable.id}
              deliverable={{
                ...deliverable,
                milestone: {
                  ...milestone,
                  deal: milestone.deal,
                },
              }}
              onUpdate={fetchMilestoneDetails}
              showReviewActions={canReview()}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {milestone.deliverables.length === 0 && milestone.state === 'PENDING' && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliverables yet</h3>
            <p className="text-gray-600 mb-4">
              {userProfile?.role === 'CREATOR' 
                ? 'Submit your deliverable to complete this milestone'
                : 'Waiting for the creator to submit deliverables'
              }
            </p>
            {canSubmit() && (
              <Button onClick={() => setShowSubmissionForm(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Submit Deliverable
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
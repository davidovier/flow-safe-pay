import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MilestoneSubmissionForm } from '@/components/milestones/MilestoneSubmissionForm';
import { 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
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
}

export default function SubmitMilestone() {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchMilestone();
    } else {
      setError('No milestone ID provided');
      setLoading(false);
    }
  }, [id]);

  const fetchMilestone = async () => {
    if (!id || !userProfile) return;
    
    try {
      setLoading(true);
      setError(null);

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
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching milestone:', error);
        if (error.code === 'PGRST116') {
          setError('Milestone not found');
        } else {
          setError('Failed to load milestone details');
        }
        return;
      }

      // Check if user has access to this milestone
      const deal = data.deal;
      const hasAccess = 
        userProfile.role === 'ADMIN' ||
        (userProfile.role === 'CREATOR' && deal.users?.id === userProfile.id);

      if (!hasAccess) {
        setError('You do not have permission to submit to this milestone');
        return;
      }

      // Check if milestone can be submitted to
      if (data.state !== 'PENDING') {
        setError(`This milestone is ${data.state.toLowerCase()} and cannot be submitted to`);
        return;
      }

      if (deal.state !== 'FUNDED') {
        setError('This deal must be funded before you can submit deliverables');
        return;
      }

      setMilestone(data);
    } catch (error: any) {
      console.error('Error fetching milestone:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionSuccess = () => {
    toast({
      title: 'Milestone Submitted! 🎉',
      description: 'Your deliverable has been submitted for review. You\'ll be notified once it\'s reviewed.',
    });
    
    navigate(`/deals/${milestone?.deal.id}`, { replace: true });
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const getBrandName = () => {
    if (!milestone) return '';
    const brand = milestone.deal.projects.users;
    return `${brand.first_name || ''} ${brand.last_name || ''}`.trim() || brand.email;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading milestone details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !milestone) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Unable to Load Milestone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error || 'The milestone could not be found or loaded.'}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button onClick={fetchMilestone}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Access check - only creators should see this page
  if (userProfile?.role !== 'CREATOR') {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Only creators can submit deliverables to milestones.
                </AlertDescription>
              </Alert>
              
              <Button variant="outline" onClick={() => navigate('/deals')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Deals
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(`/deals/${milestone.deal.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deal
          </Button>
          <h1 className="text-3xl font-bold">{milestone.deal.projects.title}</h1>
          <p className="text-muted-foreground">Submitting deliverable for: {milestone.title}</p>
        </div>
      </div>

      {/* Due Date Alert */}
      {milestone.due_at && (isDueToday() || isOverdue()) && (
        <Alert className={isOverdue() ? "border-destructive bg-destructive/10" : "border-orange-200 bg-orange-50"}>
          <AlertTriangle className={`h-4 w-4 ${isOverdue() ? "text-destructive" : "text-orange-600"}`} />
          <AlertDescription className={isOverdue() ? "text-destructive" : "text-orange-800"}>
            <strong>{isOverdue() ? "Overdue:" : "Due Today:"}</strong> This milestone was due on {formatDate(milestone.due_at)}
          </AlertDescription>
        </Alert>
      )}

      {/* Milestone Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Milestone Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Title</h4>
                <p className="font-medium">{milestone.title}</p>
              </div>
              
              {milestone.description && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Description</h4>
                  <p className="text-muted-foreground">{milestone.description}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Brand</h4>
                <p className="font-medium">{getBrandName()}</p>
                <p className="text-sm text-muted-foreground">{milestone.deal.projects.users.email}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Amount</h4>
                <p className="text-2xl font-bold text-green-600">
                  {formatAmount(milestone.amount, milestone.currency)}
                </p>
              </div>
              
              {milestone.due_at && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Due Date</h4>
                  <p className="font-medium">{formatDate(milestone.due_at)}</p>
                </div>
              )}
              
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Status</h4>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="font-medium">Ready for submission</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submission Form */}
      <MilestoneSubmissionForm
        milestone={milestone}
        onSuccess={handleSubmissionSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
}
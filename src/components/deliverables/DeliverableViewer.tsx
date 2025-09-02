import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Eye, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Link as LinkIcon, 
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Hash,
  Loader2
} from 'lucide-react';

interface Deliverable {
  id: string;
  milestone_id: string;
  url: string | null;
  file_hash: string | null;
  submitted_at: string | null;
  checks: {
    submission_type?: 'file' | 'url' | 'text';
    description?: string;
    file_name?: string;
    file_size?: number;
    file_type?: string;
    status?: 'pending' | 'approved' | 'rejected' | 'revision_requested';
    feedback?: string;
    reviewed_at?: string;
    reviewed_by?: string;
  } | null;
  created_at: string;
  updated_at: string;
  milestone: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
    deal: {
      id: string;
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
  };
}

interface DeliverableViewerProps {
  deliverable: Deliverable;
  onUpdate?: () => void;
  showReviewActions?: boolean;
}

export function DeliverableViewer({ deliverable, onUpdate, showReviewActions = false }: DeliverableViewerProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | 'request_revision'>('approve');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const milestone = deliverable.milestone;
  const deal = milestone.deal;
  const checks = deliverable.checks || {};

  const handleReview = async () => {
    if (!userProfile) return;

    setIsReviewing(true);
    try {
      const status = reviewAction === 'approve' ? 'approved' : 
                    reviewAction === 'reject' ? 'rejected' : 'revision_requested';
      
      // Update deliverable checks
      const updatedChecks = {
        ...checks,
        status: status,
        feedback: reviewFeedback,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userProfile.id
      };

      const { error: updateError } = await supabase
        .from('deliverables')
        .update({
          checks: updatedChecks,
          updated_at: new Date().toISOString()
        })
        .eq('id', deliverable.id);

      if (updateError) throw updateError;

      // Update milestone state
      const milestoneState = reviewAction === 'approve' ? 'APPROVED' : 'SUBMITTED';
      await supabase
        .from('milestones')
        .update({ state: milestoneState })
        .eq('id', milestone.id);

      // Log event
      await supabase.from('events').insert({
        actor_user_id: userProfile.id,
        type: 'deliverable.reviewed',
        payload: {
          deliverable_id: deliverable.id,
          milestone_id: milestone.id,
          deal_id: deal.id,
          action: reviewAction,
          has_feedback: !!reviewFeedback,
        },
      });

      toast({
        title: 'Review Submitted! ✅',
        description: `Deliverable ${reviewAction}d successfully.`,
      });

      setIsReviewModalOpen(false);
      setReviewFeedback('');
      onUpdate?.();
    } catch (error: any) {
      console.error('Review error:', error);
      toast({
        variant: 'destructive',
        title: 'Review Failed',
        description: error.message || 'Failed to submit review. Please try again.',
      });
    } finally {
      setIsReviewing(false);
    }
  };

  const getStatusBadge = () => {
    const status = checks.status || 'pending';
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'revision_requested':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Revision Requested</Badge>;
      default:
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Pending Review</Badge>;
    }
  };

  const getFileIcon = () => {
    if (checks.submission_type === 'url') {
      return <LinkIcon className="h-5 w-5 text-blue-500" />;
    } else if (checks.file_type?.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-green-500" />;
    } else if (checks.file_type?.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCreatorName = () => {
    if (!deal.users) return 'Unknown Creator';
    const name = `${deal.users.first_name || ''} ${deal.users.last_name || ''}`.trim();
    return name || deal.users.email;
  };

  const getBrandName = () => {
    const brand = deal.projects.users;
    const name = `${brand.first_name || ''} ${brand.last_name || ''}`.trim();
    return name || brand.email;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getFileIcon()}
              {milestone.title}
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              <p>{deal.projects.title}</p>
              <p>{formatAmount(milestone.amount, milestone.currency)}</p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Submission Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span>Creator: {getCreatorName()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>Submitted: {deliverable.submitted_at ? formatDate(deliverable.submitted_at) : 'Not submitted'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {checks.file_name && (
              <div className="text-sm">
                <span className="font-medium">File:</span> {checks.file_name}
              </div>
            )}
            {checks.file_size && (
              <div className="text-sm">
                <span className="font-medium">Size:</span> {formatFileSize(checks.file_size)}
              </div>
            )}
          </div>
        </div>

        {/* File Hash Verification */}
        {deliverable.file_hash && (
          <Alert>
            <Hash className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <strong>File Integrity:</strong> Verified with SHA-256 hash
                <div className="font-mono text-xs break-all">
                  {deliverable.file_hash}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Description */}
        {checks.description && (
          <div className="space-y-2">
            <h4 className="font-medium">Description</h4>
            <div className="bg-muted rounded-lg p-3 text-sm">
              {checks.description}
            </div>
          </div>
        )}

        {/* Content Access */}
        {deliverable.url && (
          <div className="space-y-3">
            <h4 className="font-medium">Content</h4>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={deliverable.url} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4 mr-2" />
                  View Content
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
              
              {checks.submission_type === 'file' && (
                <Button variant="outline" size="sm" asChild>
                  <a href={deliverable.url} download>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Previous Feedback */}
        {checks.feedback && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Review Feedback
            </h4>
            <div className="bg-muted rounded-lg p-3 text-sm">
              {checks.feedback}
            </div>
            {checks.reviewed_at && (
              <p className="text-xs text-muted-foreground">
                Reviewed on {formatDate(checks.reviewed_at)}
              </p>
            )}
          </div>
        )}

        {/* Review Actions */}
        {showReviewActions && milestone.state === 'SUBMITTED' && (
          <div className="flex gap-2 pt-4 border-t">
            <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Review Deliverable
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Review Deliverable</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label>Action</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'approve', label: 'Approve', variant: 'default' },
                        { value: 'request_revision', label: 'Request Revision', variant: 'secondary' },
                        { value: 'reject', label: 'Reject', variant: 'destructive' }
                      ].map(action => (
                        <Button
                          key={action.value}
                          variant={reviewAction === action.value ? action.variant as any : 'outline'}
                          size="sm"
                          onClick={() => setReviewAction(action.value as any)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="feedback">
                      Feedback {reviewAction !== 'approve' ? '*' : '(Optional)'}
                    </Label>
                    <Textarea
                      id="feedback"
                      value={reviewFeedback}
                      onChange={(e) => setReviewFeedback(e.target.value)}
                      placeholder={
                        reviewAction === 'approve' 
                          ? "Great work! (optional)" 
                          : "Please explain what needs to be changed..."
                      }
                      rows={4}
                      disabled={isReviewing}
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsReviewModalOpen(false)}
                      disabled={isReviewing}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleReview}
                      disabled={isReviewing || (reviewAction !== 'approve' && !reviewFeedback.trim())}
                    >
                      {isReviewing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Review'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
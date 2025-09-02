import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DeliverableViewer } from './DeliverableViewer';
import {
  Search,
  Filter,
  FileText,
  Image,
  Video,
  ExternalLink,
  Calendar,
  User,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Loader2
} from 'lucide-react';

interface DeliverableRecord {
  id: string;
  milestone_id: string;
  url?: string;
  file_hash?: string;
  submitted_at?: string;
  checks?: any;
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
  };
}

interface DeliverablesListProps {
  showOnlyPending?: boolean;
  dealId?: string;
  creatorId?: string;
  brandId?: string;
}

export function DeliverablesList({ 
  showOnlyPending = false, 
  dealId, 
  creatorId, 
  brandId 
}: DeliverablesListProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [deliverables, setDeliverables] = useState<DeliverableRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDeliverable, setSelectedDeliverable] = useState<string | null>(null);

  useEffect(() => {
    fetchDeliverables();
  }, [dealId, creatorId, brandId, showOnlyPending]);

  const fetchDeliverables = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('deliverables')
        .select(`
          id,
          milestone_id,
          url,
          file_hash,
          submitted_at,
          checks,
          created_at,
          updated_at,
          milestone:milestones!inner (
            id,
            title,
            amount,
            currency,
            state,
            deal:deals!inner (
              id,
              state,
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
          )
        `);

      // Apply filters
      if (dealId) {
        query = query.eq('milestone.deal.id', dealId);
      }
      
      if (creatorId) {
        query = query.eq('milestone.deal.users.id', creatorId);
      }
      
      if (brandId) {
        query = query.eq('milestone.deal.projects.users.id', brandId);
      }
      
      if (showOnlyPending) {
        query = query.eq('milestone.state', 'SUBMITTED');
      }

      // Apply role-based filtering
      if (userProfile?.role === 'CREATOR') {
        query = query.eq('milestone.deal.users.id', userProfile.id);
      } else if (userProfile?.role === 'BRAND') {
        query = query.eq('milestone.deal.projects.users.id', userProfile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deliverables:', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load deliverables',
          description: 'Could not retrieve deliverable information.',
        });
        return;
      }

      setDeliverables(data as DeliverableRecord[]);
    } catch (error: any) {
      console.error('Error fetching deliverables:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load deliverables.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (deliverable: DeliverableRecord) => {
    const status = deliverable.checks?.status;
    const milestoneState = deliverable.milestone.state;
    
    if (status === 'approved' || milestoneState === 'APPROVED' || milestoneState === 'RELEASED') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    } else if (status === 'rejected') {
      return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>;
    } else if (status === 'revision_requested') {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Revision Required</Badge>;
    } else if (milestoneState === 'SUBMITTED') {
      return <Badge variant="default"><Clock className="h-3 w-3 mr-1" />Under Review</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const getSubmissionTypeIcon = (checks?: any) => {
    const submissionType = checks?.submission_type;
    const fileType = checks?.file_type;
    
    if (submissionType === 'url') {
      return <ExternalLink className="h-5 w-5 text-blue-500" />;
    } else if (fileType?.startsWith('image/')) {
      return <Image className="h-5 w-5 text-green-500" />;
    } else if (fileType?.startsWith('video/')) {
      return <Video className="h-5 w-5 text-purple-500" />;
    } else {
      return <FileText className="h-5 w-5 text-gray-500" />;
    }
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

  const getCreatorName = (deliverable: DeliverableRecord) => {
    const creator = deliverable.milestone.deal.users;
    if (!creator) return 'Unknown Creator';
    const name = `${creator.first_name || ''} ${creator.last_name || ''}`.trim();
    return name || creator.email;
  };

  const getBrandName = (deliverable: DeliverableRecord) => {
    const brand = deliverable.milestone.deal.projects.users;
    const name = `${brand.first_name || ''} ${brand.last_name || ''}`.trim();
    return name || brand.email;
  };

  const canReview = (deliverable: DeliverableRecord) => {
    return userProfile?.role === 'BRAND' && 
           deliverable.milestone.state === 'SUBMITTED' &&
           deliverable.milestone.deal.projects.users.email === userProfile.email;
  };

  const filteredDeliverables = deliverables.filter(deliverable => {
    const matchesSearch = !searchTerm || 
      deliverable.milestone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deliverable.milestone.deal.projects.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getCreatorName(deliverable).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBrandName(deliverable).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'pending' && deliverable.milestone.state === 'PENDING') ||
      (selectedStatus === 'submitted' && deliverable.milestone.state === 'SUBMITTED') ||
      (selectedStatus === 'approved' && (deliverable.milestone.state === 'APPROVED' || deliverable.milestone.state === 'RELEASED')) ||
      (selectedStatus === 'rejected' && deliverable.checks?.status === 'rejected') ||
      (selectedStatus === 'revision_requested' && deliverable.checks?.status === 'revision_requested');
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    return {
      all: deliverables.length,
      pending: deliverables.filter(d => d.milestone.state === 'PENDING').length,
      submitted: deliverables.filter(d => d.milestone.state === 'SUBMITTED').length,
      approved: deliverables.filter(d => d.milestone.state === 'APPROVED' || d.milestone.state === 'RELEASED').length,
      rejected: deliverables.filter(d => d.checks?.status === 'rejected').length,
      revision_requested: deliverables.filter(d => d.checks?.status === 'revision_requested').length,
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading deliverables...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Deliverables {!showOnlyPending && `(${deliverables.length})`}
          </CardTitle>
          {showOnlyPending && (
            <p className="text-muted-foreground">
              Deliverables pending your review
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search deliverables, milestones, or projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            {!showOnlyPending && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Status ({statusCounts.all})</option>
                <option value="pending">Pending ({statusCounts.pending})</option>
                <option value="submitted">Under Review ({statusCounts.submitted})</option>
                <option value="approved">Approved ({statusCounts.approved})</option>
                <option value="rejected">Rejected ({statusCounts.rejected})</option>
                <option value="revision_requested">Needs Revision ({statusCounts.revision_requested})</option>
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Deliverables List */}
      <div className="space-y-4">
        {filteredDeliverables.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {deliverables.length === 0 
                  ? 'No deliverables submitted yet' 
                  : 'No deliverables match your filters'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredDeliverables.map((deliverable) => (
            <Card key={deliverable.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getSubmissionTypeIcon(deliverable.checks)}
                      {deliverable.milestone.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {deliverable.milestone.deal.projects.title}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {getCreatorName(deliverable)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {deliverable.submitted_at ? formatDate(deliverable.submitted_at) : 'Not submitted'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(deliverable)}
                    <Badge variant="outline">
                      {formatAmount(deliverable.milestone.amount, deliverable.milestone.currency)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    {deliverable.checks?.description && (
                      <p className="text-sm text-muted-foreground">
                        {deliverable.checks.description.length > 100 
                          ? `${deliverable.checks.description.substring(0, 100)}...` 
                          : deliverable.checks.description
                        }
                      </p>
                    )}
                    
                    {deliverable.checks?.feedback && (
                      <div className="flex items-start gap-2 mt-2 p-2 bg-muted rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-amber-800">Review Feedback:</p>
                          <p className="text-xs text-amber-700">{deliverable.checks.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDeliverable(
                        selectedDeliverable === deliverable.id ? null : deliverable.id
                      )}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {selectedDeliverable === deliverable.id ? 'Hide' : 'View'}
                    </Button>
                  </div>
                </div>

                {/* Expanded Deliverable View */}
                {selectedDeliverable === deliverable.id && (
                  <div className="mt-4 pt-4 border-t">
                    <DeliverableViewer 
                      deliverable={deliverable as any}
                      showReviewActions={canReview(deliverable)}
                      onUpdate={fetchDeliverables}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
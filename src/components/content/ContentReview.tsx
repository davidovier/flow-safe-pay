import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { 
  Clock, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Calendar,
  FileText,
  Image,
  Video,
  ExternalLink,
  Download,
  Flag,
  Filter,
  Search,
  Eye,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  User,
  Tag,
  DollarSign
} from 'lucide-react';

interface Deliverable {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video' | 'text' | 'link';
  url: string;
  thumbnail?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  submittedAt: string;
  reviewedAt?: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatar?: string;
  };
  campaign: {
    id: string;
    name: string;
  };
  milestone: {
    id: string;
    title: string;
    amount: number;
  };
  feedback?: {
    message: string;
    rating?: number;
    requestedChanges?: string[];
  };
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    engagementRate?: number;
  };
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

interface ReviewAction {
  type: 'approve' | 'reject' | 'request_revision';
  message: string;
  rating?: number;
  requestedChanges?: string[];
}

export function ContentReview() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [filteredDeliverables, setFilteredDeliverables] = useState<Deliverable[]>([]);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    campaign: 'all',
    priority: 'all',
    search: '',
  });
  const [reviewAction, setReviewAction] = useState<ReviewAction>({
    type: 'approve',
    message: '',
    rating: 5,
    requestedChanges: [],
  });

  const { toast } = useToast();

  useEffect(() => {
    loadDeliverables();
  }, []);

  useEffect(() => {
    filterDeliverables();
  }, [deliverables, filters]);

  const loadDeliverables = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockDeliverables: Deliverable[] = [
        {
          id: '1',
          title: 'Instagram Post - Summer Collection',
          description: 'Lifestyle post featuring the new summer dress collection with natural lighting and outdoor setting.',
          type: 'image',
          url: '/deliverables/summer-post-1.jpg',
          status: 'pending',
          submittedAt: '2024-01-15T10:30:00Z',
          creator: {
            id: '1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            username: '@sarahjohnson',
            avatar: '/avatars/sarah.jpg',
          },
          campaign: {
            id: '1',
            name: 'Summer Fashion Collection',
          },
          milestone: {
            id: '1',
            title: 'Instagram Post Creation',
            amount: 750,
          },
          tags: ['Instagram', 'Fashion', 'Summer', 'Lifestyle'],
          priority: 'high',
        },
        {
          id: '2',
          title: 'YouTube Review - Smart Watch',
          description: 'Comprehensive 10-minute review of the new smart watch features, including unboxing and hands-on demonstration.',
          type: 'video',
          url: '/deliverables/smartwatch-review.mp4',
          thumbnail: '/deliverables/smartwatch-review-thumb.jpg',
          status: 'pending',
          submittedAt: '2024-01-15T08:45:00Z',
          creator: {
            id: '2',
            firstName: 'Mike',
            lastName: 'Chen',
            username: '@miketechtalk',
            avatar: '/avatars/mike.jpg',
          },
          campaign: {
            id: '2',
            name: 'Tech Product Launch',
          },
          milestone: {
            id: '2',
            title: 'Product Review Video',
            amount: 1500,
          },
          metrics: {
            views: 0, // Not yet published
            likes: 0,
            comments: 0,
          },
          tags: ['YouTube', 'Tech', 'Review', 'Product Launch'],
          priority: 'high',
        },
        {
          id: '3',
          title: 'Wellness Blog Post',
          description: 'Article about maintaining work-life balance and mental health tips for busy professionals.',
          type: 'text',
          url: '/deliverables/wellness-article.pdf',
          status: 'revision_requested',
          submittedAt: '2024-01-14T16:20:00Z',
          reviewedAt: '2024-01-15T09:30:00Z',
          creator: {
            id: '3',
            firstName: 'Emma',
            lastName: 'Wilson',
            username: '@emmawellness',
            avatar: '/avatars/emma.jpg',
          },
          campaign: {
            id: '3',
            name: 'Wellness Campaign',
          },
          milestone: {
            id: '3',
            title: 'Blog Article',
            amount: 400,
          },
          feedback: {
            message: 'Great content overall! Please add more specific examples and include the brand mention in the conclusion.',
            rating: 4,
            requestedChanges: [
              'Add 2-3 specific examples of work-life balance techniques',
              'Include brand mention in conclusion paragraph',
              'Add call-to-action for readers',
            ],
          },
          tags: ['Blog', 'Wellness', 'Mental Health'],
          priority: 'medium',
        },
        {
          id: '4',
          title: 'TikTok Recipe Video',
          description: '60-second recipe video showcasing quick and healthy meal prep using sponsored kitchen products.',
          type: 'video',
          url: '/deliverables/recipe-tiktok.mp4',
          thumbnail: '/deliverables/recipe-tiktok-thumb.jpg',
          status: 'approved',
          submittedAt: '2024-01-13T14:15:00Z',
          reviewedAt: '2024-01-14T10:00:00Z',
          creator: {
            id: '4',
            firstName: 'Alex',
            lastName: 'Rivera',
            username: '@alexfoodie',
            avatar: '/avatars/alex.jpg',
          },
          campaign: {
            id: '4',
            name: 'Kitchen Products Campaign',
          },
          milestone: {
            id: '4',
            title: 'TikTok Content',
            amount: 600,
          },
          feedback: {
            message: 'Perfect execution! The video is engaging, on-brand, and showcases the products beautifully.',
            rating: 5,
          },
          metrics: {
            views: 15000,
            likes: 1200,
            comments: 89,
            shares: 340,
            engagementRate: 10.8,
          },
          tags: ['TikTok', 'Recipe', 'Food', 'Kitchen'],
          priority: 'low',
        },
      ];

      setDeliverables(mockDeliverables);
    } catch (error) {
      console.error('Error loading deliverables:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deliverables',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterDeliverables = () => {
    let filtered = [...deliverables];

    if (filters.status !== 'all') {
      filtered = filtered.filter(d => d.status === filters.status);
    }

    if (filters.campaign !== 'all') {
      filtered = filtered.filter(d => d.campaign.id === filters.campaign);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter(d => d.priority === filters.priority);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(searchLower) ||
        d.description.toLowerCase().includes(searchLower) ||
        d.creator.firstName.toLowerCase().includes(searchLower) ||
        d.creator.lastName.toLowerCase().includes(searchLower) ||
        d.campaign.name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by submission date (newest first)
    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    setFilteredDeliverables(filtered);
  };

  const handleReview = async (deliverableId: string, action: ReviewAction) => {
    try {
      // Mock API call - replace with actual implementation
      const updatedDeliverable = {
        ...deliverables.find(d => d.id === deliverableId)!,
        status: action.type === 'approve' ? 'approved' as const : 
               action.type === 'reject' ? 'rejected' as const : 
               'revision_requested' as const,
        reviewedAt: new Date().toISOString(),
        feedback: {
          message: action.message,
          rating: action.rating,
          requestedChanges: action.requestedChanges,
        },
      };

      setDeliverables(deliverables.map(d => 
        d.id === deliverableId ? updatedDeliverable : d
      ));

      setReviewDialogOpen(false);
      setSelectedDeliverable(null);
      setReviewAction({
        type: 'approve',
        message: '',
        rating: 5,
        requestedChanges: [],
      });

      toast({
        title: 'Review submitted',
        description: `Deliverable ${action.type === 'approve' ? 'approved' : 
                     action.type === 'reject' ? 'rejected' : 'sent back for revision'}`,
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit review',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'revision_requested': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'revision_requested': return <MessageSquare className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'text': return <FileText className="h-4 w-4" />;
      case 'link': return <ExternalLink className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content Review</h1>
        <p className="text-muted-foreground">
          Review and approve deliverables from your creators.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search deliverables..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm"
          />
        </div>
        
        <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="revision_requested">Needs Revision</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Pending Review</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {deliverables.filter(d => d.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {deliverables.filter(d => d.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Need Revision</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {deliverables.filter(d => d.status === 'revision_requested').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">High Priority</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {deliverables.filter(d => d.priority === 'high' && d.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deliverables List */}
      <div className="space-y-4">
        {filteredDeliverables.map((deliverable) => (
          <Card key={deliverable.id}>
            <CardContent className="p-6">
              <div className="flex gap-6">
                {/* Preview */}
                <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center shrink-0">
                  {deliverable.type === 'image' ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : deliverable.type === 'video' ? (
                    <div className="w-full h-full bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center">
                      <Video className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-100 to-teal-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{deliverable.title}</h3>
                        <Badge className={getStatusColor(deliverable.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(deliverable.status)}
                            {deliverable.status.replace('_', ' ')}
                          </span>
                        </Badge>
                        <Badge className={getPriorityColor(deliverable.priority)}>
                          {deliverable.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-1">{deliverable.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(deliverable.milestone.amount)}</div>
                      <div className="text-sm text-muted-foreground">{deliverable.milestone.title}</div>
                    </div>
                  </div>

                  {/* Creator and Campaign Info */}
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={deliverable.creator.avatar} />
                        <AvatarFallback className="text-xs">
                          {deliverable.creator.firstName[0]}{deliverable.creator.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span>{deliverable.creator.firstName} {deliverable.creator.lastName}</span>
                      <span className="text-muted-foreground">{deliverable.creator.username}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span>{deliverable.campaign.name}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Submitted {formatDate(deliverable.submittedAt)}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {deliverable.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Feedback (if exists) */}
                  {deliverable.feedback && (
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="font-medium text-sm">Previous Feedback</span>
                        {deliverable.feedback.rating && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={`text-xs ${
                                  star <= deliverable.feedback!.rating! ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm">{deliverable.feedback.message}</p>
                      {deliverable.feedback.requestedChanges && deliverable.feedback.requestedChanges.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium mb-1">Requested Changes:</div>
                          <ul className="text-sm space-y-1">
                            {deliverable.feedback.requestedChanges.map((change, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                <span>{change}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metrics (if available) */}
                  {deliverable.metrics && (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{deliverable.metrics.views?.toLocaleString() || 0}</div>
                        <div className="text-muted-foreground">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{deliverable.metrics.likes?.toLocaleString() || 0}</div>
                        <div className="text-muted-foreground">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{deliverable.metrics.comments?.toLocaleString() || 0}</div>
                        <div className="text-muted-foreground">Comments</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{deliverable.metrics.engagementRate?.toFixed(1) || 0}%</div>
                        <div className="text-muted-foreground">Engagement</div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-2" />
                      View Full
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    {deliverable.status === 'pending' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedDeliverable(deliverable);
                            setReviewAction({ ...reviewAction, type: 'approve' });
                            setReviewDialogOpen(true);
                          }}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedDeliverable(deliverable);
                            setReviewAction({ ...reviewAction, type: 'request_revision' });
                            setReviewDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Request Changes
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            setSelectedDeliverable(deliverable);
                            setReviewAction({ ...reviewAction, type: 'reject' });
                            setReviewDialogOpen(true);
                          }}
                        >
                          <ThumbsDown className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDeliverables.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No deliverables found</h3>
            <p className="text-muted-foreground">
              {filters.search || filters.status !== 'all' || filters.priority !== 'all'
                ? 'Try adjusting your filters to see more deliverables.'
                : "You're all caught up! No pending reviews at the moment."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {reviewAction.type === 'approve' ? 'Approve Deliverable' :
               reviewAction.type === 'reject' ? 'Reject Deliverable' :
               'Request Revision'}
            </DialogTitle>
            <DialogDescription>
              {selectedDeliverable && (
                <span>
                  Reviewing "{selectedDeliverable.title}" by {selectedDeliverable.creator.firstName} {selectedDeliverable.creator.lastName}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {reviewAction.type === 'approve' && (
              <div>
                <label className="text-sm font-medium">Rating (optional)</label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewAction({ ...reviewAction, rating: star })}
                      className={`text-2xl ${
                        star <= (reviewAction.rating || 5) ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium">
                {reviewAction.type === 'approve' ? 'Feedback (optional)' : 
                 reviewAction.type === 'reject' ? 'Reason for rejection' :
                 'Revision notes'}
              </label>
              <Textarea
                value={reviewAction.message}
                onChange={(e) => setReviewAction({ ...reviewAction, message: e.target.value })}
                placeholder={
                  reviewAction.type === 'approve' ? 'Great work! The content looks perfect...' :
                  reviewAction.type === 'reject' ? 'Please explain why this deliverable is being rejected...' :
                  'Please describe the changes needed...'
                }
                rows={4}
                className="mt-2"
              />
            </div>

            {reviewAction.type === 'request_revision' && (
              <div>
                <label className="text-sm font-medium">Specific Changes Needed</label>
                <Textarea
                  placeholder="• Add brand logo in the bottom right corner&#10;• Increase brightness by 10%&#10;• Change caption to include our hashtag"
                  rows={3}
                  className="mt-2"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedDeliverable && handleReview(selectedDeliverable.id, reviewAction)}
              variant={reviewAction.type === 'reject' ? 'destructive' : 'default'}
            >
              {reviewAction.type === 'approve' ? 'Approve & Release Payment' :
               reviewAction.type === 'reject' ? 'Reject Deliverable' :
               'Request Revision'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
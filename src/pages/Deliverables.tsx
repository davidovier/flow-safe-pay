import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Deliverable {
  id: string;
  dealId: string;
  dealTitle: string;
  brandName: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submittedDate?: string;
  feedback?: string;
  fileUrl?: string;
}

export default function Deliverables() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Mock data - in real app this would come from API
  const [deliverables, setDeliverables] = useState<Deliverable[]>([
    {
      id: '1',
      dealId: 'deal-1',
      dealTitle: 'Summer Campaign Video',
      brandName: 'TechFlow',
      title: 'Instagram Reel - Product Demo',
      description: 'Create a 30-second Instagram reel showcasing the product features',
      dueDate: '2025-09-15',
      status: 'pending'
    },
    {
      id: '2',
      dealId: 'deal-2',
      dealTitle: 'Brand Partnership',
      brandName: 'StyleCo',
      title: 'YouTube Video - Unboxing',
      description: 'Film an unboxing and first impressions video for the new collection',
      dueDate: '2025-09-10',
      status: 'submitted',
      submittedDate: '2025-09-08',
      fileUrl: 'https://example.com/video.mp4'
    },
    {
      id: '3',
      dealId: 'deal-3',
      dealTitle: 'Product Review',
      brandName: 'GearHub',
      title: 'Written Review + Photos',
      description: 'Detailed product review with high-quality photos',
      dueDate: '2025-08-25',
      status: 'approved',
      submittedDate: '2025-08-23',
      fileUrl: 'https://example.com/review.pdf'
    }
  ]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'submitted': return <Upload className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'submitted': return 'secondary';
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSubmitDeliverable = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    setSubmissionTitle('');
    setSubmissionDescription('');
    setIsSubmitModalOpen(true);
  };

  const handleSubmissionSave = () => {
    if (!selectedDeliverable) return;

    // Update the deliverable status
    setDeliverables(prev => prev.map(d => 
      d.id === selectedDeliverable.id 
        ? { 
            ...d, 
            status: 'submitted' as const,
            submittedDate: new Date().toISOString().split('T')[0]
          }
        : d
    ));

    toast({
      title: "Deliverable Submitted! 🎉",
      description: "Your submission has been sent to the brand for review.",
    });

    setIsSubmitModalOpen(false);
    setSelectedDeliverable(null);
  };

  const pendingDeliverables = deliverables.filter(d => d.status === 'pending');
  const submittedDeliverables = deliverables.filter(d => d.status === 'submitted');
  const completedDeliverables = deliverables.filter(d => d.status === 'approved' || d.status === 'rejected');

  if (!userProfile || userProfile.role !== 'CREATOR') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is for creators only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Deliverables</h1>
          <p className="text-muted-foreground">Manage your content deliverables and submissions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {pendingDeliverables.length} pending
          </Badge>
        </div>
      </div>

      {/* Pending Deliverables */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Pending Submissions</h2>
        {pendingDeliverables.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending deliverables. Great job staying on top of things!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pendingDeliverables.map((deliverable) => {
              const daysUntilDue = getDaysUntilDue(deliverable.dueDate);
              const isOverdue = daysUntilDue < 0;
              const isUrgent = daysUntilDue <= 2 && daysUntilDue >= 0;

              return (
                <Card key={deliverable.id} className={isOverdue ? 'border-destructive' : isUrgent ? 'border-warning' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{deliverable.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {deliverable.brandName} • {deliverable.dealTitle}
                        </p>
                      </div>
                      <Badge 
                        variant={getStatusColor(deliverable.status) as any}
                        className="flex items-center gap-1"
                      >
                        {getStatusIcon(deliverable.status)}
                        {deliverable.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{deliverable.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Due: {new Date(deliverable.dueDate).toLocaleDateString()}</span>
                        {isOverdue ? (
                          <span className="text-destructive font-medium">
                            Overdue by {Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''}
                          </span>
                        ) : isUrgent ? (
                          <span className="text-warning font-medium">
                            Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span>{daysUntilDue} days remaining</span>
                        )}
                      </div>
                      <Button onClick={() => handleSubmitDeliverable(deliverable)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Submitted Deliverables */}
      {submittedDeliverables.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Under Review</h2>
          <div className="grid gap-4">
            {submittedDeliverables.map((deliverable) => (
              <Card key={deliverable.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{deliverable.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {deliverable.brandName} • {deliverable.dealTitle}
                      </p>
                    </div>
                    <Badge 
                      variant={getStatusColor(deliverable.status) as any}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(deliverable.status)}
                      {deliverable.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{deliverable.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Submitted: {new Date(deliverable.submittedDate!).toLocaleDateString()}</span>
                    {deliverable.fileUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={deliverable.fileUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View Submission
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Deliverables */}
      {completedDeliverables.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Completed</h2>
          <div className="grid gap-4">
            {completedDeliverables.map((deliverable) => (
              <Card key={deliverable.id} className="opacity-80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{deliverable.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {deliverable.brandName} • {deliverable.dealTitle}
                      </p>
                    </div>
                    <Badge 
                      variant={getStatusColor(deliverable.status) as any}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(deliverable.status)}
                      {deliverable.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{deliverable.description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Submitted: {new Date(deliverable.submittedDate!).toLocaleDateString()}</span>
                    {deliverable.fileUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={deliverable.fileUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          View Submission
                        </a>
                      </Button>
                    )}
                  </div>
                  {deliverable.feedback && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <strong>Feedback:</strong> {deliverable.feedback}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submit Deliverable Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Deliverable</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submission-title">Submission Title</Label>
              <Input
                id="submission-title"
                value={submissionTitle}
                onChange={(e) => setSubmissionTitle(e.target.value)}
                placeholder="Brief title for your submission"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submission-description">Description & Notes</Label>
              <Textarea
                id="submission-description"
                value={submissionDescription}
                onChange={(e) => setSubmissionDescription(e.target.value)}
                placeholder="Describe your submission and any additional notes for the brand"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Upload File</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop files here or click to browse
                </p>
                <Button variant="ghost" size="sm" className="mt-2">
                  Choose File
                </Button>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmissionSave}>
                Submit Deliverable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
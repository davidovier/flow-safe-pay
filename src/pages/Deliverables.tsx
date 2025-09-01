import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, FileText, Clock, CheckCircle, AlertCircle, Plus, Loader2, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Deliverable {
  deliverable_id: string;
  deliverable_title: string;
  deliverable_description: string;
  deliverable_due_at: string;
  deliverable_status: 'pending' | 'submitted' | 'approved' | 'rejected' | 'revision_requested';
  deliverable_submitted_at?: string;
  deliverable_feedback?: string;
  milestone_id: string;
  milestone_title: string;
  milestone_amount: number;
  deal_id: string;
  project_title: string;
  brand_name: string;
  // Additional fields for submitted deliverables
  submission_title?: string;
  submission_description?: string;
  submission_url?: string;
  file_name?: string;
}

interface FileUpload {
  file: File;
  preview?: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  error?: string;
}

export default function Deliverables() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  
  // Modal states
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [submissionTitle, setSubmissionTitle] = useState('');
  const [submissionDescription, setSubmissionDescription] = useState('');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  
  // File upload states
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);

  useEffect(() => {
    if (userProfile?.role === 'CREATOR') {
      fetchDeliverables();
    }
  }, [userProfile]);

  const fetchDeliverables = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_creator_deliverables', {
        creator_uuid: userProfile.id
      });

      if (error) throw error;

      setDeliverables(data || []);
    } catch (error) {
      console.error('Error fetching deliverables:', error);
      toast({
        title: "Error",
        description: "Failed to load deliverables. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: FileUpload[] = Array.from(files).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      uploading: false,
      uploaded: false
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files to Supabase Storage
    for (let i = 0; i < newFiles.length; i++) {
      const fileUpload = newFiles[i];
      const fileIndex = uploadedFiles.length + i;
      
      setUploadedFiles(prev => prev.map((f, idx) => 
        idx === fileIndex ? { ...f, uploading: true } : f
      ));

      try {
        const fileExt = fileUpload.file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `deliverables/${userProfile?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('deliverables')
          .upload(filePath, fileUpload.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('deliverables')
          .getPublicUrl(filePath);

        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { 
            ...f, 
            uploading: false, 
            uploaded: true, 
            url: publicUrl 
          } : f
        ));

      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadedFiles(prev => prev.map((f, idx) => 
          idx === fileIndex ? { 
            ...f, 
            uploading: false, 
            uploaded: false, 
            error: 'Upload failed' 
          } : f
        ));
      }
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitDeliverable = (deliverable: Deliverable) => {
    setSelectedDeliverable(deliverable);
    setSubmissionTitle('');
    setSubmissionDescription('');
    setUploadedFiles([]);
    setIsSubmitModalOpen(true);
  };

  const handleSubmissionSave = async () => {
    if (!selectedDeliverable || !userProfile) return;

    if (!submissionTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your submission.",
        variant: "destructive"
      });
      return;
    }

    if (uploadedFiles.length === 0) {
      toast({
        title: "File Required", 
        description: "Please upload at least one file for your submission.",
        variant: "destructive"
      });
      return;
    }

    if (uploadedFiles.some(f => f.uploading)) {
      toast({
        title: "Upload in Progress",
        description: "Please wait for all files to finish uploading.",
        variant: "destructive"
      });
      return;
    }

    if (uploadedFiles.some(f => !f.uploaded)) {
      toast({
        title: "Upload Failed",
        description: "Some files failed to upload. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setSubmissionLoading(true);
    try {
      const mainFile = uploadedFiles[0];
      
      const { error } = await supabase.rpc('submit_deliverable', {
        deliverable_uuid: selectedDeliverable.deliverable_id,
        submission_title_text: submissionTitle,
        submission_description_text: submissionDescription,
        submission_url_text: mainFile.url,
        file_name_text: mainFile.file.name,
        file_size_int: mainFile.file.size,
        mime_type_text: mainFile.file.type
      });

      if (error) throw error;

      // Add additional files if more than one
      if (uploadedFiles.length > 1) {
        for (let i = 1; i < uploadedFiles.length; i++) {
          const file = uploadedFiles[i];
          await supabase
            .from('deliverable_files')
            .insert({
              deliverable_id: selectedDeliverable.deliverable_id,
              file_name: file.file.name,
              file_path: file.url || '',
              file_size: file.file.size,
              mime_type: file.file.type
            });
        }
      }

      toast({
        title: "Deliverable Submitted! 🎉",
        description: "Your submission has been sent to the brand for review.",
      });

      // Refresh deliverables and close modal
      await fetchDeliverables();
      setIsSubmitModalOpen(false);
      setSelectedDeliverable(null);
      setUploadedFiles([]);

    } catch (error: any) {
      console.error('Error submitting deliverable:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit deliverable. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmissionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'submitted': return <Upload className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <AlertCircle className="h-4 w-4" />;
      case 'revision_requested': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      case 'revision_requested': return 'warning';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'submitted': return 'Under Review';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'revision_requested': return 'Revision Requested';
      default: return status;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  if (!userProfile || userProfile.role !== 'CREATOR') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is for creators only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
          <div className="h-6 bg-muted rounded w-24"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const pendingDeliverables = deliverables.filter(d => d.deliverable_status === 'pending' || d.deliverable_status === 'revision_requested');
  const submittedDeliverables = deliverables.filter(d => d.deliverable_status === 'submitted');
  const completedDeliverables = deliverables.filter(d => d.deliverable_status === 'approved' || d.deliverable_status === 'rejected');

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
          {submittedDeliverables.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {submittedDeliverables.length} under review
            </Badge>
          )}
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
              const daysUntilDue = getDaysUntilDue(deliverable.deliverable_due_at);
              const isOverdue = daysUntilDue < 0;
              const isUrgent = daysUntilDue <= 2 && daysUntilDue >= 0;

              return (
                <Card key={deliverable.deliverable_id} className={isOverdue ? 'border-destructive' : isUrgent ? 'border-warning' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{deliverable.deliverable_title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {deliverable.brand_name} • {deliverable.project_title}
                        </p>
                        <p className="text-sm font-medium text-primary">
                          {formatCurrency(deliverable.milestone_amount)} milestone
                        </p>
                      </div>
                      <Badge 
                        variant={getStatusColor(deliverable.deliverable_status) as any}
                        className="flex items-center gap-1"
                      >
                        {getStatusIcon(deliverable.deliverable_status)}
                        {getStatusText(deliverable.deliverable_status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm">{deliverable.deliverable_description}</p>
                    
                    {deliverable.deliverable_feedback && deliverable.deliverable_status === 'revision_requested' && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded text-sm">
                        <strong className="text-warning">Revision Requested:</strong>
                        <p className="mt-1">{deliverable.deliverable_feedback}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Due: {formatDate(deliverable.deliverable_due_at)}</span>
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
                        {deliverable.deliverable_status === 'revision_requested' ? 'Resubmit' : 'Submit'}
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
              <Card key={deliverable.deliverable_id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{deliverable.deliverable_title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {deliverable.brand_name} • {deliverable.project_title}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {formatCurrency(deliverable.milestone_amount)} milestone
                      </p>
                    </div>
                    <Badge 
                      variant={getStatusColor(deliverable.deliverable_status) as any}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(deliverable.deliverable_status)}
                      {getStatusText(deliverable.deliverable_status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{deliverable.deliverable_description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Submitted: {formatDate(deliverable.deliverable_submitted_at!)}</span>
                    {deliverable.submission_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={deliverable.submission_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-2" />
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
              <Card key={deliverable.deliverable_id} className="opacity-80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{deliverable.deliverable_title}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {deliverable.brand_name} • {deliverable.project_title}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {formatCurrency(deliverable.milestone_amount)} milestone
                      </p>
                    </div>
                    <Badge 
                      variant={getStatusColor(deliverable.deliverable_status) as any}
                      className="flex items-center gap-1"
                    >
                      {getStatusIcon(deliverable.deliverable_status)}
                      {getStatusText(deliverable.deliverable_status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{deliverable.deliverable_description}</p>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Submitted: {formatDate(deliverable.deliverable_submitted_at!)}</span>
                    {deliverable.submission_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={deliverable.submission_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-2" />
                          View Submission
                        </a>
                      </Button>
                    )}
                  </div>
                  {deliverable.deliverable_feedback && (
                    <div className={`mt-3 p-3 rounded text-sm ${
                      deliverable.deliverable_status === 'approved' 
                        ? 'bg-success/10 border border-success/20' 
                        : 'bg-destructive/10 border border-destructive/20'
                    }`}>
                      <strong className={deliverable.deliverable_status === 'approved' ? 'text-success' : 'text-destructive'}>
                        {deliverable.deliverable_status === 'approved' ? 'Approved:' : 'Rejection Reason:'}
                      </strong>
                      <p className="mt-1">{deliverable.deliverable_feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Submit Deliverable Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Deliverable</DialogTitle>
            {selectedDeliverable && (
              <p className="text-sm text-muted-foreground">
                {selectedDeliverable.deliverable_title} • {selectedDeliverable.brand_name}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="submission-title">Submission Title*</Label>
              <Input
                id="submission-title"
                value={submissionTitle}
                onChange={(e) => setSubmissionTitle(e.target.value)}
                placeholder="Brief title for your submission"
                disabled={submissionLoading}
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
                disabled={submissionLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Upload Files*</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag & drop files here or click to browse
                </p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  disabled={submissionLoading}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  disabled={submissionLoading}
                >
                  Choose Files
                </Button>
              </div>
              
              {/* File Preview */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label>Uploaded Files</Label>
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center space-x-3">
                          {file.preview && (
                            <img src={file.preview} alt="Preview" className="h-10 w-10 object-cover rounded" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{file.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          {file.uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                          {file.uploaded && <CheckCircle className="h-4 w-4 text-success" />}
                          {file.error && <AlertCircle className="h-4 w-4 text-destructive" />}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFile(index)}
                          disabled={submissionLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsSubmitModalOpen(false)}
                disabled={submissionLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmissionSave}
                disabled={submissionLoading || uploadedFiles.some(f => f.uploading)}
              >
                {submissionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Deliverable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
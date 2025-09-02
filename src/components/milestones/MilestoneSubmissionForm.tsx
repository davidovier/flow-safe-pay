import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Link, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react';

const submissionSchema = z.object({
  submission_type: z.enum(['file', 'url', 'text']),
  content_url: z.string().optional(),
  description: z.string().min(10, 'Please provide a detailed description of your deliverable'),
  file: z.any().optional(),
});

type SubmissionForm = z.infer<typeof submissionSchema>;

interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
  due_at?: string;
}

interface MilestoneSubmissionFormProps {
  milestone: Milestone;
  onSuccess: () => void;
  onCancel: () => void;
}

export function MilestoneSubmissionForm({ milestone, onSuccess, onCancel }: MilestoneSubmissionFormProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionType, setSubmissionType] = useState<'file' | 'url' | 'text'>('file');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const form = useForm<SubmissionForm>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      submission_type: 'file',
      content_url: '',
      description: '',
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please select a file smaller than 50MB.',
        });
        return;
      }

      setSelectedFile(file);
      form.setValue('file', file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    form.setValue('file', undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `deliverables/${milestone.id}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('deliverables')
      .upload(filePath, file, {
        onUploadProgress: (progress) => {
          setUploadProgress((progress.loaded / progress.total) * 100);
        },
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from('deliverables')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const generateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const onSubmit = async (data: SubmissionForm) => {
    if (!userProfile) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let fileUrl = '';
      let fileHash = '';

      if (data.submission_type === 'file' && selectedFile) {
        // Upload file and generate hash
        fileUrl = await uploadFile(selectedFile);
        fileHash = await generateFileHash(selectedFile);
      } else if (data.submission_type === 'url') {
        fileUrl = data.content_url || '';
      }

      // Create deliverable record
      const deliverableData = {
        milestone_id: milestone.id,
        url: fileUrl,
        file_hash: fileHash || null,
        submitted_at: new Date().toISOString(),
        checks: {
          submission_type: data.submission_type,
          description: data.description,
          file_name: selectedFile?.name,
          file_size: selectedFile?.size,
          file_type: selectedFile?.type,
        },
      };

      const { error: deliverableError } = await supabase
        .from('deliverables')
        .insert(deliverableData);

      if (deliverableError) throw deliverableError;

      // Update milestone state to SUBMITTED
      const { error: milestoneError } = await supabase
        .from('milestones')
        .update({ 
          state: 'SUBMITTED',
          submitted_at: new Date().toISOString()
        })
        .eq('id', milestone.id);

      if (milestoneError) throw milestoneError;

      // Log event
      await supabase.from('events').insert({
        actor_user_id: userProfile.id,
        type: 'milestone.submitted',
        payload: {
          milestone_id: milestone.id,
          submission_type: data.submission_type,
          has_file: !!selectedFile,
          file_size: selectedFile?.size,
        },
      });

      toast({
        title: 'Deliverable Submitted! ✅',
        description: 'Your submission has been sent for review. You\'ll be notified once it\'s reviewed.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: error.message || 'Failed to submit deliverable. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit Milestone Deliverable
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">{milestone.title}</p>
          <p>{formatAmount(milestone.amount, milestone.currency)}</p>
          {milestone.due_at && (
            <p>Due: {new Date(milestone.due_at).toLocaleDateString()}</p>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Submission Type Selection */}
          <div className="space-y-3">
            <Label>Submission Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'file', label: 'Upload File', icon: FileText },
                { value: 'url', label: 'Share Link', icon: Link },
                { value: 'text', label: 'Text Only', icon: FileText },
              ].map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant={submissionType === value ? 'default' : 'outline'}
                  onClick={() => {
                    setSubmissionType(value as any);
                    form.setValue('submission_type', value as any);
                  }}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm">{label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          {submissionType === 'file' && (
            <div className="space-y-3">
              <Label>Upload File</Label>
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*,.pdf,.doc,.docx,.zip,.rar"
                    className="hidden"
                    disabled={isSubmitting}
                  />
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 mx-auto text-gray-400" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      Images, videos, documents, or archives (max 50MB)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4"
                    disabled={isSubmitting}
                  >
                    Select File
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {selectedFile.type.startsWith('image/') ? (
                        <Image className="h-8 w-8 text-blue-500" />
                      ) : selectedFile.type.startsWith('video/') ? (
                        <Video className="h-8 w-8 text-green-500" />
                      ) : (
                        <FileText className="h-8 w-8 text-gray-500" />
                      )}
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {previewUrl && (
                    <div className="mt-3">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-xs max-h-48 rounded object-cover"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* URL Input */}
          {submissionType === 'url' && (
            <div className="space-y-2">
              <Label htmlFor="content_url">Content URL</Label>
              <Input
                id="content_url"
                {...form.register('content_url')}
                placeholder="https://example.com/your-deliverable"
                disabled={isSubmitting}
              />
              <p className="text-sm text-gray-500">
                Share a link to your deliverable (Google Drive, Dropbox, etc.)
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Describe your deliverable, the work completed, any notes for the brand..."
              rows={4}
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && submissionType === 'file' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Guidelines */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Submission Guidelines:</strong>
              <ul className="mt-1 text-sm list-disc list-inside space-y-1">
                <li>Ensure your deliverable meets all requirements discussed</li>
                <li>Include detailed description of the work completed</li>
                <li>Files are securely stored and will only be shared with the brand</li>
                <li>Once submitted, the brand will review and approve or request changes</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (submissionType === 'file' && !selectedFile)}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Deliverable
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
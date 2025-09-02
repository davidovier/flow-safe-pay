import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AlertTriangle, 
  FileText, 
  Upload,
  Loader2,
  Scale,
  MessageSquare
} from 'lucide-react';

const disputeSchema = z.object({
  type: z.enum(['quality', 'delivery', 'communication', 'payment', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  description: z.string().min(20, 'Please provide a detailed description (minimum 20 characters)'),
  desired_outcome: z.string().min(10, 'Please describe what resolution you are seeking'),
  evidence_description: z.string().optional(),
  acknowledge_mediation: z.boolean().refine(val => val === true, 'You must acknowledge the mediation process'),
});

type DisputeForm = z.infer<typeof disputeSchema>;

interface DisputeFormProps {
  dealId: string;
  milestoneId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const disputeTypes = [
  { value: 'quality', label: 'Quality Issues', description: 'Deliverable does not meet agreed specifications' },
  { value: 'delivery', label: 'Delivery Issues', description: 'Late delivery or non-delivery of milestones' },
  { value: 'communication', label: 'Communication Issues', description: 'Lack of communication or unresponsiveness' },
  { value: 'payment', label: 'Payment Issues', description: 'Payment delays or disputes' },
  { value: 'other', label: 'Other', description: 'Other issues not covered above' },
];

const priorityLevels = [
  { value: 'low', label: 'Low', description: 'Minor issue, not urgent' },
  { value: 'medium', label: 'Medium', description: 'Moderate issue requiring attention' },
  { value: 'high', label: 'High', description: 'Significant issue affecting project progress' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue requiring immediate attention' },
];

export function DisputeForm({ dealId, milestoneId, onSuccess, onCancel }: DisputeFormProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DisputeForm>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      type: 'other',
      priority: 'medium',
      subject: '',
      description: '',
      desired_outcome: '',
      evidence_description: '',
      acknowledge_mediation: false,
    },
  });

  const selectedType = form.watch('type');
  const selectedPriority = form.watch('priority');

  const onSubmit = async (data: DisputeForm) => {
    if (!userProfile) return;

    setIsSubmitting(true);
    try {
      // Create dispute record
      const disputeData = {
        deal_id: dealId,
        milestone_id: milestoneId || null,
        initiator_id: userProfile.id,
        type: data.type,
        priority: data.priority,
        subject: data.subject,
        description: data.description,
        desired_outcome: data.desired_outcome,
        evidence_description: data.evidence_description || null,
        status: 'open',
        created_at: new Date().toISOString(),
      };

      const { data: dispute, error: disputeError } = await supabase
        .from('disputes')
        .insert(disputeData)
        .select()
        .single();

      if (disputeError) throw disputeError;

      // Update deal state to DISPUTED
      const { error: dealUpdateError } = await supabase
        .from('deals')
        .update({ 
          state: 'DISPUTED',
          updated_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (dealUpdateError) throw dealUpdateError;

      // Update milestone state if applicable
      if (milestoneId) {
        await supabase
          .from('milestones')
          .update({ 
            state: 'DISPUTED',
            updated_at: new Date().toISOString()
          })
          .eq('id', milestoneId);
      }

      // Log event
      await supabase.from('events').insert({
        actor_user_id: userProfile.id,
        type: 'dispute.created',
        payload: {
          dispute_id: dispute.id,
          deal_id: dealId,
          milestone_id: milestoneId,
          type: data.type,
          priority: data.priority,
          has_evidence: !!data.evidence_description,
        },
      });

      // Create initial dispute message
      await supabase.from('dispute_messages').insert({
        dispute_id: dispute.id,
        sender_id: userProfile.id,
        message: `Dispute opened: ${data.subject}\n\n${data.description}`,
        message_type: 'system',
        created_at: new Date().toISOString(),
      });

      toast({
        title: 'Dispute Created Successfully',
        description: 'Your dispute has been submitted and will be reviewed by our mediation team. You will be contacted within 24 hours.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Dispute creation error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Dispute',
        description: error.message || 'Failed to create dispute. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Open Dispute
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          <p>Submit a dispute for mediation. Our team will review your case and work towards a fair resolution.</p>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Dispute Type */}
          <div className="space-y-3">
            <Label>Dispute Type *</Label>
            <Select onValueChange={(value) => form.setValue('type', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select dispute type" />
              </SelectTrigger>
              <SelectContent>
                {disputeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-600">{form.formState.errors.type.message}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label>Priority Level *</Label>
            <Select onValueChange={(value) => form.setValue('priority', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorityLevels.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <div>
                      <div className="font-medium">{priority.label}</div>
                      <div className="text-xs text-muted-foreground">{priority.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.priority && (
              <p className="text-sm text-red-600">{form.formState.errors.priority.message}</p>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              {...form.register('subject')}
              placeholder="Brief summary of the dispute"
              disabled={isSubmitting}
            />
            {form.formState.errors.subject && (
              <p className="text-sm text-red-600">{form.formState.errors.subject.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Detailed Description *</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Provide a detailed explanation of the issue, including timeline of events, communications, and any relevant context..."
              rows={6}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Include as much detail as possible to help our mediation team understand the situation.
            </p>
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Desired Outcome */}
          <div className="space-y-2">
            <Label htmlFor="desired_outcome">Desired Resolution *</Label>
            <Textarea
              id="desired_outcome"
              {...form.register('desired_outcome')}
              placeholder="What outcome are you seeking? (e.g., refund, milestone revision, additional deliverables, etc.)"
              rows={3}
              disabled={isSubmitting}
            />
            {form.formState.errors.desired_outcome && (
              <p className="text-sm text-red-600">{form.formState.errors.desired_outcome.message}</p>
            )}
          </div>

          {/* Evidence Description */}
          <div className="space-y-2">
            <Label htmlFor="evidence_description">Supporting Evidence (Optional)</Label>
            <Textarea
              id="evidence_description"
              {...form.register('evidence_description')}
              placeholder="Describe any evidence you have (screenshots, emails, files, etc.). You can upload files after the dispute is created."
              rows={3}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              Evidence files can be uploaded in the dispute chat after submission.
            </p>
          </div>

          {/* Mediation Process Info */}
          <Alert>
            <Scale className="h-4 w-4" />
            <AlertDescription>
              <strong>Mediation Process:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Our mediation team will review your dispute within 24 hours</li>
                <li>• Both parties will be invited to a mediated discussion</li>
                <li>• You can provide additional evidence and communicate through the dispute chat</li>
                <li>• Our goal is to reach a fair resolution that works for everyone</li>
                <li>• Funds remain in escrow during the dispute process</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Acknowledgment */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acknowledge_mediation"
                checked={form.watch('acknowledge_mediation')}
                onCheckedChange={(checked) => 
                  form.setValue('acknowledge_mediation', checked as boolean)
                }
              />
              <div className="space-y-1">
                <Label htmlFor="acknowledge_mediation" className="text-sm leading-none">
                  I understand and agree to the mediation process
                </Label>
                <p className="text-xs text-muted-foreground">
                  I acknowledge that disputes will be handled through FlowPay's mediation process and I will participate in good faith to reach a resolution.
                </p>
              </div>
            </div>
            {form.formState.errors.acknowledge_mediation && (
              <p className="text-sm text-red-600">
                {form.formState.errors.acknowledge_mediation.message}
              </p>
            )}
          </div>

          {/* Priority Warning */}
          {selectedPriority === 'urgent' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Urgent Priority:</strong> This dispute will be escalated immediately. Please ensure this is truly urgent as it requires immediate attention from our mediation team.
              </AlertDescription>
            </Alert>
          )}

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
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Dispute...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Submit Dispute
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
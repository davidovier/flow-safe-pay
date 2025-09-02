import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Loader2,
  MessageSquare
} from 'lucide-react';

const approvalSchema = z.object({
  action: z.enum(['approve', 'reject', 'request_revision']),
  feedback: z.string().optional(),
}).refine(data => {
  if (data.action !== 'approve' && (!data.feedback || data.feedback.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Feedback is required when rejecting or requesting revision',
  path: ['feedback']
});

type ApprovalFormData = z.infer<typeof approvalSchema>;

interface DeliverableApprovalFormProps {
  milestoneId: string;
  deliverableId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DeliverableApprovalForm({
  milestoneId,
  deliverableId,
  onSuccess,
  onCancel
}: DeliverableApprovalFormProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      action: 'approve',
      feedback: '',
    },
  });

  const watchedAction = form.watch('action');

  const onSubmit = async (data: ApprovalFormData) => {
    if (!userProfile) return;

    setIsSubmitting(true);
    try {
      // Call backend API to handle milestone approval/rejection
      const response = await fetch(`/api/milestones/${milestoneId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: JSON.stringify({
          action: data.action,
          feedback: data.feedback,
          deliverable_id: deliverableId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit review');
      }

      const result = await response.json();

      // Update local deliverable status
      const status = data.action === 'approve' ? 'approved' : 
                   data.action === 'reject' ? 'rejected' : 'revision_requested';

      await supabase
        .from('deliverables')
        .update({
          checks: {
            status,
            feedback: data.feedback,
            reviewed_at: new Date().toISOString(),
            reviewed_by: userProfile.id,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', deliverableId);

      // Update milestone state
      const milestoneState = data.action === 'approve' ? 'APPROVED' : 
                           data.action === 'reject' ? 'PENDING' : 'PENDING';
      
      await supabase
        .from('milestones')
        .update({ state: milestoneState })
        .eq('id', milestoneId);

      // Log the event
      await supabase.from('events').insert({
        actor_user_id: userProfile.id,
        type: `milestone.${data.action}d`,
        payload: {
          milestone_id: milestoneId,
          deliverable_id: deliverableId,
          action: data.action,
          has_feedback: !!data.feedback,
        },
      });

      toast({
        title: 'Review Submitted Successfully! 🎉',
        description: `Deliverable has been ${data.action}d. ${data.action === 'approve' ? 'Payment will be processed shortly.' : 'Creator has been notified.'}`,
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Review submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Review Failed',
        description: error.message || 'Failed to submit review. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getActionConfig = (action: string) => {
    const configs = {
      approve: {
        label: 'Approve',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: CheckCircle,
        description: 'Accept the deliverable and release payment to creator',
      },
      reject: {
        label: 'Reject',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: XCircle,
        description: 'Reject the deliverable and return milestone to pending state',
      },
      request_revision: {
        label: 'Request Revision',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: AlertTriangle,
        description: 'Ask creator to make changes and resubmit',
      },
    };
    return configs[action as keyof typeof configs];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Review Deliverable
        </CardTitle>
        <p className="text-muted-foreground">
          Please review the submitted deliverable and provide your decision.
        </p>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Action Selection */}
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Review Decision</FormLabel>
                  <FormControl>
                    <div className="grid gap-3">
                      {['approve', 'request_revision', 'reject'].map((action) => {
                        const config = getActionConfig(action);
                        const Icon = config.icon;
                        const isSelected = field.value === action;
                        
                        return (
                          <div
                            key={action}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                              isSelected
                                ? `${config.borderColor} ${config.bgColor}`
                                : 'border-muted hover:border-muted-foreground/30'
                            }`}
                            onClick={() => field.onChange(action)}
                          >
                            <div className="flex items-start gap-3">
                              <Icon className={`h-5 w-5 ${isSelected ? config.color : 'text-muted-foreground'}`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`font-medium ${isSelected ? config.color : 'text-foreground'}`}>
                                    {config.label}
                                  </span>
                                  {isSelected && (
                                    <Badge variant="secondary" className="text-xs">Selected</Badge>
                                  )}
                                </div>
                                <p className={`text-sm mt-1 ${isSelected ? config.color : 'text-muted-foreground'}`}>
                                  {config.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Feedback */}
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Feedback
                    {watchedAction !== 'approve' && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                    {watchedAction === 'approve' && (
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    )}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={
                        watchedAction === 'approve'
                          ? 'Great work! Any additional feedback...'
                          : watchedAction === 'request_revision'
                          ? 'Please explain what changes are needed...'
                          : 'Please explain why this deliverable is being rejected...'
                      }
                      rows={4}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Summary */}
            {watchedAction && (
              <Alert className={getActionConfig(watchedAction).bgColor}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action Summary:</strong>{' '}
                  {watchedAction === 'approve' && (
                    'The deliverable will be approved and payment will be processed automatically.'
                  )}
                  {watchedAction === 'reject' && (
                    'The deliverable will be rejected and the milestone will return to pending state.'
                  )}
                  {watchedAction === 'request_revision' && (
                    'The creator will be notified to make revisions and resubmit the deliverable.'
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={getActionConfig(watchedAction).color}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    {React.createElement(getActionConfig(watchedAction).icon, {
                      className: 'h-4 w-4 mr-2'
                    })}
                    {getActionConfig(watchedAction).label} Deliverable
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
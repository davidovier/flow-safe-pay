import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  due_date: z.string().optional(),
});

const dealSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  creator_email: z.string().email('Valid email is required'),
  currency: z.string().default('usd'),
  milestones: z.array(milestoneSchema).min(1, 'At least one milestone is required'),
});

type DealForm = z.infer<typeof dealSchema>;

interface Project {
  id: string;
  title: string;
  description: string | null;
}

interface Creator {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

interface CreateDealFormProps {
  onSuccess: () => void;
}

export function CreateDealForm({ onSuccess }: CreateDealFormProps) {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      project_id: '',
      creator_email: '',
      currency: 'usd',
      milestones: [
        {
          title: '',
          description: '',
          amount: 0,
          due_date: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'milestones',
  });

  useEffect(() => {
    fetchProjects();
    fetchCreators();
  }, []);

  const fetchProjects = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title, description')
        .eq('brand_id', userProfile.id)
        .eq('status', 'active');

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load projects: ' + error.message,
      });
    }
  };

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('role', 'CREATOR');

      if (error) throw error;
      setCreators(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load creators: ' + error.message,
      });
    }
  };

  const onSubmit = async (data: DealForm) => {
    try {
      setIsLoading(true);

      // Find creator by email
      const creator = creators.find(c => c.email === data.creator_email);
      if (!creator) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Creator not found with that email address',
        });
        return;
      }

      // Calculate total amount
      const totalAmount = data.milestones.reduce((sum, milestone) => sum + milestone.amount * 100, 0);

      // Create deal
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          project_id: data.project_id,
          creator_id: creator.id,
          currency: data.currency,
          amount_total: totalAmount,
          state: 'DRAFT',
        })
        .select()
        .single();

      if (dealError) throw dealError;

      // Create milestones
      const milestoneInserts = data.milestones.map(milestone => ({
        deal_id: deal.id,
        title: milestone.title,
        amount: milestone.amount * 100, // Convert to cents
        due_at: milestone.due_date || null,
        state: 'PENDING' as const,
      }));

      const { error: milestonesError } = await supabase
        .from('milestones')
        .insert(milestoneInserts);

      if (milestonesError) throw milestonesError;

      // Log event
      await supabase.from('events').insert({
        actor_user_id: userProfile?.id,
        type: 'deal.created',
        payload: {
          deal_id: deal.id,
          project_id: data.project_id,
          creator_id: creator.id,
          total_amount: totalAmount,
          milestones_count: data.milestones.length,
        },
      });

      toast({
        title: 'Success',
        description: 'Deal created successfully! The creator will be notified.',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create deal: ' + error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMilestone = () => {
    append({
      title: '',
      description: '',
      amount: 0,
      due_date: '',
    });
  };

  const removeMilestone = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const totalAmount = form.watch('milestones').reduce((sum, milestone) => sum + (milestone.amount || 0), 0);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label htmlFor="project_id">Project</Label>
          <Select onValueChange={(value) => form.setValue('project_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.project_id && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.project_id.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="creator_email">Creator Email</Label>
          <Select onValueChange={(value) => form.setValue('creator_email', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a creator" />
            </SelectTrigger>
            <SelectContent>
              {creators.map((creator) => (
                <SelectItem key={creator.id} value={creator.email}>
                  {creator.first_name || creator.last_name 
                    ? `${creator.first_name || ''} ${creator.last_name || ''}`.trim()
                    : creator.email
                  }
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.creator_email && (
            <p className="text-sm text-red-600 mt-1">{form.formState.errors.creator_email.message}</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Milestones</h3>
          <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base">Milestone {index + 1}</CardTitle>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMilestone(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Title</Label>
                  <Input
                    {...form.register(`milestones.${index}.title`)}
                    placeholder="e.g., Instagram Reel Creation"
                  />
                </div>

                <div>
                  <Label>Description (Optional)</Label>
                  <Textarea
                    {...form.register(`milestones.${index}.description`)}
                    placeholder="Describe the deliverable requirements..."
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register(`milestones.${index}.amount`, { valueAsNumber: true })}
                      placeholder="1500.00"
                    />
                  </div>

                  <div>
                    <Label>Due Date (Optional)</Label>
                    <Input
                      type="date"
                      {...form.register(`milestones.${index}.due_date`)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-medium">Total Deal Value:</span>
          <span className="text-2xl font-bold text-green-600">
            ${totalAmount.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={() => onSuccess()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Deal
          </Button>
        </div>
      </div>
    </form>
  );
}
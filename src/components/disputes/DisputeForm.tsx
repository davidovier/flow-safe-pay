import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Upload, X, FileText, Image, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Deal {
  id: string;
  project: {
    title: string;
    brandId: string;
  };
  creatorId: string;
  totalAmount: number;
  currency: string;
  state: string;
}

interface Evidence {
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'URL';
  content: string;
  description?: string;
}

interface DisputeFormProps {
  deal: Deal;
  currentUserId: string;
  onSubmit: (disputeData: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DISPUTE_CATEGORIES = [
  { value: 'QUALITY', label: 'Quality Issues', description: 'Delivered work does not meet agreed standards' },
  { value: 'DEADLINE', label: 'Missed Deadlines', description: 'Milestones were not delivered on time' },
  { value: 'COMMUNICATION', label: 'Communication Problems', description: 'Poor or lack of communication' },
  { value: 'PAYMENT', label: 'Payment Issues', description: 'Payment-related disputes' },
  { value: 'SCOPE', label: 'Scope Changes', description: 'Work scope was changed without agreement' },
  { value: 'OTHER', label: 'Other', description: 'Other issues not listed above' },
];

const RESOLUTION_TYPES = [
  { value: 'FULL_REFUND', label: 'Full Refund', description: 'Request complete refund of payment' },
  { value: 'PARTIAL_REFUND', label: 'Partial Refund', description: 'Request partial refund for unsatisfactory work' },
  { value: 'REVISION', label: 'Work Revision', description: 'Request revision of delivered work' },
  { value: 'EXTENSION', label: 'Deadline Extension', description: 'Request extension of deadline' },
  { value: 'CANCELLATION', label: 'Deal Cancellation', description: 'Cancel the entire deal' },
  { value: 'OTHER', label: 'Other Resolution', description: 'Other resolution not listed above' },
];

export function DisputeForm({ deal, currentUserId, onSubmit, onCancel, isLoading }: DisputeFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    reason: '',
    category: '',
    requestedResolution: '',
    requestedAmount: '',
  });
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [newEvidence, setNewEvidence] = useState<Evidence>({
    type: 'TEXT',
    content: '',
    description: ''
  });

  // Check if user can create disputes
  const canCreateDispute = deal.creatorId === currentUserId || deal.project.brandId === currentUserId;
  const isDisputableState = ['FUNDED', 'SUBMITTED', 'REJECTED'].includes(deal.state);

  const handleAddEvidence = () => {
    if (!newEvidence.content.trim()) {
      toast({
        title: 'Error',
        description: 'Evidence content is required',
        variant: 'destructive',
      });
      return;
    }

    setEvidence([...evidence, { ...newEvidence }]);
    setNewEvidence({ type: 'TEXT', content: '', description: '' });
  };

  const handleRemoveEvidence = (index: number) => {
    setEvidence(evidence.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.reason.trim() || !formData.category || !formData.requestedResolution) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.requestedResolution === 'PARTIAL_REFUND' && !formData.requestedAmount) {
      toast({
        title: 'Error',
        description: 'Please specify the requested refund amount',
        variant: 'destructive',
      });
      return;
    }

    const requestedAmount = formData.requestedAmount ? 
      parseFloat(formData.requestedAmount) * 100 : // Convert to cents
      (formData.requestedResolution === 'FULL_REFUND' ? deal.totalAmount : undefined);

    try {
      await onSubmit({
        dealId: deal.id,
        reason: formData.reason,
        category: formData.category,
        requestedResolution: formData.requestedResolution,
        requestedAmount,
        evidence: evidence.length > 0 ? evidence : undefined,
      });
    } catch (error) {
      console.error('Failed to submit dispute:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit dispute. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!canCreateDispute) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only deal participants can create disputes.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isDisputableState) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cannot Create Dispute</h3>
            <p className="text-muted-foreground">
              Disputes can only be created for funded, submitted, or rejected deals.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Current deal state: <Badge variant="outline">{deal.state}</Badge>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case 'IMAGE': return <Image className="h-4 w-4" />;
      case 'FILE': return <FileText className="h-4 w-4" />;
      case 'URL': return <Link className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Create Dispute
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Submit a formal dispute for the deal "{deal.project.title}". 
            Please provide detailed information to help resolve the issue.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dispute Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Dispute Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select dispute category" />
              </SelectTrigger>
              <SelectContent>
                {DISPUTE_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div>
                      <div className="font-medium">{category.label}</div>
                      <div className="text-xs text-muted-foreground">{category.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Detailed Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Please provide a detailed explanation of the issue..."
              className="min-h-[120px]"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.reason.length}/1000 characters
            </p>
          </div>

          {/* Requested Resolution */}
          <div className="space-y-2">
            <Label htmlFor="resolution">Requested Resolution *</Label>
            <Select
              value={formData.requestedResolution}
              onValueChange={(value) => setFormData({ ...formData, requestedResolution: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select desired resolution" />
              </SelectTrigger>
              <SelectContent>
                {RESOLUTION_TYPES.map((resolution) => (
                  <SelectItem key={resolution.value} value={resolution.value}>
                    <div>
                      <div className="font-medium">{resolution.label}</div>
                      <div className="text-xs text-muted-foreground">{resolution.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Requested Amount (for refund requests) */}
          {(formData.requestedResolution === 'PARTIAL_REFUND' || formData.requestedResolution === 'FULL_REFUND') && (
            <div className="space-y-2">
              <Label htmlFor="amount">
                Requested Amount ({deal.currency.toUpperCase()}) *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                max={deal.totalAmount / 100}
                value={formData.requestedAmount}
                onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value })}
                placeholder={formData.requestedResolution === 'FULL_REFUND' ? 
                  `${(deal.totalAmount / 100).toFixed(2)} (full amount)` : 
                  '0.00'
                }
              />
              <p className="text-xs text-muted-foreground">
                Deal total: {(deal.totalAmount / 100).toFixed(2)} {deal.currency.toUpperCase()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evidence Section */}
      <Card>
        <CardHeader>
          <CardTitle>Supporting Evidence (Optional)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add any evidence that supports your dispute claim.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Evidence Form */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 space-y-2">
                <Label htmlFor="evidence-type">Evidence Type</Label>
                <Select
                  value={newEvidence.type}
                  onValueChange={(value: any) => setNewEvidence({ ...newEvidence, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text/Description</SelectItem>
                    <SelectItem value="IMAGE">Image URL</SelectItem>
                    <SelectItem value="FILE">File URL</SelectItem>
                    <SelectItem value="URL">Reference URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-2 space-y-2">
                <Label htmlFor="evidence-content">Content</Label>
                <Input
                  id="evidence-content"
                  value={newEvidence.content}
                  onChange={(e) => setNewEvidence({ ...newEvidence, content: e.target.value })}
                  placeholder={
                    newEvidence.type === 'TEXT' ? 'Enter text description...' :
                    newEvidence.type === 'URL' ? 'https://...' :
                    'Enter URL...'
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="evidence-description">Description (Optional)</Label>
              <Input
                id="evidence-description"
                value={newEvidence.description}
                onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                placeholder="Brief description of this evidence..."
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAddEvidence}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Evidence
            </Button>
          </div>

          {/* Evidence List */}
          {evidence.length > 0 && (
            <div className="space-y-2">
              <Label>Added Evidence</Label>
              {evidence.map((item, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  {getEvidenceIcon(item.type)}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.type}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.content}
                    </div>
                    {item.description && (
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEvidence(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
          {isLoading ? 'Submitting...' : 'Submit Dispute'}
        </Button>
      </div>
    </form>
  );
}
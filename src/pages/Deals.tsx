import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Clock, Wallet, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreateDealForm } from '@/components/deals/CreateDealForm';

interface Deal {
  id: string;
  project_id: string;
  creator_id: string | null;
  currency: string;
  amount_total: number;
  escrow_id: string | null;
  state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  created_at: string;
  projects: {
    title: string;
    description: string | null;
  };
  users: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  milestones: Array<{
    id: string;
    title: string;
    amount: number;
    state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
    due_at: string | null;
  }>;
}

const stateColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  FUNDED: 'bg-blue-100 text-blue-800',
  RELEASED: 'bg-green-100 text-green-800',
  DISPUTED: 'bg-yellow-100 text-yellow-800',
  REFUNDED: 'bg-red-100 text-red-800',
};

export default function Deals() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('deals')
        .select(`
          *,
          projects (title, description),
          users (email, first_name, last_name),
          milestones (id, title, amount, state, due_at)
        `);

      // Filter based on user role
      if (userProfile?.role === 'BRAND') {
        query = query.eq('projects.brand_id', userProfile.id);
      } else if (userProfile?.role === 'CREATOR') {
        query = query.eq('creator_id', userProfile.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load deals: ' + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userProfile) {
      fetchDeals();
    }
  }, [userProfile]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const getCreatorName = (deal: Deal) => {
    if (deal.users?.first_name || deal.users?.last_name) {
      return `${deal.users.first_name || ''} ${deal.users.last_name || ''}`.trim();
    }
    return deal.users?.email || 'Unassigned';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deals</h1>
          <p className="text-gray-600 mt-2">
            {userProfile?.role === 'BRAND' 
              ? 'Manage your creator deals and milestones'
              : 'View your accepted deals and submit deliverables'
            }
          </p>
        </div>
        
        {userProfile?.role === 'BRAND' && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Deal</DialogTitle>
              </DialogHeader>
              <CreateDealForm 
                onSuccess={() => {
                  setIsCreateModalOpen(false);
                  fetchDeals();
                }} 
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {deals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deals yet</h3>
            <p className="text-gray-600 mb-4">
              {userProfile?.role === 'BRAND' 
                ? 'Create your first deal to start collaborating with creators'
                : 'You haven\'t accepted any deals yet'
              }
            </p>
            {userProfile?.role === 'BRAND' && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {deals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{deal.projects.title}</CardTitle>
                  <Badge className={stateColors[deal.state]}>{deal.state}</Badge>
                </div>
                <CardDescription>
                  {userProfile?.role === 'BRAND' ? (
                    <>Creator: {getCreatorName(deal)}</>
                  ) : (
                    <>Project: {deal.projects.description}</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Value</span>
                    <span className="font-semibold">{formatAmount(deal.amount_total)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Milestones</span>
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        {deal.milestones.filter(m => m.state === 'RELEASED').length} / {deal.milestones.length}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm text-gray-600">
                      {new Date(deal.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/deals/${deal.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
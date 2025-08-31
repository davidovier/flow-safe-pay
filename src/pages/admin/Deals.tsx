import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { Handshake, Search, Eye, Wallet, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Deal {
  id: string;
  title: string;
  brandName: string;
  brandEmail: string;
  creatorName: string;
  creatorEmail: string;
  budget: number;
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  createdDate: string;
  completedDate?: string;
  description: string;
}

export default function AdminDeals() {
  const { userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - in real app this would come from API
  const deals: Deal[] = [
    {
      id: '1',
      title: 'Summer Campaign Video',
      brandName: 'TechFlow',
      brandEmail: 'techflow@company.com',
      creatorName: 'Alice Johnson',
      creatorEmail: 'alice.johnson@example.com',
      budget: 500,
      status: 'completed',
      createdDate: '2025-08-15',
      completedDate: '2025-08-20',
      description: 'Instagram reel showcasing summer tech products'
    },
    {
      id: '2',
      title: 'Brand Partnership',
      brandName: 'StyleCo',
      brandEmail: 'partnerships@styleco.com',
      creatorName: 'Bob Smith',
      creatorEmail: 'bob.smith@example.com',
      budget: 750,
      status: 'in_progress',
      createdDate: '2025-08-20',
      description: 'YouTube collaboration for fashion brand'
    },
    {
      id: '3',
      title: 'Product Review',
      brandName: 'GearHub',
      brandEmail: 'marketing@gearhub.com',
      creatorName: 'Carol Wilson',
      creatorEmail: 'carol.wilson@example.com',
      budget: 300,
      status: 'active',
      createdDate: '2025-08-25',
      description: 'Detailed tech product review with photos'
    },
    {
      id: '4',
      title: 'Disputed Deal',
      brandName: 'FastTech',
      brandEmail: 'contact@fasttech.com',
      creatorName: 'Dave Brown',
      creatorEmail: 'dave.brown@example.com',
      budget: 400,
      status: 'disputed',
      createdDate: '2025-08-10',
      description: 'Mobile app promotion - under dispute'
    }
  ];

  const filteredDeals = deals.filter(deal => 
    deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.creatorName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4" />;
      case 'active': return <AlertCircle className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      case 'disputed': return <AlertCircle className="h-4 w-4" />;
      default: return <Handshake className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'active': return 'warning';
      case 'in_progress': return 'secondary';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      case 'disputed': return 'destructive';
      default: return 'secondary';
    }
  };

  const totalValue = deals.reduce((sum, deal) => sum + deal.budget, 0);
  const completedDeals = deals.filter(d => d.status === 'completed').length;
  const activeDeals = deals.filter(d => d.status === 'active' || d.status === 'in_progress').length;
  const disputedDeals = deals.filter(d => d.status === 'disputed').length;

  if (!userProfile || userProfile.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is for administrators only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Deal Management</h1>
          <p className="text-muted-foreground">Monitor and manage all deals on the platform</p>
        </div>
      </div>

      {/* Deal Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{activeDeals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Wallet className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{disputedDeals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Deals List */}
      <Card>
        <CardHeader>
          <CardTitle>All Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDeals.map((deal) => (
              <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{deal.title}</h3>
                    <Badge variant={getStatusColor(deal.status) as any} className="flex items-center gap-1">
                      {getStatusIcon(deal.status)}
                      {deal.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{deal.description}</p>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Brand:</span> {deal.brandName} ({deal.brandEmail})
                    </div>
                    <div>
                      <span className="font-medium">Creator:</span> {deal.creatorName} ({deal.creatorEmail})
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">Budget:</span> ${deal.budget}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(deal.createdDate).toLocaleDateString()}
                    </div>
                    {deal.completedDate && (
                      <div>
                        <span className="font-medium">Completed:</span> {new Date(deal.completedDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {deal.status === 'disputed' && (
                    <Button variant="outline" size="sm">
                      Resolve Dispute
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {filteredDeals.length === 0 && (
            <div className="text-center py-8">
              <Handshake className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No deals found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
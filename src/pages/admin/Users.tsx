import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Search, 
  MoreHorizontal, 
  Shield, 
  UserCheck, 
  UserX, 
  Eye,
  Edit,
  Trash2,
  Download,
  Filter,
  RefreshCw,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'BRAND' | 'CREATOR' | 'ADMIN';
  country: string | null;
  stripe_account_id: string | null;
  kyc_status: string;
  created_at: string;
  updated_at: string;
  // Calculated fields
  total_deals?: number;
  total_projects?: number;
  total_earnings?: number;
  last_active?: string;
}

interface UserAction {
  user_id: string;
  action: 'suspend' | 'activate' | 'verify' | 'reject' | 'delete';
  reason: string;
}

export default function AdminUsers() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [userAction, setUserAction] = useState<UserAction>({
    user_id: '',
    action: 'suspend',
    reason: ''
  });

  useEffect(() => {
    if (userProfile?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [userProfile]);

  const fetchUsers = async () => {
    if (!userProfile || userProfile.role !== 'ADMIN') return;
    
    setLoading(true);
    try {
      // Fetch all users with enhanced data
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError && usersError.code !== 'PGRST301') {
        throw usersError;
      }

      const enhancedUsers = await Promise.all(
        (usersData || []).map(async (user) => {
          try {
            // Get deal statistics for creators and brands
            const dealStatsPromise = user.role === 'CREATOR' 
              ? supabase
                  .from('deals')
                  .select('id, amount_total, state')
                  .eq('creator_id', user.id)
              : user.role === 'BRAND'
              ? supabase
                  .from('deals')
                  .select('id, amount_total, state, projects!inner(*)')
                  .eq('projects.brand_id', user.id)
              : Promise.resolve({ data: [], error: null });

            // Get project count for brands
            const projectStatsPromise = user.role === 'BRAND'
              ? supabase
                  .from('projects')
                  .select('id')
                  .eq('brand_id', user.id)
              : Promise.resolve({ data: [], error: null });

            const [dealsResult, projectsResult] = await Promise.all([
              dealStatsPromise,
              projectStatsPromise
            ]);

            const deals = dealsResult.data || [];
            const projects = projectsResult.data || [];

            // Calculate earnings for creators
            const totalEarnings = user.role === 'CREATOR' 
              ? deals
                  .filter(deal => deal.state === 'RELEASED')
                  .reduce((sum, deal) => sum + deal.amount_total, 0)
              : 0;

            return {
              ...user,
              total_deals: deals.length,
              total_projects: projects.length,
              total_earnings: totalEarnings,
              last_active: user.updated_at // Use updated_at as proxy for last active
            };
          } catch (error) {
            console.warn(`Could not fetch stats for user ${user.id}:`, error);
            return {
              ...user,
              total_deals: 0,
              total_projects: 0,
              total_earnings: 0,
              last_active: user.updated_at
            };
          }
        })
      );

      setUsers(enhancedUsers);

    } catch (error) {
      console.error('Error fetching users:', error);
      if (!error || (error as any).code !== 'PGRST301') {
        toast({
          title: "Error",
          description: "Failed to load users. Please try again.",
          variant: "destructive"
        });
      }
      // Set empty users array to show empty state
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!userAction.user_id || !userAction.reason.trim()) {
      toast({
        title: "Action Required",
        description: "Please provide a reason for this action.",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      // In a real implementation, you'd have specific admin functions
      // For now, we'll simulate the action
      if (userAction.action === 'delete') {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', userAction.user_id);

        if (error) throw error;
      } else {
        // Update user status or kyc_status based on action
        const updates: any = { updated_at: new Date().toISOString() };
        
        if (userAction.action === 'verify') {
          updates.kyc_status = 'verified';
        } else if (userAction.action === 'reject') {
          updates.kyc_status = 'rejected';
        }

        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', userAction.user_id);

        if (error) throw error;
      }

      // Log admin action (in real implementation)
      await supabase
        .from('events')
        .insert({
          actor_user_id: userProfile?.id,
          type: 'admin_action',
          payload: {
            action: userAction.action,
            target_user_id: userAction.user_id,
            reason: userAction.reason
          }
        });

      toast({
        title: "Action Completed ✅",
        description: `User ${userAction.action} action completed successfully.`,
      });

      await fetchUsers();
      setIsActionModalOpen(false);
      setUserAction({ user_id: '', action: 'suspend', reason: '' });

    } catch (error: any) {
      console.error('Error performing user action:', error);
      toast({
        title: "Action Failed",
        description: error.message || "Failed to perform action. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const exportUsers = async () => {
    try {
      const csvContent = [
        ['Email', 'Name', 'Role', 'Country', 'KYC Status', 'Join Date', 'Total Deals', 'Total Earnings'].join(','),
        ...filteredUsers.map(user => [
          user.email,
          `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          user.role,
          user.country || 'N/A',
          user.kyc_status,
          new Date(user.created_at).toLocaleDateString(),
          user.total_deals || 0,
          user.role === 'CREATOR' ? `$${((user.total_earnings || 0) / 100).toFixed(2)}` : 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "User data has been downloaded as CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export user data.",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.kyc_status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'BRAND': return 'default';
      case 'CREATOR': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!userProfile || userProfile.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
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
          <div className="h-10 bg-muted rounded w-32"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    totalCreators: users.filter(u => u.role === 'CREATOR').length,
    totalBrands: users.filter(u => u.role === 'BRAND').length,
    pendingVerifications: users.filter(u => u.kyc_status === 'pending').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage platform users and verification status</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportUsers}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              All platform users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Creators</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-secondary-foreground">{stats.totalCreators}</div>
            <p className="text-xs text-muted-foreground">
              Content creators
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Brands</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalBrands}</div>
            <p className="text-xs text-muted-foreground">
              Brand accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending KYC</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingVerifications}</div>
            <p className="text-xs text-muted-foreground">
              Need verification
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="CREATOR">Creators</SelectItem>
            <SelectItem value="BRAND">Brands</SelectItem>
            <SelectItem value="ADMIN">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {users.length === 0 ? 'No Users Found' : 'No Matching Users'}
              </h3>
              <p className="text-muted-foreground">
                {users.length === 0 
                  ? 'No users have registered on the platform yet.' 
                  : 'Try adjusting your search filters.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <span className="font-medium text-primary">
                        {(user.first_name?.[0] || user.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">
                          {user.first_name && user.last_name 
                            ? `${user.first_name} ${user.last_name}` 
                            : user.email}
                        </h3>
                        <Badge variant={getRoleColor(user.role) as any}>
                          {user.role}
                        </Badge>
                        <Badge variant={getStatusColor(user.kyc_status) as any}>
                          {user.kyc_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Joined {formatDate(user.created_at)}</span>
                        </div>
                        {user.country && (
                          <>
                            <span>•</span>
                            <span>{user.country}</span>
                          </>
                        )}
                        {user.total_deals! > 0 && (
                          <>
                            <span>•</span>
                            <span>{user.total_deals} deal{user.total_deals !== 1 ? 's' : ''}</span>
                          </>
                        )}
                        {user.role === 'CREATOR' && user.total_earnings! > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-3 w-3" />
                              <span>${(user.total_earnings! / 100).toFixed(2)} earned</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsUserModalOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {user.kyc_status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setUserAction({
                            user_id: user.id,
                            action: 'verify',
                            reason: ''
                          });
                          setIsActionModalOpen(true);
                        }}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setUserAction({
                          user_id: user.id,
                          action: 'suspend',
                          reason: ''
                        });
                        setIsActionModalOpen(true);
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Email:</span> {selectedUser.email}</div>
                    <div><span className="font-medium">Name:</span> {selectedUser.first_name} {selectedUser.last_name}</div>
                    <div><span className="font-medium">Role:</span> {selectedUser.role}</div>
                    <div><span className="font-medium">Country:</span> {selectedUser.country || 'Not specified'}</div>
                    <div><span className="font-medium">KYC Status:</span> {selectedUser.kyc_status}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Activity Statistics</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium">Joined:</span> {formatDate(selectedUser.created_at)}</div>
                    <div><span className="font-medium">Last Active:</span> {formatDate(selectedUser.last_active || selectedUser.updated_at)}</div>
                    <div><span className="font-medium">Total Deals:</span> {selectedUser.total_deals || 0}</div>
                    {selectedUser.role === 'BRAND' && (
                      <div><span className="font-medium">Projects:</span> {selectedUser.total_projects || 0}</div>
                    )}
                    {selectedUser.role === 'CREATOR' && (
                      <div><span className="font-medium">Total Earnings:</span> ${((selectedUser.total_earnings || 0) / 100).toFixed(2)}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Account Details</h3>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">User ID:</span> {selectedUser.id}</div>
                  <div><span className="font-medium">Stripe Account:</span> {selectedUser.stripe_account_id || 'Not connected'}</div>
                  <div><span className="font-medium">Created:</span> {formatDate(selectedUser.created_at)}</div>
                  <div><span className="font-medium">Updated:</span> {formatDate(selectedUser.updated_at)}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Action</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Action</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'verify', label: 'Verify KYC', variant: 'default' },
                  { value: 'reject', label: 'Reject KYC', variant: 'destructive' },
                  { value: 'suspend', label: 'Suspend', variant: 'secondary' },
                  { value: 'activate', label: 'Activate', variant: 'default' }
                ].map(action => (
                  <Button
                    key={action.value}
                    variant={userAction.action === action.value ? action.variant as any : 'outline'}
                    size="sm"
                    onClick={() => setUserAction({ ...userAction, action: action.value as any })}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="action-reason">Reason*</Label>
              <Textarea
                id="action-reason"
                value={userAction.reason}
                onChange={(e) => setUserAction({ ...userAction, reason: e.target.value })}
                placeholder="Please provide a reason for this action..."
                rows={3}
                disabled={actionLoading}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsActionModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUserAction}
                disabled={actionLoading || !userAction.reason.trim()}
                variant={userAction.action === 'delete' ? 'destructive' : 'default'}
              >
                {actionLoading ? 'Processing...' : `${userAction.action.charAt(0).toUpperCase() + userAction.action.slice(1)} User`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
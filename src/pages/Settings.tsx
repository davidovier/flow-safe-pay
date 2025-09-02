import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User, CreditCard, Shield, Bell, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { KYCVerificationForm } from '@/components/kyc/KYCVerificationForm';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { userProfile, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: userProfile?.first_name || '',
    last_name: userProfile?.last_name || '',
    country: userProfile?.country || '',
  });
  const [deleteData, setDeleteData] = useState({
    confirmEmail: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await updateProfile(formData);
    } finally {
      setLoading(false);
    }
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success' as any;
      case 'pending': return 'warning' as any;
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleDeleteAccount = async () => {
    if (!userProfile?.id) return;

    setDeleteLoading(true);
    try {
      const { error } = await deleteAccount(
        deleteData.confirmEmail,
        deleteData.reason
      );

      if (error) {
        throw error;
      }

      // Account deleted successfully - navigate to home
      navigate('/');
    } catch (error) {
      // Error handling is already done in the AuthContext
      console.error('Delete account error:', error);
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
      setDeleteData({ confirmEmail: '', reason: '' });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and account details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Account Type</p>
                <p className="text-sm text-muted-foreground">
                  You are registered as a {userProfile?.role?.toLowerCase()}
                </p>
              </div>
              <Badge variant="outline">{userProfile?.role}</Badge>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={userProfile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Contact support to change your email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={formData.country} onValueChange={(value) => setFormData({...formData, country: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="JP">Japan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment & KYC Status
            </CardTitle>
            <CardDescription>
              Manage your payment settings and verification status.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">KYC Verification</p>
                <p className="text-sm text-muted-foreground">
                  Required for receiving payments
                </p>
              </div>
              <Badge variant={getKycStatusColor(userProfile?.kyc_status || 'pending')}>
                {userProfile?.kyc_status || 'Pending'}
              </Badge>
            </div>

            {userProfile?.kyc_status !== 'verified' && (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm">
                  <strong>Action Required:</strong> Complete your KYC verification to receive payments.
                  You'll be redirected to Stripe to provide required information.
                </p>
                <Dialog open={isKYCModalOpen} onOpenChange={setIsKYCModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-3" size="sm">
                      Complete Verification
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                    <KYCVerificationForm 
                      onSuccess={() => {
                        setIsKYCModalOpen(false);
                        window.location.reload(); // Refresh to update KYC status
                      }}
                      onClose={() => setIsKYCModalOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security and privacy settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-muted-foreground">
                  Last updated: Never
                </p>
              </div>
              <Button variant="outline" size="sm">
                Change Password
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <Button variant="outline" size="sm">
                Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive updates about your deals and payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about deals and payments
                </p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone - Delete Account */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">
                    This will permanently delete your account, including:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• All personal information and profile data</li>
                    <li>• Complete deal and transaction history</li>
                    <li>• All projects, contracts, and deliverables</li>
                    <li>• Payment information (Stripe accounts remain with Stripe)</li>
                    <li>• All associated files and documents</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Note:</strong> You cannot delete your account if you have active funded deals. 
                    Please complete or resolve all deals first.
                  </p>
                </div>
              </div>
            </div>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Account
                  </DialogTitle>
                  <DialogDescription className="text-left">
                    This action is permanent and cannot be undone. All your data will be permanently deleted 
                    in compliance with GDPR regulations.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirm-email">
                      Confirm your email address to continue
                    </Label>
                    <Input
                      id="confirm-email"
                      type="email"
                      placeholder={userProfile?.email}
                      value={deleteData.confirmEmail}
                      onChange={(e) => setDeleteData({...deleteData, confirmEmail: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delete-reason">
                      Why are you deleting your account? (optional)
                    </Label>
                    <Textarea
                      id="delete-reason"
                      placeholder="Help us improve FlowPay by sharing why you're leaving..."
                      value={deleteData.reason}
                      onChange={(e) => setDeleteData({...deleteData, reason: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      <strong>Data Protection Notice:</strong> Your account deletion is GDPR compliant. 
                      All personal data will be permanently deleted and audit logs will be anonymized. 
                      <strong>Important:</strong> Due to security limitations, your login credentials may remain 
                      in the authentication system, but your account will be completely empty. 
                      You can create a new account with the same email after deletion.
                    </p>
                  </div>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeleteData({ confirmEmail: '', reason: '' });
                    }}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteData.confirmEmail !== userProfile?.email}
                  >
                    {deleteLoading ? 'Deleting...' : 'Delete Forever'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
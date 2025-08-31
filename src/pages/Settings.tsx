import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, User, CreditCard, Shield, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { userProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: userProfile?.first_name || '',
    last_name: userProfile?.last_name || '',
    country: userProfile?.country || '',
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
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
                <Button className="mt-3" size="sm">
                  Complete Verification
                </Button>
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
      </div>
    </div>
  );
}
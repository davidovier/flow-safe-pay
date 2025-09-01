import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  FileText,
  ArrowLeft,
  RefreshCcw,
  Upload,
  Eye,
  Calendar,
  User,
  Home,
  CreditCard
} from 'lucide-react';
import { KYCVerificationForm } from '@/components/kyc/KYCVerificationForm';

interface KYCApplication {
  id: string;
  status: 'pending' | 'verified' | 'rejected' | 'incomplete';
  created_at: string;
  updated_at: string;
  rejection_reason?: string;
  personal_info?: any;
  address_info?: any;
  business_info?: any;
  documents?: any;
  additional_info?: any;
}

export default function KYCStatus() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [kycApplication, setKycApplication] = useState<KYCApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);

  useEffect(() => {
    fetchKYCStatus();
  }, [userProfile]);

  const fetchKYCStatus = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      // First try to fetch from kyc_applications table
      const { data: applicationData, error: applicationError } = await supabase
        .from('kyc_applications')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (applicationError && applicationError.code !== '42P01') {
        throw applicationError;
      }

      if (applicationData && applicationData.length > 0) {
        setKycApplication(applicationData[0]);
      } else if (!applicationError) {
        // Table exists but no application found
        setKycApplication(null);
      }
      // If table doesn't exist (42P01), we'll just show status from user profile

    } catch (error) {
      console.error('Error fetching KYC status:', error);
      toast({
        title: 'Error',
        description: 'Failed to load KYC status. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'destructive';
      case 'incomplete': return 'secondary';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return AlertCircle;
      case 'incomplete': return FileText;
      default: return Clock;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Your identity has been verified successfully. You can now receive payments.';
      case 'pending':
        return 'Your documents are being reviewed. This usually takes 1-3 business days.';
      case 'rejected':
        return 'Your application was rejected. Please review the feedback and resubmit.';
      case 'incomplete':
        return 'Your application is incomplete. Please provide the required information.';
      default:
        return 'Start your KYC verification to receive payments.';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const currentStatus = kycApplication?.status || userProfile?.kyc_status || 'incomplete';
  const StatusIcon = getStatusIcon(currentStatus);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/settings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>

      {/* Main Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg ${
                currentStatus === 'verified' ? 'bg-success/10' :
                currentStatus === 'pending' ? 'bg-warning/10' :
                currentStatus === 'rejected' ? 'bg-destructive/10' :
                'bg-muted'
              }`}>
                <StatusIcon className={`h-6 w-6 ${
                  currentStatus === 'verified' ? 'text-success' :
                  currentStatus === 'pending' ? 'text-warning' :
                  currentStatus === 'rejected' ? 'text-destructive' :
                  'text-muted-foreground'
                }`} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  KYC Verification Status
                  <Badge variant={getStatusColor(currentStatus) as any}>
                    {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {getStatusDescription(currentStatus)}
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchKYCStatus}
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Timeline */}
          {kycApplication && (
            <div className="space-y-4">
              <h3 className="font-semibold">Application Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div className="text-sm">
                    <span className="font-medium">Application Submitted</span>
                    <div className="text-muted-foreground">
                      {formatDate(kycApplication.created_at)}
                    </div>
                  </div>
                </div>
                
                {kycApplication.updated_at !== kycApplication.created_at && (
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      currentStatus === 'verified' ? 'bg-success' :
                      currentStatus === 'rejected' ? 'bg-destructive' :
                      'bg-warning'
                    }`}></div>
                    <div className="text-sm">
                      <span className="font-medium">Status Updated</span>
                      <div className="text-muted-foreground">
                        {formatDate(kycApplication.updated_at)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {currentStatus === 'rejected' && kycApplication?.rejection_reason && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h3 className="font-medium text-destructive mb-2">Rejection Reason</h3>
              <p className="text-sm text-destructive">
                {kycApplication.rejection_reason}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {(currentStatus === 'incomplete' || currentStatus === 'rejected') && (
              <Dialog open={isKYCModalOpen} onOpenChange={setIsKYCModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    {currentStatus === 'rejected' ? 'Resubmit Application' : 'Start Verification'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-0">
                  <KYCVerificationForm 
                    onSuccess={() => {
                      setIsKYCModalOpen(false);
                      fetchKYCStatus();
                    }}
                    onClose={() => setIsKYCModalOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}

            {userProfile?.role === 'CREATOR' && currentStatus !== 'verified' && (
              <Button variant="outline" onClick={() => navigate('/payouts')}>
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Settings
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Application Details */}
      {kycApplication && (
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>
              Review your submitted information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            {kycApplication.personal_info && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <h3 className="font-medium">Personal Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {kycApplication.personal_info.first_name} {kycApplication.personal_info.last_name}
                  </div>
                  <div>
                    <span className="font-medium">Date of Birth:</span> {kycApplication.personal_info.date_of_birth}
                  </div>
                  <div>
                    <span className="font-medium">Nationality:</span> {kycApplication.personal_info.nationality}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {kycApplication.personal_info.phone_number}
                  </div>
                </div>
              </div>
            )}

            {/* Address Information */}
            {kycApplication.address_info && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <h3 className="font-medium">Address Information</h3>
                </div>
                <div className="text-sm">
                  <p>{kycApplication.address_info.address_line_1}</p>
                  {kycApplication.address_info.address_line_2 && (
                    <p>{kycApplication.address_info.address_line_2}</p>
                  )}
                  <p>
                    {kycApplication.address_info.city}, {kycApplication.address_info.state} {kycApplication.address_info.postal_code}
                  </p>
                  <p>{kycApplication.address_info.country}</p>
                </div>
              </div>
            )}

            {/* Business Information */}
            {kycApplication.business_info && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <h3 className="font-medium">Business Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Business Name:</span> {kycApplication.business_info.business_name}
                  </div>
                  <div>
                    <span className="font-medium">Business Type:</span> {kycApplication.business_info.business_type}
                  </div>
                  {kycApplication.business_info.tax_id && (
                    <div>
                      <span className="font-medium">Tax ID:</span> {kycApplication.business_info.tax_id}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Document Status */}
            {kycApplication.documents && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <h3 className="font-medium">Documents</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {kycApplication.documents.id_document && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      ID Document Uploaded
                    </div>
                  )}
                  {kycApplication.documents.address_proof && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Address Proof Uploaded
                    </div>
                  )}
                  {kycApplication.documents.selfie && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Selfie Uploaded
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Required Documents</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Government-issued photo ID</li>
                <li>Proof of address (utility bill, bank statement)</li>
                <li>Selfie with ID document</li>
                {userProfile?.role === 'BRAND' && <li>Business registration documents</li>}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Processing Time</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Verification usually takes 1-3 business days</li>
                <li>Complex cases may take up to 7 days</li>
                <li>You'll be notified via email when complete</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
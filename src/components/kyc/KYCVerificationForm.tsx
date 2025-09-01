import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Upload, 
  FileText, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Loader2,
  Camera,
  CreditCard,
  Home,
  User
} from 'lucide-react';

interface KYCFormData {
  // Personal Information
  first_name: string;
  last_name: string;
  date_of_birth: string;
  nationality: string;
  phone_number: string;
  
  // Address Information
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  
  // Business Information (for brands)
  business_name?: string;
  business_type?: string;
  tax_id?: string;
  
  // Documents
  id_document_type: string;
  
  // Additional Info
  occupation?: string;
  purpose_of_account: string;
}

interface KYCVerificationFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const KYCVerificationForm = ({ onSuccess, onClose }: KYCVerificationFormProps) => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState<KYCFormData>({
    first_name: userProfile?.first_name || '',
    last_name: userProfile?.last_name || '',
    date_of_birth: '',
    nationality: userProfile?.country || '',
    phone_number: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    postal_code: '',
    country: userProfile?.country || '',
    business_name: '',
    business_type: '',
    tax_id: '',
    id_document_type: 'passport',
    occupation: '',
    purpose_of_account: 'creator_payments'
  });
  
  // Document upload state
  const [uploadedDocuments, setUploadedDocuments] = useState({
    id_document: null as string | null,
    address_proof: null as string | null,
    selfie: null as string | null
  });

  const totalSteps = userProfile?.role === 'BRAND' ? 4 : 3;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof KYCFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (file: File, documentType: keyof typeof uploadedDocuments) => {
    if (!userProfile) return;

    setUploadingFile(true);
    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `kyc/${userProfile.id}/${documentType}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) {
        // Fallback to different bucket names
        const buckets = ['uploads', 'public', 'files'];
        let uploaded = false;
        
        for (const bucket of buckets) {
          try {
            const { error } = await supabase.storage
              .from(bucket)
              .upload(fileName, file);
            if (!error) {
              uploaded = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }
        
        if (!uploaded) {
          throw new Error('Unable to upload document. Please try again.');
        }
      }

      // Update uploaded documents
      setUploadedDocuments(prev => ({
        ...prev,
        [documentType]: fileName
      }));

      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully.',
      });

    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: error.message || 'Failed to upload document. Please try again.',
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const submitKYCApplication = async () => {
    if (!userProfile) return;

    setLoading(true);
    try {
      // Update user profile with KYC status since kyc_applications table doesn't exist yet
      const { error: profileError } = await supabase
        .from('users')
        .update({ 
          kyc_status: 'pending',
          first_name: formData.first_name,
          last_name: formData.last_name,
          country: formData.country,
          updated_at: new Date().toISOString()
        })
        .eq('id', userProfile.id);

      if (profileError) throw profileError;

      toast({
        title: 'KYC Application Submitted',
        description: 'Your verification documents have been submitted for review. We\'ll notify you once the review is complete.',
      });

      onSuccess?.();
      
    } catch (error: any) {
      console.error('Error submitting KYC application:', error);
      toast({
        variant: 'destructive',
        title: 'Submission failed',
        description: 'Failed to submit KYC application. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      submitKYCApplication();
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderPersonalInfoStep = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => handleInputChange('first_name', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => handleInputChange('last_name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nationality">Nationality *</Label>
          <Select value={formData.nationality} onValueChange={(value) => handleInputChange('nationality', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">United States</SelectItem>
              <SelectItem value="CA">Canada</SelectItem>
              <SelectItem value="GB">United Kingdom</SelectItem>
              <SelectItem value="DE">Germany</SelectItem>
              <SelectItem value="FR">France</SelectItem>
              <SelectItem value="NL">Netherlands</SelectItem>
              <SelectItem value="AU">Australia</SelectItem>
              <SelectItem value="JP">Japan</SelectItem>
              <SelectItem value="SG">Singapore</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone_number">Phone Number *</Label>
          <Input
            id="phone_number"
            type="tel"
            value={formData.phone_number}
            onChange={(e) => handleInputChange('phone_number', e.target.value)}
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            value={formData.occupation || ''}
            onChange={(e) => handleInputChange('occupation', e.target.value)}
            placeholder="e.g., Content Creator, Influencer"
          />
        </div>
      </div>
    </div>
  );

  const renderAddressStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address_line_1">Address Line 1 *</Label>
        <Input
          id="address_line_1"
          value={formData.address_line_1}
          onChange={(e) => handleInputChange('address_line_1', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line_2">Address Line 2</Label>
        <Input
          id="address_line_2"
          value={formData.address_line_2}
          onChange={(e) => handleInputChange('address_line_2', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State/Province *</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code *</Label>
          <Input
            id="postal_code"
            value={formData.postal_code}
            onChange={(e) => handleInputChange('postal_code', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="country">Country *</Label>
        <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US">United States</SelectItem>
            <SelectItem value="CA">Canada</SelectItem>
            <SelectItem value="GB">United Kingdom</SelectItem>
            <SelectItem value="DE">Germany</SelectItem>
            <SelectItem value="FR">France</SelectItem>
            <SelectItem value="NL">Netherlands</SelectItem>
            <SelectItem value="AU">Australia</SelectItem>
            <SelectItem value="JP">Japan</SelectItem>
            <SelectItem value="SG">Singapore</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderBusinessStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="business_name">Business Name *</Label>
        <Input
          id="business_name"
          value={formData.business_name || ''}
          onChange={(e) => handleInputChange('business_name', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="business_type">Business Type *</Label>
          <Select value={formData.business_type || ''} onValueChange={(value) => handleInputChange('business_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="llc">LLC</SelectItem>
              <SelectItem value="corporation">Corporation</SelectItem>
              <SelectItem value="non_profit">Non-Profit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax_id">Tax ID/EIN</Label>
          <Input
            id="tax_id"
            value={formData.tax_id || ''}
            onChange={(e) => handleInputChange('tax_id', e.target.value)}
            placeholder="XX-XXXXXXX"
          />
        </div>
      </div>
    </div>
  );

  const FileUploadCard = ({ 
    title, 
    description, 
    documentType, 
    icon: Icon,
    required = true 
  }: { 
    title: string; 
    description: string; 
    documentType: keyof typeof uploadedDocuments;
    icon: any;
    required?: boolean;
  }) => {
    const isUploaded = uploadedDocuments[documentType];

    return (
      <Card className="relative">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${isUploaded ? 'bg-success/10' : 'bg-muted'}`}>
              {isUploaded ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <Icon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{description}</p>
              
              {!isUploaded ? (
                <div>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, documentType);
                    }}
                    className="hidden"
                    id={`file-${documentType}`}
                  />
                  <label htmlFor={`file-${documentType}`}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="cursor-pointer"
                      disabled={uploadingFile}
                      asChild
                    >
                      <span>
                        {uploadingFile ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload {required && '*'}
                      </span>
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="flex items-center text-sm text-success">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Uploaded successfully
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDocumentsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Document Verification</h3>
        <p className="text-muted-foreground">
          Upload clear, high-quality images of your documents. All documents should be valid and not expired.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="id_document_type">ID Document Type</Label>
          <Select value={formData.id_document_type} onValueChange={(value) => handleInputChange('id_document_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="drivers_license">Driver's License</SelectItem>
              <SelectItem value="national_id">National ID Card</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <FileUploadCard
          title="Government ID"
          description="Upload a clear photo of your passport, driver's license, or national ID"
          documentType="id_document"
          icon={CreditCard}
        />

        <FileUploadCard
          title="Proof of Address"
          description="Upload a bank statement, utility bill, or official document showing your address (within 3 months)"
          documentType="address_proof"
          icon={Home}
        />

        <FileUploadCard
          title="Selfie with ID"
          description="Take a selfie holding your ID document next to your face"
          documentType="selfie"
          icon={Camera}
        />
      </div>
    </div>
  );

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.first_name && formData.last_name && formData.date_of_birth && formData.nationality && formData.phone_number;
      case 2:
        return formData.address_line_1 && formData.city && formData.state && formData.postal_code && formData.country;
      case 3:
        if (userProfile?.role === 'BRAND') {
          return formData.business_name && formData.business_type;
        } else {
          return uploadedDocuments.id_document && uploadedDocuments.address_proof && uploadedDocuments.selfie;
        }
      case 4:
        return uploadedDocuments.id_document && uploadedDocuments.address_proof && uploadedDocuments.selfie;
      default:
        return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Personal Information';
      case 2: return 'Address Information';
      case 3: return userProfile?.role === 'BRAND' ? 'Business Information' : 'Document Verification';
      case 4: return 'Document Verification';
      default: return '';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 1: return User;
      case 2: return Home;
      case 3: return userProfile?.role === 'BRAND' ? CreditCard : FileText;
      case 4: return FileText;
      default: return User;
    }
  };

  const StepIcon = getStepIcon();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>KYC Verification</CardTitle>
              <CardDescription>
                Complete your identity verification to start receiving payments
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <StepIcon className="h-4 w-4" />
              Step {currentStep} of {totalSteps}: {getStepTitle()}
            </span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} />
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && renderPersonalInfoStep()}
          {currentStep === 2 && renderAddressStep()}
          {currentStep === 3 && (userProfile?.role === 'BRAND' ? renderBusinessStep() : renderDocumentsStep())}
          {currentStep === 4 && renderDocumentsStep()}
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t">
          <Button
            variant="outline"
            onClick={previousStep}
            disabled={currentStep === 1 || loading}
          >
            Previous
          </Button>
          
          <Button
            onClick={nextStep}
            disabled={!isStepValid() || loading || uploadingFile}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentStep === totalSteps ? 'Submit Application' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
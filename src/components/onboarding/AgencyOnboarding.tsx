import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building, Users, Target, CheckCircle } from 'lucide-react';

interface AgencyOnboardingProps {
  onComplete: (agencyData: AgencySetupData) => void;
  loading?: boolean;
}

export interface AgencySetupData {
  agencyName: string;
  companyInfo: {
    website?: string;
    address: string;
    phone?: string;
    description: string;
  };
  expectedCreators: number;
  focusAreas: string[];
  businessModel: 'COMMISSION' | 'RETAINER' | 'HYBRID';
}

const FOCUS_AREAS = [
  'Fashion & Beauty',
  'Lifestyle',
  'Tech & Gaming',
  'Food & Travel',
  'Fitness & Health',
  'Business & Finance',
  'Entertainment',
  'Education',
  'Art & Design',
  'Music',
];

const CREATOR_RANGES = [
  { value: 5, label: '1-5 creators' },
  { value: 15, label: '6-15 creators' },
  { value: 25, label: '16-25 creators' },
  { value: 50, label: '26-50 creators' },
  { value: 100, label: '50+ creators' },
];

export function AgencyOnboarding({ onComplete, loading = false }: AgencyOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AgencySetupData>({
    agencyName: '',
    companyInfo: {
      website: '',
      address: '',
      phone: '',
      description: '',
    },
    expectedCreators: 5,
    focusAreas: [],
    businessModel: 'COMMISSION',
  });

  const totalSteps = 4;

  const updateFormData = (updates: Partial<AgencySetupData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
    }));
  };

  const updateCompanyInfo = (updates: Partial<AgencySetupData['companyInfo']>) => {
    setFormData(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        ...updates,
      },
    }));
  };

  const toggleFocusArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.agencyName.trim().length >= 2;
      case 2:
        return formData.companyInfo.address.trim().length >= 5 && 
               formData.companyInfo.description.trim().length >= 10;
      case 3:
        return formData.focusAreas.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building className="h-16 w-16 mx-auto text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Welcome to FlowPay Agency</h2>
              <p className="text-gray-600">
                Let's set up your agency to manage creators and scale your business
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="agencyName" className="text-base font-medium">
                  Agency Name *
                </Label>
                <Input
                  id="agencyName"
                  value={formData.agencyName}
                  onChange={(e) => updateFormData({ agencyName: e.target.value })}
                  placeholder="Enter your agency name"
                  className="h-12 text-base"
                />
              </div>
              
              <div>
                <Label htmlFor="website" className="text-base font-medium">
                  Website (Optional)
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.companyInfo.website}
                  onChange={(e) => updateCompanyInfo({ website: e.target.value })}
                  placeholder="https://youragency.com"
                  className="h-12 text-base"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Building className="h-16 w-16 mx-auto text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Company Information</h2>
              <p className="text-gray-600">
                Tell us more about your agency to customize your experience
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="address" className="text-base font-medium">
                  Business Address *
                </Label>
                <Textarea
                  id="address"
                  value={formData.companyInfo.address}
                  onChange={(e) => updateCompanyInfo({ address: e.target.value })}
                  placeholder="Enter your business address"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-base font-medium">
                  Phone Number (Optional)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.companyInfo.phone}
                  onChange={(e) => updateCompanyInfo({ phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="h-12 text-base"
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-base font-medium">
                  Agency Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.companyInfo.description}
                  onChange={(e) => updateCompanyInfo({ description: e.target.value })}
                  placeholder="Describe your agency, services, and what makes you unique..."
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  This will be shown to potential creators and clients
                </p>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Focus Areas & Scale</h2>
              <p className="text-gray-600">
                Help us understand your agency's specialization and size
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">
                  What content areas do you focus on? *
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {FOCUS_AREAS.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleFocusArea(area)}
                      className={`p-3 text-sm rounded-lg border-2 transition-all ${
                        formData.focusAreas.includes(area)
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Select all that apply ({formData.focusAreas.length} selected)
                </p>
              </div>
              
              <div>
                <Label htmlFor="expectedCreators" className="text-base font-medium">
                  How many creators do you plan to manage?
                </Label>
                <Select
                  value={formData.expectedCreators.toString()}
                  onValueChange={(value) => updateFormData({ expectedCreators: parseInt(value) })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATOR_RANGES.map((range) => (
                      <SelectItem key={range.value} value={range.value.toString()}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto text-purple-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Business Model</h2>
              <p className="text-gray-600">
                Choose your preferred pricing structure for creator partnerships
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    value: 'COMMISSION' as const,
                    title: 'Commission-Based',
                    description: 'Earn a percentage of each deal completed',
                    recommended: true,
                  },
                  {
                    value: 'RETAINER' as const,
                    title: 'Monthly Retainer',
                    description: 'Fixed monthly fee per managed creator',
                    recommended: false,
                  },
                  {
                    value: 'HYBRID' as const,
                    title: 'Hybrid Model',
                    description: 'Combination of retainer + performance bonuses',
                    recommended: false,
                  },
                ].map((model) => (
                  <button
                    key={model.value}
                    type="button"
                    onClick={() => updateFormData({ businessModel: model.value })}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      formData.businessModel === model.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{model.title}</span>
                      {model.recommended && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{model.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-all ${
                  i + 1 <= currentStep ? 'bg-purple-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {renderStep()}
        
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1 || loading}
          >
            Back
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentStep === totalSteps ? 'Complete Setup' : 'Continue'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Handshake, Users, Zap, Globe, TrendingUp, Shield, CheckCircle, ArrowRight, Star, Mail, ExternalLink, Target, Briefcase, Code, Heart } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Partnerships() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    partnershipType: '',
    description: ''
  });

  const partnershipTypes = [
    {
      id: 'integration',
      title: 'Technology Integration',
      icon: Code,
      description: 'Connect your platform with FlowPay through our APIs and create seamless experiences for users.',
      benefits: [
        'Technical integration support',
        'Co-marketing opportunities',
        'Revenue sharing models',
        'Priority API access',
        'Joint product development'
      ],
      examples: ['Payment processors', 'Analytics platforms', 'CRM systems', 'Marketing tools']
    },
    {
      id: 'agency',
      title: 'Agency Partnership',
      icon: Briefcase,
      description: 'Partner with FlowPay to offer escrow services to your clients and earn commission on every deal.',
      benefits: [
        'Commission on referred deals',
        'Branded partner portal',
        'Marketing materials',
        'Dedicated support team',
        'Training and certification'
      ],
      examples: ['Influencer agencies', 'Marketing agencies', 'Talent management', 'Creative agencies']
    },
    {
      id: 'affiliate',
      title: 'Affiliate Program',
      icon: Target,
      description: 'Promote FlowPay to your audience and earn commission for every successful referral.',
      benefits: [
        'Up to 20% commission',
        'Custom referral links',
        'Real-time analytics',
        'Marketing assets',
        'Monthly payouts'
      ],
      examples: ['Content creators', 'Business bloggers', 'Industry experts', 'Course creators']
    },
    {
      id: 'strategic',
      title: 'Strategic Alliance',
      icon: Handshake,
      description: 'Form strategic partnerships to expand market reach and create new business opportunities.',
      benefits: [
        'Joint go-to-market strategies',
        'Shared resources',
        'Cross-promotion opportunities',
        'Product integration',
        'Market expansion'
      ],
      examples: ['Enterprise software', 'Financial services', 'E-commerce platforms', 'SaaS companies']
    }
  ];

  const currentPartners = [
    {
      name: 'Stripe',
      type: 'Payment Processing',
      description: 'Secure payment infrastructure powering all FlowPay transactions',
      logo: '💳',
      partnership: 'Technology Integration'
    },
    {
      name: 'Creator Economy Report',
      type: 'Industry Research',
      description: 'Annual creator economy insights and market analysis',
      logo: '📊',
      partnership: 'Strategic Alliance'
    },
    {
      name: 'TalentX Agency',
      type: 'Talent Management',
      description: 'Leading creator talent agency with 500+ influencers',
      logo: '🌟',
      partnership: 'Agency Partnership'
    },
    {
      name: 'Social Media Examiner',
      type: 'Education & Training',
      description: 'Premier social media marketing education platform',
      logo: '📚',
      partnership: 'Affiliate Program'
    },
    {
      name: 'CreatorOS',
      type: 'Creator Tools',
      description: 'All-in-one creator management and analytics platform',
      logo: '⚡',
      partnership: 'Technology Integration'
    },
    {
      name: 'Brand Collective',
      type: 'Brand Network',
      description: 'Network of 200+ brands seeking creator partnerships',
      logo: '🏢',
      partnership: 'Strategic Alliance'
    }
  ];

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Grow Your Revenue',
      description: 'Earn commission and revenue share from successful partnerships and integrations.'
    },
    {
      icon: Users,
      title: 'Expand Your Network',
      description: 'Connect with industry leaders and expand your professional network.'
    },
    {
      icon: Zap,
      title: 'Access New Markets',
      description: 'Reach new audiences and markets through our growing partner ecosystem.'
    },
    {
      icon: Shield,
      title: 'Trusted Platform',
      description: 'Partner with a secure, reliable platform trusted by thousands of users.'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Access our international user base spanning 50+ countries.'
    },
    {
      icon: Heart,
      title: 'Dedicated Support',
      description: 'Get dedicated partnership support and resources for success.'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Partnership application submitted:', formData);
    // Handle form submission
  };

  const getTabClasses = (tabName: string) => 
    `px-6 py-3 rounded-lg font-medium transition-colors ${
      activeTab === tabName 
        ? 'bg-green-600 text-white' 
        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
    }`;

  return (
    <>
      <SEOHead
        title="Partnerships - FlowPay"
        description="Partner with FlowPay to grow your business. Explore agency partnerships, affiliate programs, integrations, and strategic alliances."
        keywords={['partnerships', 'affiliate program', 'agency partnership', 'integration', 'collaboration']}
        url="/partnerships"
        type="website"
      />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="text-sm text-gray-600">
                Join 50+ partners worldwide
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
              <Handshake className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Partnerships</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Join our growing ecosystem of partners and unlock new opportunities 
              for growth, revenue, and success in the creator economy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setActiveTab('apply')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Handshake className="h-4 w-4 mr-2" />
                Become a Partner
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('partners')}
                className="border-green-200"
              >
                View Current Partners
              </Button>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Why Partner with FlowPay?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
                      <benefit.icon className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex flex-wrap gap-2 justify-center bg-white p-2 rounded-2xl shadow-sm">
              <button 
                onClick={() => setActiveTab('overview')}
                className={getTabClasses('overview')}
              >
                Partnership Types
              </button>
              <button 
                onClick={() => setActiveTab('partners')}
                className={getTabClasses('partners')}
              >
                Current Partners
              </button>
              <button 
                onClick={() => setActiveTab('apply')}
                className={getTabClasses('apply')}
              >
                Apply Now
              </button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Partnership Types */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">Partnership Opportunities</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Choose the partnership model that best fits your business and goals.
                  </p>
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                  {partnershipTypes.map((type) => (
                    <Card key={type.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                            <type.icon className="h-5 w-5 text-green-600" />
                          </div>
                          <h3 className="text-xl font-semibold">{type.title}</h3>
                        </div>
                        <p className="text-gray-600 mb-6">{type.description}</p>
                        
                        <div className="mb-6">
                          <h4 className="font-medium mb-3 text-gray-900">Benefits:</h4>
                          <div className="space-y-2">
                            {type.benefits.map((benefit, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <h4 className="font-medium mb-3 text-gray-900">Examples:</h4>
                          <div className="flex flex-wrap gap-2">
                            {type.examples.map((example, index) => (
                              <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {example}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => setActiveTab('apply')}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Apply for {type.title}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Current Partners */}
            {activeTab === 'partners' && (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">Our Partners</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    We're proud to work with industry-leading companies and organizations.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {currentPartners.map((partner, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{partner.logo}</div>
                            <div>
                              <h3 className="font-semibold">{partner.name}</h3>
                              <p className="text-sm text-gray-600">{partner.type}</p>
                            </div>
                          </div>
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                            {partner.partnership}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm">{partner.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-gray-500 mb-6">
                    Want to see your company featured here?
                  </p>
                  <Button 
                    onClick={() => setActiveTab('apply')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Apply for Partnership
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Application Form */}
            {activeTab === 'apply' && (
              <div className="space-y-8">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">Apply for Partnership</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Tell us about your business and how you'd like to partner with FlowPay.
                  </p>
                </div>
                
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Form */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium mb-2">Full Name *</label>
                              <Input
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Your full name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Email Address *</label>
                              <Input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="your.email@company.com"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Company/Organization *</label>
                            <Input
                              name="company"
                              value={formData.company}
                              onChange={handleInputChange}
                              placeholder="Your company name"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Partnership Type *</label>
                            <select
                              name="partnershipType"
                              value={formData.partnershipType}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              required
                            >
                              <option value="">Select partnership type</option>
                              <option value="integration">Technology Integration</option>
                              <option value="agency">Agency Partnership</option>
                              <option value="affiliate">Affiliate Program</option>
                              <option value="strategic">Strategic Alliance</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium mb-2">Tell Us About Your Business *</label>
                            <Textarea
                              name="description"
                              value={formData.description}
                              onChange={handleInputChange}
                              placeholder="Describe your business, your audience, and how you'd like to partner with FlowPay..."
                              rows={6}
                              required
                            />
                          </div>

                          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                            <Mail className="h-4 w-4 mr-2" />
                            Submit Application
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sidebar Info */}
                  <div className="space-y-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <Star className="h-5 w-5 text-yellow-500" />
                          What Happens Next?
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">1</div>
                            <div>
                              <div className="font-medium">Application Review</div>
                              <div className="text-gray-600">We'll review your application within 3-5 business days</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">2</div>
                            <div>
                              <div className="font-medium">Discovery Call</div>
                              <div className="text-gray-600">Schedule a call to discuss partnership details</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-medium text-green-600">3</div>
                            <div>
                              <div className="font-medium">Partnership Agreement</div>
                              <div className="text-gray-600">Finalize terms and start collaborating</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-4">Questions?</h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Need help with your application or have questions about our partnership program?
                        </p>
                        <div className="space-y-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full border-green-200"
                            onClick={() => navigate('/contact')}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Contact Us
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full border-green-200"
                            onClick={() => window.open('mailto:partnerships@flowpay.com')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            partnerships@flowpay.com
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
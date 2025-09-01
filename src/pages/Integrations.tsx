import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Zap, CheckCircle, ArrowRight, ExternalLink, Star, Download, Code, Smartphone, Monitor, CreditCard, Users, Mail, Calendar, BarChart, Shield } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Integrations() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Integrations', count: 24 },
    { id: 'payment', name: 'Payment', count: 6 },
    { id: 'communication', name: 'Communication', count: 5 },
    { id: 'analytics', name: 'Analytics', count: 4 },
    { id: 'productivity', name: 'Productivity', count: 5 },
    { id: 'social', name: 'Social Media', count: 4 }
  ];

  const integrations = [
    {
      id: 1,
      name: 'Stripe',
      category: 'payment',
      description: 'Secure payment processing with global coverage and instant transfers',
      icon: CreditCard,
      status: 'native',
      popularity: 'High',
      features: ['Instant payments', 'Global coverage', 'Advanced security', 'Real-time reporting'],
      setupTime: '5 min',
      pricing: 'Free',
      isPopular: true
    },
    {
      id: 2,
      name: 'Slack',
      category: 'communication',
      description: 'Get real-time notifications about deals, payments, and milestones',
      icon: Mail,
      status: 'available',
      popularity: 'High',
      features: ['Deal notifications', 'Payment alerts', 'Team collaboration', 'Custom channels'],
      setupTime: '2 min',
      pricing: 'Free',
      isPopular: true
    },
    {
      id: 3,
      name: 'Google Analytics',
      category: 'analytics',
      description: 'Track campaign performance and ROI with detailed analytics',
      icon: BarChart,
      status: 'available',
      popularity: 'Medium',
      features: ['Campaign tracking', 'ROI analysis', 'Custom dashboards', 'Goal conversion'],
      setupTime: '10 min',
      pricing: 'Free'
    },
    {
      id: 4,
      name: 'Zapier',
      category: 'productivity',
      description: 'Connect FlowPay with 5000+ apps through automated workflows',
      icon: Zap,
      status: 'available',
      popularity: 'High',
      features: ['5000+ app connections', 'Custom workflows', 'Automated tasks', 'Multi-step zaps'],
      setupTime: '15 min',
      pricing: 'Free tier available',
      isPopular: true
    },
    {
      id: 5,
      name: 'Discord',
      category: 'communication',
      description: 'Community notifications and creator collaboration tools',
      icon: Users,
      status: 'available',
      popularity: 'Medium',
      features: ['Community alerts', 'Role management', 'Custom bots', 'Voice integration'],
      setupTime: '5 min',
      pricing: 'Free'
    },
    {
      id: 6,
      name: 'Calendly',
      category: 'productivity',
      description: 'Schedule creator meetings and brand consultations seamlessly',
      icon: Calendar,
      status: 'available',
      popularity: 'Medium',
      features: ['Meeting scheduling', 'Time zone sync', 'Calendar integration', 'Automated reminders'],
      setupTime: '8 min',
      pricing: 'Free tier available'
    },
    {
      id: 7,
      name: 'Instagram Business',
      category: 'social',
      description: 'Track campaign performance and audience engagement metrics',
      icon: Smartphone,
      status: 'beta',
      popularity: 'High',
      features: ['Engagement metrics', 'Audience insights', 'Story analytics', 'Post performance'],
      setupTime: '12 min',
      pricing: 'Free',
      isPopular: true
    },
    {
      id: 8,
      name: 'YouTube Analytics',
      category: 'social',
      description: 'Monitor video performance and subscriber growth for sponsored content',
      icon: Monitor,
      status: 'beta',
      popularity: 'High',
      features: ['Video analytics', 'Subscriber tracking', 'Revenue insights', 'Audience demographics'],
      setupTime: '10 min',
      pricing: 'Free',
      isPopular: true
    }
  ];

  const filteredIntegrations = activeCategory === 'all' 
    ? integrations 
    : integrations.filter(integration => integration.category === activeCategory);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'native':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'available':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'beta':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'coming-soon':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'native':
        return 'Built-in';
      case 'available':
        return 'Available';
      case 'beta':
        return 'Beta';
      case 'coming-soon':
        return 'Coming Soon';
      default:
        return status;
    }
  };

  return (
    <>
      <SEOHead
        title="Integrations - FlowPay"
        description="Connect FlowPay with your favorite tools. Seamless integrations with payment processors, communication tools, analytics platforms, and more."
        keywords={['integrations', 'API', 'Stripe', 'Slack', 'Zapier', 'automation', 'workflows']}
        url="/integrations"
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
                24 integrations available
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-6">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Integrations</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Connect FlowPay with your favorite tools to streamline your workflow 
              and boost productivity across your entire creator business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/api-docs')} className="bg-purple-600 hover:bg-purple-700">
                <Code className="h-4 w-4 mr-2" />
                View API Docs
              </Button>
              <Button variant="outline" className="border-purple-200">
                <Download className="h-4 w-4 mr-2" />
                Browse Templates
              </Button>
            </div>
          </div>

          {/* Popular Integrations */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Popular Integrations</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {integrations.filter(i => i.isPopular).slice(0, 4).map((integration) => (
                <Card key={integration.id} className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200">
                  <CardContent className="p-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-4">
                      <integration.icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{integration.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{integration.description}</p>
                    <div className="flex justify-center mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                        {getStatusText(integration.status)}
                      </span>
                    </div>
                    <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex flex-wrap gap-2 justify-center bg-white p-2 rounded-2xl shadow-sm">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  {category.name} ({category.count})
                </button>
              ))}
            </div>
          </div>

          {/* All Integrations */}
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => (
                <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                          <integration.icon className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{integration.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                            {getStatusText(integration.status)}
                          </span>
                        </div>
                      </div>
                      {integration.isPopular && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-xs font-medium">Popular</span>
                        </div>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4">{integration.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Setup time:</span>
                        <span className="font-medium">{integration.setupTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pricing:</span>
                        <span className="font-medium text-green-600">{integration.pricing}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2 text-sm text-gray-700">Key Features:</h4>
                      <div className="space-y-1">
                        {integration.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            {feature}
                          </div>
                        ))}
                        {integration.features.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{integration.features.length - 3} more features
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                        disabled={integration.status === 'coming-soon'}
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        {integration.status === 'coming-soon' ? 'Coming Soon' : 'Connect'}
                      </Button>
                      <Button size="sm" variant="outline" className="border-purple-200">
                        Learn More
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Integration CTA */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-0">
              <CardContent className="p-8 text-center">
                <Code className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Need a Custom Integration?</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Can't find the integration you need? Our flexible API and webhook system 
                  make it easy to build custom connections with any platform.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/api-docs')} className="bg-purple-600 hover:bg-purple-700">
                    <Code className="h-4 w-4 mr-2" />
                    Explore API
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/contact')} className="border-purple-200">
                    <Mail className="h-4 w-4 mr-2" />
                    Request Integration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enterprise Features */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-4">Enterprise Integrations</h2>
                  <p className="text-gray-600">
                    Advanced integration features for teams and enterprise customers
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Single Sign-On (SSO)</h3>
                        <p className="text-sm text-gray-600">SAML and OAuth integration with your identity provider</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Custom Webhooks</h3>
                        <p className="text-sm text-gray-600">Real-time data sync with your internal systems</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Bulk Operations API</h3>
                        <p className="text-sm text-gray-600">Process thousands of transactions programmatically</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Priority Support</h3>
                        <p className="text-sm text-gray-600">Dedicated integration support and faster response times</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">White-label Options</h3>
                        <p className="text-sm text-gray-600">Embed FlowPay functionality in your own platform</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <h3 className="font-medium">Custom Rate Limits</h3>
                        <p className="text-sm text-gray-600">Higher API limits for high-volume operations</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-8">
                  <Button onClick={() => navigate('/contact')} className="bg-blue-600 hover:bg-blue-700">
                    Contact Sales
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
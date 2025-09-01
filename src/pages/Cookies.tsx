import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Cookie, Settings, Shield, BarChart, Users, Clock, Globe, Mail } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Cookies() {
  const navigate = useNavigate();

  const cookieTypes = [
    {
      id: 'essential-cookies',
      title: 'Essential Cookies',
      icon: Shield,
      required: true,
      description: 'These cookies are necessary for the website to function and cannot be switched off.',
      examples: [
        'Session management and user authentication',
        'Security features and fraud prevention',
        'Basic website functionality and navigation',
        'Load balancing and server routing'
      ]
    },
    {
      id: 'analytics-cookies',
      title: 'Analytics Cookies',
      icon: BarChart,
      required: false,
      description: 'Help us understand how visitors interact with our website by collecting anonymous information.',
      examples: [
        'Google Analytics for website usage statistics',
        'Performance monitoring and error tracking',
        'A/B testing and feature usage analytics',
        'User journey and conversion tracking'
      ]
    },
    {
      id: 'functional-cookies',
      title: 'Functional Cookies',
      icon: Settings,
      required: false,
      description: 'Enable enhanced functionality and personalization features.',
      examples: [
        'Language preferences and regional settings',
        'Theme preferences (light/dark mode)',
        'Dashboard customization settings',
        'Recently viewed items and favorites'
      ]
    },
    {
      id: 'marketing-cookies',
      title: 'Marketing Cookies',
      icon: Users,
      required: false,
      description: 'Used to track visitors across websites for advertising purposes.',
      examples: [
        'Social media integration and sharing',
        'Advertising campaign effectiveness',
        'Retargeting and remarketing campaigns',
        'Cross-platform user identification'
      ]
    }
  ];

  const sections = [
    {
      id: 'what-are-cookies',
      title: 'What Are Cookies?',
      icon: Cookie,
      content: [
        {
          subtitle: 'Definition',
          text: 'Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners.'
        },
        {
          subtitle: 'How They Work',
          text: 'When you visit FlowPay, our servers send cookies to your browser, which stores them on your device. These cookies are then sent back to our servers on subsequent visits to help us recognize you.'
        },
        {
          subtitle: 'Types of Data',
          text: 'Cookies may contain information such as user preferences, login status, shopping cart contents, and analytics data. They do not contain personal information unless you explicitly provide it.'
        }
      ]
    },
    {
      id: 'cookies-we-use',
      title: 'Cookies We Use',
      icon: Settings,
      content: [
        {
          subtitle: 'First-Party Cookies',
          text: 'These are cookies set directly by FlowPay to provide core functionality, remember your preferences, and analyze how you use our services.'
        },
        {
          subtitle: 'Third-Party Cookies',
          text: 'We also use cookies from trusted partners like Google Analytics, Stripe, and social media platforms to enhance your experience and provide additional functionality.'
        },
        {
          subtitle: 'Session vs Persistent',
          text: 'Session cookies are temporary and deleted when you close your browser. Persistent cookies remain on your device for a specified period or until manually deleted.'
        }
      ]
    },
    {
      id: 'legal-basis',
      title: 'Legal Basis for Cookie Use',
      icon: Shield,
      content: [
        {
          subtitle: 'Consent',
          text: 'For non-essential cookies, we rely on your explicit consent obtained through our cookie banner. You can withdraw consent at any time through your browser settings.'
        },
        {
          subtitle: 'Legitimate Interest',
          text: 'Essential cookies are used based on our legitimate interest in providing secure, functional services. These are necessary for basic website operation.'
        },
        {
          subtitle: 'Compliance',
          text: 'Our cookie practices comply with GDPR, CCPA, and other applicable privacy regulations. We regularly review and update our practices to maintain compliance.'
        }
      ]
    },
    {
      id: 'retention-periods',
      title: 'Cookie Retention Periods',
      icon: Clock,
      content: [
        {
          subtitle: 'Session Cookies',
          text: 'Deleted immediately when you close your browser session. Used for temporary functionality like maintaining login status during your visit.'
        },
        {
          subtitle: 'Short-term Cookies',
          text: 'Retained for 24 hours to 30 days. Used for features like remembering recent activity and maintaining security settings.'
        },
        {
          subtitle: 'Long-term Cookies',
          text: 'Retained for up to 2 years with your consent. Used for preferences, analytics, and providing personalized experiences across visits.'
        },
        {
          subtitle: 'Automatic Deletion',
          text: 'All cookies are automatically deleted when their expiration period ends or when you clear your browser cache.'
        }
      ]
    },
    {
      id: 'managing-cookies',
      title: 'Managing Your Cookie Preferences',
      icon: Settings,
      content: [
        {
          subtitle: 'Browser Settings',
          text: 'You can control cookies through your browser settings. Most browsers allow you to refuse cookies, delete existing cookies, and set preferences for specific websites.'
        },
        {
          subtitle: 'Our Cookie Preferences',
          text: 'Use our cookie preference center to customize which types of cookies you allow. You can access this through the cookie banner or our privacy settings.'
        },
        {
          subtitle: 'Opt-out Tools',
          text: 'For advertising cookies, you can use industry opt-out tools like the Digital Advertising Alliance\'s opt-out page or Google\'s Ad Settings.'
        },
        {
          subtitle: 'Impact of Disabling',
          text: 'Disabling certain cookies may affect website functionality. Essential cookies cannot be disabled as they are necessary for basic operation.'
        }
      ]
    },
    {
      id: 'third-party-cookies',
      title: 'Third-Party Cookie Partners',
      icon: Globe,
      content: [
        {
          subtitle: 'Google Analytics',
          text: 'We use Google Analytics to understand website usage patterns. Google may use this data across their services. You can opt out using Google\'s browser add-on.'
        },
        {
          subtitle: 'Stripe',
          text: 'Payment processing cookies from Stripe help prevent fraud and ensure secure transactions. These are essential for payment functionality.'
        },
        {
          subtitle: 'Social Media',
          text: 'Social media widgets may set cookies to track interactions. These enable sharing functionality and social login features.'
        },
        {
          subtitle: 'Customer Support',
          text: 'Live chat and support tools may use cookies to maintain conversation history and provide better assistance.'
        }
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title="Cookie Policy - FlowPay"
        description="Learn about how FlowPay uses cookies to improve your experience. Understand your cookie choices and privacy options."
        keywords={['cookie policy', 'cookies', 'privacy settings', 'website tracking']}
        url="/cookies"
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
                Last updated: December 1, 2024
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-6">
              <Cookie className="h-8 w-8 text-orange-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookie Policy</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Learn how FlowPay uses cookies to enhance your browsing experience 
              and provide better services.
            </p>
          </div>

          {/* Cookie Types Overview */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Types of Cookies We Use</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {cookieTypes.map((type) => (
                <Card key={type.id} className={`${type.required ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          type.required ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <type.icon className={`h-5 w-5 ${type.required ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{type.title}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            type.required 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {type.required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{type.description}</p>
                    <div className="space-y-2">
                      <div className="font-medium text-sm text-gray-700">Examples:</div>
                      <ul className="space-y-1">
                        {type.examples.map((example, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cookie Management */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-8 text-center">
                <Settings className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Manage Your Cookie Preferences</h2>
                <p className="text-gray-600 mb-6">
                  You have full control over how cookies are used on our website. 
                  Customize your preferences to match your privacy needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-green-600 hover:bg-green-700">
                    Cookie Preferences
                  </Button>
                  <Button variant="outline" className="border-green-200">
                    Browser Settings Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto space-y-16">
            {sections.map((section, index) => (
              <div key={section.id} id={section.id} className="scroll-mt-24">
                <Card className="overflow-hidden">
                  <CardContent className="p-8">
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <section.icon className="h-5 w-5 text-orange-600" />
                      </div>
                      {section.title}
                    </h2>
                    <div className="space-y-6">
                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          <h3 className="font-semibold mb-2 text-gray-900">{item.subtitle}</h3>
                          <p className="text-gray-600 leading-relaxed">{item.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-0">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-600 rounded-2xl mb-6">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Questions About Cookies?</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  If you have questions about our use of cookies or need help managing 
                  your cookie preferences, we're here to assist.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/contact')} className="bg-orange-600 hover:bg-orange-700">
                    Contact Support
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('mailto:privacy@flowpay.com')}
                    className="border-orange-200"
                  >
                    Email: privacy@flowpay.com
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table of Contents */}
          <div className="fixed right-8 top-1/2 transform -translate-y-1/2 hidden lg:block">
            <div className="bg-white rounded-2xl shadow-lg border p-6 max-w-xs">
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-gray-500">
                Contents
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-sm text-gray-600 hover:text-orange-600 hover:bg-orange-50 px-2 py-1 rounded transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield, Eye, Lock, Users, Clock, Globe, FileText, Mail } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Privacy() {
  const navigate = useNavigate();

  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      icon: FileText,
      content: [
        {
          subtitle: 'Account Information',
          text: 'When you create a FlowPay account, we collect your name, email address, phone number, and payment information. For KYC compliance, we may also collect government-issued ID and business documentation.'
        },
        {
          subtitle: 'Transaction Data',
          text: 'We collect information about your transactions, including deal details, payment amounts, communication with other users, and dispute resolution data.'
        },
        {
          subtitle: 'Technical Information',
          text: 'We automatically collect device information, IP addresses, browser type, and usage analytics to improve our service and ensure security.'
        },
        {
          subtitle: 'Communications',
          text: 'We store messages sent through our platform, support tickets, and any communication related to your FlowPay account.'
        }
      ]
    },
    {
      id: 'information-usage',
      title: 'How We Use Your Information',
      icon: Eye,
      content: [
        {
          subtitle: 'Service Provision',
          text: 'We use your information to provide escrow services, process payments, facilitate communication between creators and brands, and maintain your account.'
        },
        {
          subtitle: 'Security & Compliance',
          text: 'Your information helps us prevent fraud, comply with financial regulations, conduct KYC/AML checks, and maintain platform security.'
        },
        {
          subtitle: 'Communication',
          text: 'We use your contact information to send transaction updates, security alerts, product announcements, and respond to your inquiries.'
        },
        {
          subtitle: 'Improvement',
          text: 'We analyze usage data to improve our services, develop new features, and provide personalized experiences.'
        }
      ]
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing',
      icon: Users,
      content: [
        {
          subtitle: 'Transaction Counterparties',
          text: 'We share necessary information with creators and brands involved in transactions to facilitate deal completion and communication.'
        },
        {
          subtitle: 'Service Providers',
          text: 'We share information with trusted partners including Stripe (payment processing), AWS (hosting), and other service providers who help operate our platform.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'We may disclose information when required by law, to respond to legal process, or to protect our rights and the rights of our users.'
        },
        {
          subtitle: 'Business Transfers',
          text: 'In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of the transaction.'
        }
      ]
    },
    {
      id: 'data-protection',
      title: 'Data Protection & Security',
      icon: Shield,
      content: [
        {
          subtitle: 'Encryption',
          text: 'All sensitive data is encrypted in transit and at rest using industry-standard encryption protocols (AES-256).'
        },
        {
          subtitle: 'Access Controls',
          text: 'We implement strict access controls, ensuring only authorized personnel can access user data on a need-to-know basis.'
        },
        {
          subtitle: 'Regular Audits',
          text: 'Our security practices undergo regular third-party audits and we maintain SOC 2 Type II certification.'
        },
        {
          subtitle: 'Incident Response',
          text: 'We have comprehensive incident response procedures and will notify users of any security breaches as required by law.'
        }
      ]
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      icon: Clock,
      content: [
        {
          subtitle: 'Active Accounts',
          text: 'We retain account information and transaction history for active accounts to provide ongoing service and support.'
        },
        {
          subtitle: 'Inactive Accounts',
          text: 'For inactive accounts, we retain essential information for 7 years to comply with financial regulations and resolve potential disputes.'
        },
        {
          subtitle: 'Marketing Data',
          text: 'Marketing communications data is retained until you unsubscribe or request deletion, whichever comes first.'
        },
        {
          subtitle: 'Legal Requirements',
          text: 'Some data may be retained longer when required by law, for legal proceedings, or to resolve disputes.'
        }
      ]
    },
    {
      id: 'your-rights',
      title: 'Your Rights',
      icon: Lock,
      content: [
        {
          subtitle: 'Access & Portability',
          text: 'You can access your personal data and request a copy in a machine-readable format at any time through your account settings.'
        },
        {
          subtitle: 'Correction',
          text: 'You can update your account information directly through our platform or by contacting our support team.'
        },
        {
          subtitle: 'Deletion',
          text: 'You can request deletion of your account and associated data, subject to legal retention requirements and ongoing transaction obligations.'
        },
        {
          subtitle: 'Restriction & Objection',
          text: 'You can restrict or object to certain data processing activities, including marketing communications and non-essential analytics.'
        }
      ]
    },
    {
      id: 'international-transfers',
      title: 'International Data Transfers',
      icon: Globe,
      content: [
        {
          subtitle: 'Global Service',
          text: 'FlowPay operates globally and may transfer data across borders to provide our services to users worldwide.'
        },
        {
          subtitle: 'Adequate Protection',
          text: 'All international data transfers are protected by adequate safeguards, including Standard Contractual Clauses and adequacy decisions.'
        },
        {
          subtitle: 'Regional Compliance',
          text: 'We comply with regional data protection laws including GDPR, CCPA, and other applicable privacy regulations.'
        }
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title="Privacy Policy - FlowPay"
        description="Learn how FlowPay protects your privacy and handles your personal information. Transparent privacy practices for creators and brands."
        keywords={['privacy policy', 'data protection', 'privacy rights', 'data security']}
        url="/privacy"
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Your privacy matters to us. This policy explains how we collect, use, and protect 
              your personal information when you use FlowPay.
            </p>
          </div>

          {/* Quick Overview */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <Eye className="h-6 w-6 text-blue-600" />
                  Privacy at a Glance
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Minimal Data Collection</div>
                        <div className="text-sm text-gray-600">We only collect what's necessary for our service</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Your Data, Your Control</div>
                        <div className="text-sm text-gray-600">Access, modify, or delete your data anytime</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Bank-Grade Security</div>
                        <div className="text-sm text-gray-600">Enterprise-level encryption and protection</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">No Data Selling</div>
                        <div className="text-sm text-gray-600">We never sell your personal information</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Transparent Practices</div>
                        <div className="text-sm text-gray-600">Clear communication about data usage</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Global Compliance</div>
                        <div className="text-sm text-gray-600">GDPR, CCPA, and other privacy law compliance</div>
                      </div>
                    </div>
                  </div>
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
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <section.icon className="h-5 w-5 text-blue-600" />
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
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Questions About Privacy?</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  If you have any questions about this Privacy Policy or our data practices, 
                  our Privacy Team is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/contact')} className="bg-blue-600 hover:bg-blue-700">
                    Contact Privacy Team
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('mailto:privacy@flowpay.com')}
                    className="border-blue-200"
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
                    className="block text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
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
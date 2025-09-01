import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Scale, Shield, Users, AlertTriangle, Clock, FileText, DollarSign, Mail } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Terms() {
  const navigate = useNavigate();

  const sections = [
    {
      id: 'acceptance-terms',
      title: 'Acceptance of Terms',
      icon: Scale,
      content: [
        {
          subtitle: 'Agreement to Terms',
          text: 'By accessing or using FlowPay services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using our services.'
        },
        {
          subtitle: 'Modifications',
          text: 'FlowPay reserves the right to revise these terms at any time without notice. By using this service, you agree to be bound by the current version of these Terms of Service.'
        },
        {
          subtitle: 'Eligibility',
          text: 'You must be at least 18 years old and capable of forming legally binding contracts to use FlowPay. By using our service, you represent and warrant that you meet these requirements.'
        }
      ]
    },
    {
      id: 'account-registration',
      title: 'Account Registration & Use',
      icon: Users,
      content: [
        {
          subtitle: 'Account Creation',
          text: 'To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.'
        },
        {
          subtitle: 'Account Security',
          text: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use.'
        },
        {
          subtitle: 'Account Types',
          text: 'FlowPay offers Creator and Brand accounts. Each account type has specific rights and responsibilities as outlined in our platform guidelines and these terms.'
        },
        {
          subtitle: 'KYC Requirements',
          text: 'All users must complete Know Your Customer (KYC) verification as required by applicable financial regulations. Failure to complete KYC may result in account limitations or suspension.'
        }
      ]
    },
    {
      id: 'escrow-services',
      title: 'Escrow Services',
      icon: Shield,
      content: [
        {
          subtitle: 'Service Description',
          text: 'FlowPay provides escrow services where funds are held securely until agreed-upon deliverables are completed and approved. We facilitate transactions between Creators and Brands.'
        },
        {
          subtitle: 'Payment Processing',
          text: 'All payments are processed through Stripe Connect. Funds are held in escrow until milestone completion or dispute resolution. Processing fees apply as outlined in our pricing.'
        },
        {
          subtitle: 'Deal Lifecycle',
          text: 'Deals progress through defined stages: Draft, Funded, Active, and Completed. Each stage has specific requirements and timelines that all parties must adhere to.'
        },
        {
          subtitle: 'Auto-Release',
          text: 'Funds automatically release to Creators upon milestone approval or after the specified review period (default 5 business days) unless a dispute is raised.'
        }
      ]
    },
    {
      id: 'user-responsibilities',
      title: 'User Responsibilities',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Compliance',
          text: 'Users must comply with all applicable laws and regulations, including but not limited to consumer protection, privacy, and financial services laws in their jurisdiction.'
        },
        {
          subtitle: 'Prohibited Activities',
          text: 'Users may not engage in fraudulent activities, money laundering, terrorist financing, or any other illegal activities. Violation may result in immediate account termination.'
        },
        {
          subtitle: 'Content Standards',
          text: 'All content shared through FlowPay must be lawful, truthful, and respectful. Users are prohibited from sharing inappropriate, offensive, or copyrighted content without permission.'
        },
        {
          subtitle: 'Professional Conduct',
          text: 'Users must maintain professional standards in all interactions. Harassment, discrimination, or abusive behavior towards other users is strictly prohibited.'
        }
      ]
    },
    {
      id: 'fees-payments',
      title: 'Fees and Payments',
      icon: DollarSign,
      content: [
        {
          subtitle: 'Service Fees',
          text: 'FlowPay charges service fees as outlined in our pricing page. Fees are clearly disclosed before transaction initiation and are non-refundable except as required by law.'
        },
        {
          subtitle: 'Payment Methods',
          text: 'We accept payments via credit cards, bank transfers, and other methods supported by Stripe. All payments are subject to verification and fraud prevention measures.'
        },
        {
          subtitle: 'Currency',
          text: 'Transactions are processed in USD unless otherwise specified. Currency conversion fees may apply for international transactions as determined by payment processors.'
        },
        {
          subtitle: 'Refunds',
          text: 'Refunds are processed according to our refund policy and may be subject to processing fees. Disputes are handled through our resolution process or relevant payment processor procedures.'
        }
      ]
    },
    {
      id: 'disputes-resolution',
      title: 'Disputes and Resolution',
      icon: FileText,
      content: [
        {
          subtitle: 'Dispute Process',
          text: 'Disputes between users are handled through our internal resolution process. We provide mediation services and may make binding decisions on disputed transactions.'
        },
        {
          subtitle: 'Evidence Requirements',
          text: 'All dispute claims must be supported by relevant evidence including contracts, communications, and deliverables. False claims may result in account penalties.'
        },
        {
          subtitle: 'Resolution Timeline',
          text: 'We aim to resolve disputes within 10-14 business days of receiving complete documentation from all parties involved in the dispute.'
        },
        {
          subtitle: 'Final Decisions',
          text: 'FlowPay\'s dispute resolution decisions are final and binding. Users agree to accept these decisions as a condition of using our escrow services.'
        }
      ]
    },
    {
      id: 'intellectual-property',
      title: 'Intellectual Property',
      icon: Shield,
      content: [
        {
          subtitle: 'Platform Rights',
          text: 'FlowPay retains all rights to our platform, technology, and trademarks. Users are granted a limited license to use our services in accordance with these terms.'
        },
        {
          subtitle: 'User Content',
          text: 'Users retain ownership of their original content but grant FlowPay necessary licenses to operate our services, including displaying, storing, and transmitting user content.'
        },
        {
          subtitle: 'Infringement Claims',
          text: 'We respond to valid copyright and trademark infringement claims in accordance with applicable law. Users found to repeatedly infringe may have their accounts terminated.'
        },
        {
          subtitle: 'Third-Party Content',
          text: 'Users are responsible for ensuring they have rights to use any third-party content in their deliverables and must indemnify FlowPay against infringement claims.'
        }
      ]
    },
    {
      id: 'termination',
      title: 'Account Termination',
      icon: Clock,
      content: [
        {
          subtitle: 'Termination Rights',
          text: 'FlowPay may terminate or suspend accounts immediately for violations of these terms, fraudulent activity, or as required by law, with or without notice.'
        },
        {
          subtitle: 'User Termination',
          text: 'Users may terminate their accounts at any time, subject to completion of ongoing transactions and compliance with data retention requirements.'
        },
        {
          subtitle: 'Effect of Termination',
          text: 'Upon termination, users lose access to services, but obligations related to completed transactions and these terms survive termination.'
        },
        {
          subtitle: 'Data Handling',
          text: 'After termination, we retain data as required by law and our privacy policy. Users may request data deletion subject to legal and regulatory requirements.'
        }
      ]
    },
    {
      id: 'limitation-liability',
      title: 'Limitation of Liability',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Service Availability',
          text: 'FlowPay provides services "as is" without warranties. We do not guarantee uninterrupted service availability and are not liable for service interruptions.'
        },
        {
          subtitle: 'Financial Limits',
          text: 'Our liability is limited to the fees paid for services in the 12 months preceding the claim. We are not liable for indirect, consequential, or punitive damages.'
        },
        {
          subtitle: 'User Interactions',
          text: 'FlowPay is not responsible for disputes between users, quality of deliverables, or outcomes of business relationships formed through our platform.'
        },
        {
          subtitle: 'Force Majeure',
          text: 'We are not liable for delays or failures caused by circumstances beyond our reasonable control, including natural disasters, government actions, or technical failures.'
        }
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title="Terms of Service - FlowPay"
        description="FlowPay Terms of Service. Understanding your rights and responsibilities when using our creator-brand marketplace and escrow platform."
        keywords={['terms of service', 'user agreement', 'legal terms', 'escrow terms']}
        url="/terms"
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
              <Scale className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Please read these terms carefully. By using FlowPay, you agree to be bound 
              by these terms and conditions.
            </p>
          </div>

          {/* Key Points Overview */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                  Key Points
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Escrow Protection</div>
                        <div className="text-sm text-gray-600">Funds held securely until deliverables are approved</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">KYC Required</div>
                        <div className="text-sm text-gray-600">Identity verification required for all users</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Auto-Release</div>
                        <div className="text-sm text-gray-600">Funds release automatically after approval period</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Dispute Resolution</div>
                        <div className="text-sm text-gray-600">Structured process for handling conflicts</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Professional Standards</div>
                        <div className="text-sm text-gray-600">Maintain respectful business conduct</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-amber-600 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Clear Fee Structure</div>
                        <div className="text-sm text-gray-600">Transparent pricing with no hidden costs</div>
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
                <h2 className="text-2xl font-semibold mb-4">Questions About Our Terms?</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  If you have any questions about these Terms of Service or need clarification 
                  on any aspect of our platform, we're here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/contact')} className="bg-blue-600 hover:bg-blue-700">
                    Contact Legal Team
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('mailto:legal@flowpay.com')}
                    className="border-blue-200"
                  >
                    Email: legal@flowpay.com
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
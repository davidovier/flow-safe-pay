import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield, Lock, Eye, Server, Users, CheckCircle, AlertTriangle, Award, FileText, Mail } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Security() {
  const navigate = useNavigate();

  const securityFeatures = [
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'All sensitive data encrypted with AES-256 encryption in transit and at rest'
    },
    {
      icon: Shield,
      title: 'Multi-Factor Authentication',
      description: 'Optional 2FA protection for enhanced account security'
    },
    {
      icon: Eye,
      title: 'Real-time Monitoring',
      description: '24/7 security monitoring and automated threat detection'
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Enterprise-grade cloud infrastructure with regular security audits'
    },
    {
      icon: Users,
      title: 'Identity Verification',
      description: 'Comprehensive KYC/KYB verification for all platform users'
    },
    {
      icon: CheckCircle,
      title: 'Fraud Prevention',
      description: 'Advanced fraud detection and prevention systems'
    }
  ];

  const certifications = [
    {
      name: 'SOC 2 Type II',
      description: 'Annual compliance audit for security, availability, and confidentiality',
      status: 'Certified'
    },
    {
      name: 'PCI DSS Level 1',
      description: 'Highest level of payment card industry security certification',
      status: 'Compliant'
    },
    {
      name: 'ISO 27001',
      description: 'International standard for information security management',
      status: 'In Progress'
    },
    {
      name: 'GDPR',
      description: 'Full compliance with European data protection regulations',
      status: 'Compliant'
    }
  ];

  const sections = [
    {
      id: 'data-protection',
      title: 'Data Protection & Privacy',
      icon: Shield,
      content: [
        {
          subtitle: 'Data Encryption',
          text: 'All sensitive data is encrypted using industry-standard AES-256 encryption both in transit (TLS 1.3) and at rest. Private keys are stored in secure hardware security modules (HSMs).'
        },
        {
          subtitle: 'Access Controls',
          text: 'We implement strict role-based access controls with principle of least privilege. All access is logged and monitored, with regular access reviews and automatic de-provisioning.'
        },
        {
          subtitle: 'Data Minimization',
          text: 'We only collect and process data that is necessary for providing our services. Personal information is anonymized or pseudonymized where possible.'
        },
        {
          subtitle: 'Right to Privacy',
          text: 'Users have full control over their data with rights to access, correct, delete, and export their information in compliance with GDPR, CCPA, and other privacy regulations.'
        }
      ]
    },
    {
      id: 'payment-security',
      title: 'Payment Security',
      icon: Lock,
      content: [
        {
          subtitle: 'PCI Compliance',
          text: 'FlowPay maintains PCI DSS Level 1 compliance, the highest level of payment card industry security certification, ensuring your payment data is handled with utmost security.'
        },
        {
          subtitle: 'Secure Payment Processing',
          text: 'All payments are processed through Stripe, a certified PCI Service Provider. We never store complete credit card information on our servers.'
        },
        {
          subtitle: 'Fraud Detection',
          text: 'Advanced machine learning algorithms monitor all transactions for suspicious activity, with real-time fraud scoring and automated risk assessment.'
        },
        {
          subtitle: 'Escrow Protection',
          text: 'Funds are held in segregated escrow accounts with FDIC insurance protection, ensuring your money is safe throughout the transaction process.'
        }
      ]
    },
    {
      id: 'infrastructure-security',
      title: 'Infrastructure Security',
      icon: Server,
      content: [
        {
          subtitle: 'Cloud Security',
          text: 'Our infrastructure is hosted on enterprise-grade cloud platforms with 99.99% uptime SLA, automatic backups, and disaster recovery capabilities.'
        },
        {
          subtitle: 'Network Security',
          text: 'Multi-layered network security including firewalls, intrusion detection systems, DDoS protection, and virtual private clouds with network segmentation.'
        },
        {
          subtitle: 'Regular Updates',
          text: 'All systems and dependencies are regularly updated and patched. We maintain a comprehensive vulnerability management program with automated scanning.'
        },
        {
          subtitle: 'Backup & Recovery',
          text: 'Automated daily backups with point-in-time recovery capabilities. All backups are encrypted and stored in geographically distributed locations.'
        }
      ]
    },
    {
      id: 'identity-verification',
      title: 'Identity Verification',
      icon: Users,
      content: [
        {
          subtitle: 'KYC/KYB Process',
          text: 'All users undergo comprehensive Know Your Customer (KYC) and Know Your Business (KYB) verification using government-issued documents and business registration verification.'
        },
        {
          subtitle: 'Document Verification',
          text: 'Advanced document verification technology checks for authenticity, tampering, and validity of submitted identification documents.'
        },
        {
          subtitle: 'Ongoing Monitoring',
          text: 'Continuous monitoring of user accounts for suspicious activity, with regular re-verification requirements for high-value transactions.'
        },
        {
          subtitle: 'AML Compliance',
          text: 'Full Anti-Money Laundering (AML) compliance with automated screening against global sanctions lists and politically exposed persons (PEP) databases.'
        }
      ]
    },
    {
      id: 'incident-response',
      title: 'Incident Response & Monitoring',
      icon: AlertTriangle,
      content: [
        {
          subtitle: '24/7 Monitoring',
          text: 'Round-the-clock security monitoring with automated alerting and immediate response capabilities for any security events or anomalies.'
        },
        {
          subtitle: 'Incident Response Plan',
          text: 'Comprehensive incident response procedures with defined roles, escalation paths, and communication protocols to minimize impact and recovery time.'
        },
        {
          subtitle: 'Threat Intelligence',
          text: 'Integration with leading threat intelligence platforms to proactively identify and defend against emerging security threats.'
        },
        {
          subtitle: 'Transparency',
          text: 'In the unlikely event of a security incident, we provide timely and transparent communication to affected users and regulatory authorities as required by law.'
        }
      ]
    },
    {
      id: 'compliance-audits',
      title: 'Compliance & Auditing',
      icon: Award,
      content: [
        {
          subtitle: 'Regular Audits',
          text: 'Annual third-party security audits and penetration testing by certified security professionals to identify and address any vulnerabilities.'
        },
        {
          subtitle: 'Compliance Framework',
          text: 'We maintain compliance with multiple regulatory frameworks including SOC 2, PCI DSS, GDPR, CCPA, and other applicable financial services regulations.'
        },
        {
          subtitle: 'Employee Training',
          text: 'All employees undergo regular security awareness training, background checks, and sign comprehensive data protection agreements.'
        },
        {
          subtitle: 'Audit Trails',
          text: 'Complete audit trails for all system access, data modifications, and financial transactions with tamper-proof logging and long-term retention.'
        }
      ]
    }
  ];

  return (
    <>
      <SEOHead
        title="Security & Compliance - FlowPay"
        description="Learn about FlowPay's comprehensive security measures, compliance certifications, and data protection practices. Your security is our priority."
        keywords={['security', 'compliance', 'data protection', 'payment security', 'encryption']}
        url="/security"
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Security & Compliance</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Your security and privacy are our top priorities. Learn about our comprehensive 
              security measures and compliance certifications.
            </p>
          </div>

          {/* Security Features */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Security Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
                      <feature.icon className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <Award className="h-6 w-6 text-blue-600" />
                  Certifications & Compliance
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {certifications.map((cert, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        cert.status === 'Certified' || cert.status === 'Compliant' 
                          ? 'bg-green-500' 
                          : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{cert.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            cert.status === 'Certified' || cert.status === 'Compliant'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {cert.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{cert.description}</p>
                      </div>
                    </div>
                  ))}
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
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <section.icon className="h-5 w-5 text-green-600" />
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

          {/* Security Report */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-0">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Security Transparency</h2>
                    <p className="text-gray-600 mb-6">
                      We believe in transparency about our security practices. Access our 
                      security whitepaper and compliance reports.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button className="bg-green-600 hover:bg-green-700">
                        Security Whitepaper
                      </Button>
                      <Button variant="outline" className="border-green-200">
                        Compliance Reports
                      </Button>
                    </div>
                  </div>
                  <div className="text-center">
                    <FileText className="h-24 w-24 text-green-600 mx-auto mb-4 opacity-50" />
                    <div className="text-sm text-gray-500">
                      Updated quarterly with latest security measures
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Section */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-0">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-6">
                  <Mail className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold mb-4">Security Questions?</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Have questions about our security practices or want to report a security issue? 
                  Our security team is here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/contact')} className="bg-green-600 hover:bg-green-700">
                    Contact Security Team
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('mailto:security@flowpay.com')}
                    className="border-green-200"
                  >
                    Email: security@flowpay.com
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
                    className="block text-sm text-gray-600 hover:text-green-600 hover:bg-green-50 px-2 py-1 rounded transition-colors"
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
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, Image, FileText, Palette, Monitor, Smartphone, Printer, Copy, CheckCircle, ExternalLink, Mail, Users, BarChart, Globe, Award } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useState } from 'react';

export default function MediaKit() {
  const navigate = useNavigate();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const brandAssets = [
    {
      category: 'Logos',
      items: [
        { name: 'FlowPay Logo (Primary)', formats: ['PNG', 'SVG', 'PDF'], size: '2.1 MB', description: 'Primary logo with full color' },
        { name: 'FlowPay Logo (White)', formats: ['PNG', 'SVG', 'PDF'], size: '1.8 MB', description: 'White version for dark backgrounds' },
        { name: 'FlowPay Logo (Black)', formats: ['PNG', 'SVG', 'PDF'], size: '1.9 MB', description: 'Black version for light backgrounds' },
        { name: 'FlowPay Icon Only', formats: ['PNG', 'SVG', 'ICO'], size: '0.8 MB', description: 'Icon without text for compact usage' }
      ]
    },
    {
      category: 'Screenshots',
      items: [
        { name: 'Dashboard Overview', formats: ['PNG', 'JPG'], size: '3.2 MB', description: 'Main creator dashboard interface' },
        { name: 'Deal Creation Flow', formats: ['PNG', 'JPG'], size: '4.1 MB', description: 'Step-by-step deal creation process' },
        { name: 'Mobile App Interface', formats: ['PNG', 'JPG'], size: '2.8 MB', description: 'Mobile app screenshots collection' },
        { name: 'Analytics Dashboard', formats: ['PNG', 'JPG'], size: '3.5 MB', description: 'Revenue and performance analytics' }
      ]
    },
    {
      category: 'Brand Guidelines',
      items: [
        { name: 'Brand Style Guide', formats: ['PDF'], size: '8.5 MB', description: 'Complete brand guidelines and usage rules' },
        { name: 'Color Palette', formats: ['ASE', 'PDF'], size: '0.3 MB', description: 'Official FlowPay color palette' },
        { name: 'Typography Guide', formats: ['PDF'], size: '2.1 MB', description: 'Font specifications and usage guidelines' }
      ]
    }
  ];

  const companyStats = [
    { label: 'Active Users', value: '15,000+', icon: Users, color: 'text-blue-600' },
    { label: 'Total Volume Processed', value: '$50M+', icon: BarChart, color: 'text-green-600' },
    { label: 'Countries Supported', value: '25+', icon: Globe, color: 'text-purple-600' },
    { label: 'Platform Uptime', value: '99.9%', icon: Award, color: 'text-orange-600' }
  ];

  const colorPalette = [
    { name: 'Primary Blue', hex: '#3B82F6', rgb: 'rgb(59, 130, 246)', description: 'Main brand color' },
    { name: 'Secondary Purple', hex: '#8B5CF6', rgb: 'rgb(139, 92, 246)', description: 'Accent color' },
    { name: 'Success Green', hex: '#10B981', rgb: 'rgb(16, 185, 129)', description: 'Success states' },
    { name: 'Warning Orange', hex: '#F59E0B', rgb: 'rgb(245, 158, 11)', description: 'Warning states' },
    { name: 'Danger Red', hex: '#EF4444', rgb: 'rgb(239, 68, 68)', description: 'Error states' },
    { name: 'Neutral Gray', hex: '#6B7280', rgb: 'rgb(107, 114, 128)', description: 'Text and borders' }
  ];

  const usageGuidelines = [
    {
      title: 'Logo Usage',
      rules: [
        'Maintain minimum clear space equal to the height of the "F" in FlowPay',
        'Do not modify, distort, or recreate the logo',
        'Use the appropriate logo version for background contrast',
        'Minimum size: 24px height for digital, 0.5" for print'
      ]
    },
    {
      title: 'Color Usage',
      rules: [
        'Primary blue should be the dominant brand color',
        'Use purple as an accent color for highlights and CTAs',
        'Maintain sufficient contrast ratios for accessibility',
        'Avoid using colors outside the approved palette'
      ]
    },
    {
      title: 'Typography',
      rules: [
        'Primary font: Inter (headings and UI elements)',
        'Secondary font: System font stack for body text',
        'Maintain consistent hierarchy and spacing',
        'Use appropriate font weights for different contexts'
      ]
    }
  ];

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  return (
    <>
      <SEOHead
        title="Media Kit - FlowPay"
        description="Download FlowPay brand assets, logos, screenshots, and press materials. Everything you need to write about or feature FlowPay."
        keywords={['media kit', 'press kit', 'brand assets', 'logos', 'press materials']}
        url="/media-kit"
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
                Last updated: December 2024
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-6">
              <Image className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Media Kit</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Download FlowPay brand assets, company information, and press materials. 
              Everything you need to feature FlowPay in your content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Download className="h-4 w-4 mr-2" />
                Download All Assets
              </Button>
              <Button variant="outline" onClick={() => navigate('/contact')} className="border-indigo-200">
                <Mail className="h-4 w-4 mr-2" />
                Press Inquiries
              </Button>
            </div>
          </div>

          {/* Company Stats */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">FlowPay by the Numbers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {companyStats.map((stat, index) => (
                <Card key={index} className="text-center hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-4`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="text-3xl font-bold mb-2">{stat.value}</div>
                    <div className="text-gray-600">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Brand Assets */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Brand Assets</h2>
            {brandAssets.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">{category.category}</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.items.map((item, itemIndex) => (
                    <Card key={itemIndex} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                              <FileText className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{item.name}</h4>
                              <p className="text-sm text-gray-500">{item.size}</p>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.formats.map((format, formatIndex) => (
                            <span key={formatIndex} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {format}
                            </span>
                          ))}
                        </div>
                        <Button size="sm" className="w-full bg-indigo-600 hover:bg-indigo-700">
                          <Download className="h-3 w-3 mr-2" />
                          Download
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Color Palette */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Brand Colors</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {colorPalette.map((color, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div 
                      className="h-24 w-full"
                      style={{ backgroundColor: color.hex }}
                    ></div>
                    <div className="p-4">
                      <h4 className="font-semibold mb-2">{color.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{color.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono text-gray-700">{color.hex}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(color.hex, `hex-${index}`)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedItem === `hex-${index}` ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono text-gray-700">{color.rgb}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(color.rgb, `rgb-${index}`)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedItem === `rgb-${index}` ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Usage Guidelines */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Usage Guidelines</h2>
            <div className="space-y-6">
              {usageGuidelines.map((guideline, index) => (
                <Card key={index}>
                  <CardContent className="p-8">
                    <h3 className="text-xl font-semibold mb-4">{guideline.title}</h3>
                    <div className="space-y-3">
                      {guideline.rules.map((rule, ruleIndex) => (
                        <div key={ruleIndex} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-600">{rule}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Device Mockups */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Device Mockups</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <Monitor className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Desktop Mockups</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    High-resolution desktop screenshots and mockups
                  </p>
                  <Button size="sm" variant="outline" className="border-indigo-200">
                    <Download className="h-3 w-3 mr-2" />
                    Download (12 files)
                  </Button>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <Smartphone className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Mobile Mockups</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    iPhone and Android app screenshots
                  </p>
                  <Button size="sm" variant="outline" className="border-indigo-200">
                    <Download className="h-3 w-3 mr-2" />
                    Download (8 files)
                  </Button>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <Printer className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Print Materials</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    High-resolution logos for print usage
                  </p>
                  <Button size="sm" variant="outline" className="border-indigo-200">
                    <Download className="h-3 w-3 mr-2" />
                    Download (6 files)
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Company Information */}
          <div className="max-w-4xl mx-auto mb-16">
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold mb-6">Company Information</h2>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-3">About FlowPay</h3>
                    <p className="text-gray-600 mb-4">
                      FlowPay is a secure escrow platform that enables instant payments 
                      for creator economy partnerships. We protect both creators and brands 
                      with our transparent, automated payment system.
                    </p>
                    <h3 className="font-semibold mb-3">Founded</h3>
                    <p className="text-gray-600 mb-4">2023</p>
                    <h3 className="font-semibold mb-3">Headquarters</h3>
                    <p className="text-gray-600">San Francisco, CA</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Key Features</h3>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Secure escrow payments
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Automated milestone releases
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Real-time analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Multi-currency support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Mobile app available
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Press Contact */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-0">
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Press & Media Inquiries</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Need additional assets, want to schedule an interview, or have questions 
                  about featuring FlowPay? We're here to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/contact')} className="bg-indigo-600 hover:bg-indigo-700">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Press Team
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('mailto:press@flowpay.com')}
                    className="border-indigo-200"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    press@flowpay.com
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
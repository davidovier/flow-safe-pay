import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageSquare, Send, Shield, HelpCircle, Bug, Lightbulb } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email with detailed responses',
      contact: 'support@flowpay.com',
      responseTime: 'Within 24 hours',
      action: () => window.open('mailto:support@flowpay.com')
    },
    {
      icon: MessageSquare,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      contact: 'Available 24/7',
      responseTime: 'Immediate',
      action: () => console.log('Open chat widget')
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak directly with our team',
      contact: '+1 (800) 359-7292',
      responseTime: 'Mon-Fri, 9 AM - 6 PM PST',
      action: () => window.open('tel:+1-800-359-7292')
    }
  ];

  const departments = [
    {
      icon: HelpCircle,
      title: 'General Support',
      email: 'support@flowpay.com',
      description: 'Account help, technical issues, and general questions'
    },
    {
      icon: Shield,
      title: 'Security Team',
      email: 'security@flowpay.com',
      description: 'Report security issues or suspicious activity'
    },
    {
      icon: Mail,
      title: 'Business Inquiries',
      email: 'business@flowpay.com',
      description: 'Partnerships, enterprise solutions, and business development'
    },
    {
      icon: Bug,
      title: 'Report Bug',
      email: 'bugs@flowpay.com',
      description: 'Technical issues, bugs, and platform problems'
    }
  ];

  const categories = [
    'General Inquiry',
    'Account Issues',
    'Payment Problems',
    'Technical Support',
    'Business Partnership',
    'Security Report',
    'Feature Request',
    'Bug Report'
  ];

  const officeLocations = [
    {
      city: 'San Francisco',
      address: '123 Market Street, Suite 456',
      hours: 'Mon-Fri: 9 AM - 6 PM PST',
      phone: '+1 (415) 555-0123'
    },
    {
      city: 'New York',
      address: '456 Broadway, Floor 12',
      hours: 'Mon-Fri: 9 AM - 6 PM EST',
      phone: '+1 (212) 555-0456'
    },
    {
      city: 'London',
      address: '789 Oxford Street, Suite 101',
      hours: 'Mon-Fri: 9 AM - 5 PM GMT',
      phone: '+44 20 7123 4567'
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission here
  };

  return (
    <>
      <SEOHead
        title="Contact Us - FlowPay"
        description="Get in touch with FlowPay. Contact our support team for help with your account, payments, or any questions about our platform."
        keywords={['contact', 'support', 'help', 'customer service', 'get in touch']}
        url="/contact"
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
                We're here to help
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Have a question or need help? We're here to assist you every step of the way.
            </p>
          </div>

          {/* Contact Methods */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Get in Touch</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {contactMethods.map((method, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={method.action}>
                  <CardContent className="p-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
                      <method.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{method.title}</h3>
                    <p className="text-gray-600 mb-4">{method.description}</p>
                    <div className="space-y-2">
                      <div className="font-medium text-blue-600">{method.contact}</div>
                      <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                        <Clock className="h-3 w-3" />
                        {method.responseTime}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-8">Send us a Message</h2>
              <Card>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Full Name</label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Email Address</label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="your.email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Category</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Subject</label>
                        <Input
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          placeholder="Brief description of your inquiry"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Message</label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Please provide as much detail as possible..."
                        rows={6}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Departments & Info */}
            <div className="space-y-8">
              {/* Departments */}
              <div>
                <h2 className="text-3xl font-bold mb-8">Contact by Department</h2>
                <div className="space-y-4">
                  {departments.map((dept, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <dept.icon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{dept.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{dept.description}</p>
                            <button
                              onClick={() => window.open(`mailto:${dept.email}`)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              {dept.email}
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Office Locations */}
              <div>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Office Locations
                </h3>
                <div className="space-y-4">
                  {officeLocations.map((office, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-2">{office.city}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>{office.address}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {office.hours}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {office.phone}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Help */}
          <div className="max-w-4xl mx-auto mt-16">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-0">
              <CardContent className="p-8">
                <div className="text-center">
                  <Lightbulb className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-semibold mb-4">Need Immediate Help?</h2>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Check out our Help Center for instant answers to common questions, 
                    or browse our comprehensive documentation.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={() => navigate('/help')} className="bg-blue-600 hover:bg-blue-700">
                      Visit Help Center
                    </Button>
                    <Button variant="outline" className="border-blue-200">
                      Browse FAQs
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
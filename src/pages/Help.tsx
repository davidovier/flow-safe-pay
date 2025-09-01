import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, HelpCircle, BookOpen, MessageSquare, Shield, CreditCard, Users, Settings, ChevronRight, ExternalLink, Mail, Phone } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';

export default function Help() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      color: 'blue',
      description: 'New to FlowPay? Learn the basics',
      articles: [
        'How to create your first account',
        'Understanding FlowPay escrow process',
        'Setting up your profile for success',
        'Platform walkthrough and key features'
      ]
    },
    {
      id: 'deals-payments',
      title: 'Deals & Payments',
      icon: CreditCard,
      color: 'green',
      description: 'Managing transactions and payments',
      articles: [
        'Creating and funding a new deal',
        'How milestone payments work',
        'Understanding escrow protection',
        'Payment methods and processing times'
      ]
    },
    {
      id: 'account-security',
      title: 'Account & Security',
      icon: Shield,
      color: 'red',
      description: 'Keeping your account safe and secure',
      articles: [
        'Setting up two-factor authentication',
        'Managing your account settings',
        'KYC verification requirements',
        'Reporting suspicious activity'
      ]
    },
    {
      id: 'disputes-support',
      title: 'Disputes & Support',
      icon: Users,
      color: 'purple',
      description: 'Resolving issues and getting help',
      articles: [
        'How to file a dispute',
        'Dispute resolution process',
        'Contacting customer support',
        'Understanding platform policies'
      ]
    }
  ];

  const popularArticles = [
    {
      title: 'How does FlowPay escrow work?',
      category: 'Getting Started',
      readTime: '3 min',
      description: 'Complete guide to understanding how our escrow system protects both creators and brands.'
    },
    {
      title: 'Setting up your payment methods',
      category: 'Deals & Payments',
      readTime: '2 min',
      description: 'Learn how to add and verify payment methods for seamless transactions.'
    },
    {
      title: 'What to do if a deal goes wrong',
      category: 'Disputes & Support',
      readTime: '5 min',
      description: 'Step-by-step guide for handling disputes and getting resolution.'
    },
    {
      title: 'Understanding fees and pricing',
      category: 'Deals & Payments',
      readTime: '2 min',
      description: 'Breakdown of all fees associated with using FlowPay services.'
    }
  ];

  const faqs = [
    {
      question: 'How long does it take to get verified?',
      answer: 'Account verification typically takes 1-3 business days. We review all submitted documents carefully to ensure security and compliance.'
    },
    {
      question: 'What happens if I have a dispute?',
      answer: 'Our dispute resolution team reviews all cases within 5-7 business days. We provide mediation services and make fair decisions based on evidence from both parties.'
    },
    {
      question: 'Are my funds safe in escrow?',
      answer: 'Yes, all escrow funds are held in segregated accounts with FDIC insurance protection. Your money is completely secure throughout the transaction process.'
    },
    {
      question: 'How do I cancel a deal?',
      answer: 'Deals can be cancelled before funding. Once funded, both parties must agree to cancellation, or a dispute resolution process may be required.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept major credit cards, debit cards, and bank transfers through our secure payment processor Stripe. Cryptocurrency support is coming soon.'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
      green: 'bg-green-100 text-green-600 hover:bg-green-200',
      red: 'bg-red-100 text-red-600 hover:bg-red-200',
      purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const filteredCategories = searchTerm
    ? categories.filter(cat => 
        cat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.articles.some(article => article.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : categories;

  return (
    <>
      <SEOHead
        title="Help Center - FlowPay"
        description="Find answers to your FlowPay questions. Comprehensive help documentation, FAQs, and support resources for creators and brands."
        keywords={['help center', 'support', 'FAQ', 'documentation', 'tutorials']}
        url="/help"
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
                Updated daily
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-6">
              <HelpCircle className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-8">
              Find answers to your questions and learn how to get the most out of FlowPay
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 rounded-2xl focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Help Categories */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${getColorClasses(category.color)}`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                    <div className="space-y-2">
                      {category.articles.slice(0, 3).map((article, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-700 hover:text-indigo-600 cursor-pointer">
                          <ChevronRight className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{article}</span>
                        </div>
                      ))}
                      <div className="pt-2">
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 p-0 h-auto">
                          View all articles <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Popular Articles */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Popular Articles</h2>
            <div className="space-y-4">
              {popularArticles.map((article, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold hover:text-indigo-600 transition-colors">
                            {article.title}
                          </h3>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                        <p className="text-gray-600 mb-2">{article.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="bg-gray-100 px-2 py-1 rounded-full">{article.category}</span>
                          <span>{article.readTime} read</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Need More Help?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Live Chat</h3>
                  <p className="text-gray-600 mb-4">
                    Chat with our support team in real-time
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 w-full">
                    Start Chat
                  </Button>
                  <div className="text-xs text-gray-500 mt-2">
                    Available 24/7
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <Mail className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Email Support</h3>
                  <p className="text-gray-600 mb-4">
                    Send us a detailed message about your issue
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-green-200 w-full"
                    onClick={() => window.open('mailto:support@flowpay.com')}
                  >
                    Email Us
                  </Button>
                  <div className="text-xs text-gray-500 mt-2">
                    Response within 24 hours
                  </div>
                </CardContent>
              </Card>

              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <Phone className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Phone Support</h3>
                  <p className="text-gray-600 mb-4">
                    Speak directly with our support team
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-purple-200 w-full"
                    onClick={() => window.open('tel:+1-800-FLOWPAY')}
                  >
                    Call Us
                  </Button>
                  <div className="text-xs text-gray-500 mt-2">
                    Mon-Fri, 9 AM - 6 PM PST
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact CTA */}
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-0">
              <CardContent className="p-8 text-center">
                <HelpCircle className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-4">Still Need Help?</h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Can't find what you're looking for? Our support team is always ready 
                  to help you get the most out of FlowPay.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button onClick={() => navigate('/contact')} className="bg-indigo-600 hover:bg-indigo-700">
                    Contact Support Team
                  </Button>
                  <Button variant="outline" className="border-indigo-200">
                    Browse All Articles
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
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Zap, 
  Shield, 
  Crown, 
  Building,
  ArrowLeft,
  Star,
  Sparkles,
  TrendingUp,
  Users,
  Globe,
  Rocket,
  DollarSign,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  HeartHandshake,
  Banknote,
  User,
  X
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { motion } from 'framer-motion';

interface PlanFeature {
  name: string;
  included: boolean;
  tooltip?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  yearlyPrice: number;
  description: string;
  popular?: boolean;
  features: PlanFeature[];
  cta: string;
  color: string;
  icon: typeof User;
}

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      yearlyPrice: 0,
      description: 'Perfect for getting started with creator partnerships',
      icon: User,
      color: 'from-gray-500 to-gray-600',
      cta: 'Get Started Free',
      features: [
        { name: 'Up to 3 deals per month', included: true },
        { name: '$500 transaction volume', included: true },
        { name: 'Basic escrow protection', included: true },
        { name: 'Email support', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Advanced analytics', included: false },
        { name: 'Custom branding', included: false },
        { name: 'API access', included: false },
        { name: 'Priority support', included: false },
        { name: 'Bulk payouts', included: false }
      ]
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      yearlyPrice: 290,
      description: 'Ideal for growing creators and small brands',
      icon: Rocket,
      color: 'from-blue-500 to-blue-600',
      cta: 'Start Free Trial',
      features: [
        { name: 'Up to 20 deals per month', included: true },
        { name: '$5,000 transaction volume', included: true },
        { name: 'Enhanced escrow protection', included: true },
        { name: 'Priority email support', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom branding', included: true },
        { name: 'API access', included: false },
        { name: '24/7 support', included: false },
        { name: 'Bulk payouts', included: false }
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 79,
      yearlyPrice: 790,
      description: 'For established creators and growing businesses',
      popular: true,
      icon: Crown,
      color: 'from-purple-500 to-purple-600',
      cta: 'Start Free Trial',
      features: [
        { name: 'Up to 100 deals per month', included: true },
        { name: '$25,000 transaction volume', included: true },
        { name: 'Premium escrow protection', included: true },
        { name: '24/7 priority support', included: true },
        { name: 'Mobile app access', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom branding', included: true },
        { name: 'Full API access', included: true },
        { name: 'Dedicated success manager', included: true },
        { name: 'Bulk payouts', included: true }
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 299,
      yearlyPrice: 2990,
      description: 'For large organizations and high-volume users',
      icon: Building,
      color: 'from-amber-500 to-amber-600',
      cta: 'Contact Sales',
      features: [
        { name: 'Unlimited deals', included: true },
        { name: 'Unlimited transaction volume', included: true },
        { name: 'White-label solutions', included: true },
        { name: 'Dedicated support team', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Advanced analytics suite', included: true },
        { name: 'Custom branding & theming', included: true },
        { name: 'Full API access + webhooks', included: true },
        { name: 'SLA guarantees', included: true },
        { name: 'Custom payment flows', included: true }
      ]
    }
  ];

  const stats = [
    { value: '15,000+', label: 'Active Users', icon: Users },
    { value: '$50M+', label: 'Processed', icon: DollarSign },
    { value: '99.9%', label: 'Uptime', icon: Shield },
    { value: '<2s', label: 'Avg Response', icon: Clock },
  ];

  const handlePlanSelect = (planId: string) => {
    if (planId === 'free') {
      navigate('/auth?plan=free');
    } else if (planId === 'enterprise') {
      navigate('/contact?inquiry=enterprise');
    } else {
      navigate(`/auth?plan=${planId}`);
    }
  };

  const getPrice = (plan: Plan) => {
    if (plan.price === 0) return 'Free';
    const price = isYearly ? plan.yearlyPrice / 12 : plan.price;
    return `$${Math.floor(price)}`;
  };

  const getSavings = (plan: Plan) => {
    if (plan.price === 0 || !plan.yearlyPrice) return null;
    const monthlyCost = plan.price * 12;
    const yearlySavings = monthlyCost - plan.yearlyPrice;
    const savingsPercent = Math.round((yearlySavings / monthlyCost) * 100);
    return savingsPercent;
  };

  return (
    <>
      <SEOHead
        title="Pricing - FlowPay Creator Economy Platform"
        description="Choose the perfect FlowPay plan for creators and brands. Start free, scale as you grow. Instant payouts, escrow protection, and enterprise-grade security."
        keywords={['pricing', 'creator platform pricing', 'brand partnership pricing', 'escrow pricing', 'creator economy pricing']}
        url="/pricing"
        type="website"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        {/* Floating Header */}
        <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrollY > 100 ? 'bg-white/80 backdrop-blur-md border-b shadow-sm' : 'bg-transparent'
        }`}>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/auth')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started Free
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-24">
          {/* Hero Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Join 15,000+ creators earning more
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent leading-tight">
              Pricing that scales<br />with your success
            </h1>
            
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Start free and grow with confidence. FlowPay's transparent pricing means you only pay for what you use, 
              with no hidden fees or surprises.
            </p>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto mb-16"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <stat.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center justify-center mb-16"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border">
              <div className="flex items-center space-x-4 px-4">
                <Label 
                  htmlFor="billing-toggle" 
                  className={`text-sm font-medium transition-colors ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}
                >
                  Monthly
                </Label>
                <Switch
                  id="billing-toggle"
                  checked={isYearly}
                  onCheckedChange={setIsYearly}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-500"
                />
                <Label 
                  htmlFor="billing-toggle" 
                  className={`text-sm font-medium transition-colors ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}
                >
                  Yearly
                </Label>
                <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 ml-2">
                  Save up to 17%
                </Badge>
              </div>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-20">
            {plans.map((plan, index) => {
              const savings = getSavings(plan);
              const Icon = plan.icon;
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                  className={`relative ${plan.popular ? 'lg:scale-105 z-10' : ''}`}
                >
                  <Card className={`relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                    plan.popular 
                      ? 'border-purple-300 bg-white shadow-2xl' 
                      : 'border-gray-200 hover:border-gray-300 bg-white/80 backdrop-blur-sm'
                  }`}>
                    {plan.popular && (
                      <div className="absolute top-0 left-0 right-0">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 text-sm font-semibold">
                          <Star className="h-4 w-4 inline mr-1" />
                          Most Popular
                        </div>
                      </div>
                    )}
                    
                    <CardHeader className={`text-center pb-8 ${plan.popular ? 'pt-12' : 'pt-8'}`}>
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      
                      <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-gray-600 mb-6">{plan.description}</CardDescription>
                      
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-center">
                          <span className="text-4xl font-bold text-gray-900">{getPrice(plan)}</span>
                          {plan.price > 0 && (
                            <span className="text-gray-500 ml-2">
                              /{isYearly ? 'month' : 'month'}
                            </span>
                          )}
                        </div>
                        
                        {isYearly && savings && (
                          <div className="text-sm text-green-600 font-medium">
                            Save {savings}% annually
                          </div>
                        )}
                        
                        {isYearly && plan.price > 0 && (
                          <div className="text-sm text-gray-500">
                            Billed ${plan.yearlyPrice} yearly
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-8">
                      <ul className="space-y-3">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {feature.included ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-gray-300" />
                              )}
                            </div>
                            <span className={`text-sm ${
                              feature.included ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {feature.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>

                    <CardFooter className="px-6 pb-8">
                      <Button
                        onClick={() => handlePlanSelect(plan.id)}
                        className={`w-full ${
                          plan.popular
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                            : plan.id === 'free'
                            ? 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                            : `bg-gradient-to-r ${plan.color} hover:opacity-90`
                        } text-white shadow-lg`}
                      >
                        {plan.cta}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* FAQ Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="max-w-3xl mx-auto mb-20"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-600">Everything you need to know about our pricing and plans</p>
            </div>

            <div className="space-y-8">
              {[
                {
                  question: "Can I change my plan at any time?",
                  answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges."
                },
                {
                  question: "What happens if I exceed my plan limits?",
                  answer: "We'll notify you before you reach your limits. You can either upgrade your plan or pay overage fees for additional usage."
                },
                {
                  question: "Do you offer refunds?",
                  answer: "Yes, we offer a 30-day money-back guarantee on all paid plans. If you're not satisfied, contact us for a full refund."
                },
                {
                  question: "How does the free trial work?",
                  answer: "All paid plans include a 14-day free trial. No credit card required to start. You can cancel anytime during the trial period."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                >
                  <Card className="bg-white/80 backdrop-blur-sm border hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
                      <p className="text-gray-600">{faq.answer}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Final CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.6 }}
            className="text-center"
          >
            <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white border-0 shadow-2xl max-w-4xl mx-auto">
              <CardContent className="p-12">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Rocket className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to get started?
                </h2>
                <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
                  Join thousands of creators and brands who trust FlowPay for secure, 
                  instant payments. Start your free trial today.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    onClick={() => navigate('/auth')}
                    className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg text-lg px-8"
                  >
                    Start Free Trial
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate('/contact')}
                    className="border-white text-white hover:bg-white/10 text-lg px-8"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Talk to Sales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </>
  );
}
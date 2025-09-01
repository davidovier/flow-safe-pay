import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/contexts/SubscriptionContext';
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
  User
} from 'lucide-react';
import { SUBSCRIPTION_PLANS, PlanType } from '@/types/subscription';
import { SEOHead } from '@/components/seo/SEOHead';
import { motion } from 'framer-motion';

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(true); // Default to yearly for better value
  const [scrollY, setScrollY] = useState(0);
  const { userProfile } = useAuth();
  const { t } = useTranslation();
  const { subscription, getCurrentPlan, upgradeToUser, loading } = useSubscription();
  const navigate = useNavigate();

  const currentPlan = getCurrentPlan();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const planIcons = {
    free: User,
    starter: Rocket,
    professional: Crown,
    enterprise: Building,
  };

  const planColors = {
    free: 'from-gray-500 to-gray-600',
    starter: 'from-blue-500 to-blue-600',
    professional: 'from-purple-500 to-purple-600',
    enterprise: 'from-amber-500 to-amber-600',
  };

  const handlePlanSelect = async (planId: PlanType) => {
    if (!userProfile) {
      navigate('/auth');
      return;
    }

    if (subscription?.planId === planId) return;

    await upgradeToUser(planId);
  };

  const stats = [
    { value: '15,000+', label: 'Active Users', icon: Users },
    { value: '$50M+', label: 'Processed', icon: DollarSign },
    { value: '99.9%', label: 'Uptime', icon: Shield },
    { value: '<2s', label: 'Avg Response', icon: Clock },
  ];

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
                  onClick={() => navigate(userProfile ? '/dashboard' : '/')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {userProfile ? 'Dashboard' : 'Home'}
                </Button>
              </div>
              {!userProfile && (
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
              )}
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
              Start free and unlock powerful features as you grow. No hidden fees, no surprises. 
              Just transparent pricing that grows with your creator business.
            </p>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-md mb-3">
                    <stat.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Billing Toggle */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center justify-center space-x-4 bg-white rounded-2xl p-2 shadow-lg inline-flex mb-8"
            >
              <Label 
                htmlFor="billing-toggle" 
                className={`px-6 py-3 rounded-xl cursor-pointer transition-all ${
                  !isYearly ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isYearly}
                onCheckedChange={setIsYearly}
                className="mx-2"
              />
              <Label 
                htmlFor="billing-toggle" 
                className={`px-6 py-3 rounded-xl cursor-pointer transition-all ${
                  isYearly ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <Badge className="ml-2 bg-green-500 text-white text-xs px-2 py-1">
                  Save 20%
                </Badge>
              </Label>
            </motion.div>
          </motion.div>

          {/* Current Plan Notice */}
          {currentPlan && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <Badge className="text-base px-6 py-3 bg-green-100 text-green-800 border border-green-200">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Currently on {currentPlan.name} Plan
              </Badge>
            </motion.div>
          )}

          {/* Enhanced Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {SUBSCRIPTION_PLANS.map((plan, index) => {
              const Icon = planIcons[plan.id as keyof typeof planIcons];
              const isCurrentPlan = subscription?.planId === plan.id;
              const price = isYearly && plan.yearlyPrice ? plan.yearlyPrice / 12 : plan.price;
              const yearlyPrice = plan.yearlyPrice;
              const monthlyTotal = plan.price * 12;
              const yearlyDiscount = yearlyPrice ? monthlyTotal - yearlyPrice : 0;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`relative ${plan.popular ? 'lg:scale-110 z-10' : ''}`}
                >
                  <Card className={`relative h-full border-2 transition-all duration-300 hover:shadow-2xl ${
                    plan.popular 
                      ? 'border-purple-500 bg-gradient-to-b from-purple-50 via-white to-blue-50 shadow-xl' 
                      : isCurrentPlan 
                      ? 'border-green-500 bg-gradient-to-b from-green-50 to-white' 
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}>
                    
                    {/* Popular Badge */}
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 text-sm font-medium shadow-lg">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Most Popular
                        </Badge>
                      </div>
                    )}
                    
                    {/* Current Plan Badge */}
                    {isCurrentPlan && !plan.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                        <Badge className="bg-green-600 text-white px-4 py-2 text-sm font-medium shadow-lg">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Current Plan
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-6">
                      {/* Icon with gradient background */}
                      <div className={`mx-auto mb-4 p-4 bg-gradient-to-r ${
                        planColors[plan.id as keyof typeof planColors]
                      } rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg`}>
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      
                      <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-gray-600 text-sm leading-relaxed">
                        {plan.description}
                      </CardDescription>
                      
                      {/* Pricing Display */}
                      <div className="mt-6">
                        <div className="flex items-end justify-center">
                          <span className="text-5xl font-bold text-gray-900">
                            ${price === 0 ? '0' : Math.floor(price)}
                          </span>
                          {price > 0 && (
                            <span className="text-lg text-gray-500 font-medium mb-1">/month</span>
                          )}
                        </div>
                        
                        {isYearly && yearlyPrice && yearlyDiscount > 0 && (
                          <div className="mt-2 space-y-1">
                            <div className="text-sm text-gray-600">
                              Billed annually: ${yearlyPrice}
                            </div>
                            <Badge className="bg-green-100 text-green-700 text-xs px-2 py-1">
                              Save ${yearlyDiscount}/year
                            </Badge>
                          </div>
                        )}
                        
                        {plan.id === 'free' && (
                          <div className="text-sm text-gray-500 mt-2">
                            Forever free • No credit card required
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-6">
                      {/* Key Metrics */}
                      <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 flex items-center">
                            <Banknote className="h-4 w-4 mr-2" />
                            Deals per month
                          </span>
                          <span className="font-semibold text-gray-900">
                            {plan.limits.dealsPerMonth === -1 ? 'Unlimited' : plan.limits.dealsPerMonth}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 flex items-center">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Transaction volume
                          </span>
                          <span className="font-semibold text-gray-900">
                            {plan.limits.transactionVolume === -1 
                              ? 'Unlimited' 
                              : `$${plan.limits.transactionVolume.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 flex items-center">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Platform fee
                          </span>
                          <span className="font-semibold text-gray-900">
                            {plan.id === 'free' ? '3.5%' : 
                             plan.id === 'starter' ? '2.5%' :
                             plan.id === 'professional' ? '2%' : '1.5%'}
                          </span>
                        </div>
                      </div>

                      {/* Feature List */}
                      <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-900 mb-3">Everything included:</div>
                        <ul className="space-y-2">
                          {plan.features.slice(0, plan.id === 'free' ? 4 : 6).map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start gap-3 text-sm text-gray-600">
                              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {plan.features.length > (plan.id === 'free' ? 4 : 6) && (
                            <li className="text-sm text-blue-600 font-medium">
                              + {plan.features.length - (plan.id === 'free' ? 4 : 6)} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    </CardContent>

                    <CardFooter className="px-6 pb-6">
                      <Button 
                        className={`w-full h-12 font-semibold transition-all duration-200 ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                            : isCurrentPlan 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : plan.id === 'free'
                            ? 'bg-gray-900 text-white hover:bg-gray-800'
                            : 'border-2 border-gray-300 hover:border-gray-400 bg-white text-gray-900 hover:bg-gray-50'
                        }`}
                        disabled={loading || isCurrentPlan}
                        onClick={() => handlePlanSelect(plan.id)}
                      >
                        {isCurrentPlan ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Current Plan
                          </>
                        ) : plan.id === 'free' ? (
                          <>
                            <Rocket className="h-4 w-4 mr-2" />
                            Start Free
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-2" />
                            {subscription?.planId === 'free' ? 'Upgrade Now' : 'Change Plan'}
                          </>
                        )}
                      </Button>
                      
                      {plan.id !== 'free' && (
                        <div className="text-center mt-3">
                          <div className="text-xs text-gray-500">
                            14-day free trial • Cancel anytime
                          </div>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Enhanced FAQ Section */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-32"
          >
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Everything you need to know about FlowPay pricing and plans
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {[
                {
                  icon: MessageCircle,
                  question: "Can I change plans anytime?",
                  answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
                },
                {
                  icon: TrendingUp,
                  question: "What happens if I exceed my limits?",
                  answer: "We'll notify you before you reach your limits. You can upgrade your plan or we'll temporarily increase your limits with prorated billing."
                },
                {
                  icon: Clock,
                  question: "Do you offer free trials?",
                  answer: "All paid plans include a 14-day free trial with full access to all features. No credit card required to start."
                },
                {
                  icon: DollarSign,
                  question: "How do platform fees work?",
                  answer: "Platform fees are automatically deducted from your earnings. Lower tiers have higher fees, but as you grow and upgrade, you keep more of what you earn."
                },
                {
                  icon: HeartHandshake,
                  question: "Is there a long-term commitment?",
                  answer: "No commitments required. You can cancel anytime, and you'll retain access until the end of your billing period."
                },
                {
                  icon: Award,
                  question: "Do you offer discounts for annual plans?",
                  answer: "Yes! Save up to 20% when you choose annual billing. Plus, get priority support and exclusive features."
                }
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <faq.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Trust Section */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-24 mb-16"
          >
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4 text-gray-900">
                Trusted by creators worldwide
              </h3>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join thousands of creators and brands who trust FlowPay with their business
              </p>
            </div>
            
            {/* Trust Badges */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { 
                  icon: Shield, 
                  title: "Bank-Grade Security", 
                  description: "Enterprise-level encryption and security protocols",
                  color: "from-green-500 to-green-600" 
                },
                { 
                  icon: Award, 
                  title: "SOC 2 Compliant", 
                  description: "Independently audited security and availability",
                  color: "from-blue-500 to-blue-600" 
                },
                { 
                  icon: CheckCircle2, 
                  title: "99.9% Uptime", 
                  description: "Reliable platform you can count on 24/7",
                  color: "from-purple-500 to-purple-600" 
                },
                { 
                  icon: Globe, 
                  title: "Global Support", 
                  description: "24/7 customer support in multiple languages",
                  color: "from-orange-500 to-orange-600" 
                }
              ].map((trust, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="text-center"
                >
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${trust.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                    <trust.icon className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{trust.title}</h4>
                  <p className="text-sm text-gray-600">{trust.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-24 mb-16"
          >
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-3xl p-12 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
              <div className="relative z-10">
                <h3 className="text-4xl font-bold mb-4">
                  Ready to supercharge your creator business?
                </h3>
                <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
                  Join thousands of successful creators who've already made the switch to FlowPay. 
                  Start free and scale as you grow.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    onClick={() => navigate('/auth')}
                  >
                    <Rocket className="h-5 w-5 mr-2" />
                    Start Free Today
                  </Button>
                  <Button 
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold transition-all"
                    onClick={() => navigate('/auth')}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Talk to Sales
                  </Button>
                </div>
                <div className="mt-6 text-sm text-blue-100">
                  No credit card required • Setup in under 2 minutes
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
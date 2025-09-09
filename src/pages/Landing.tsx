import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import SEOHead from '@/components/seo/SEOHead';
import { 
  Shield, 
  Zap, 
  CreditCard, 
  Users, 
  Star, 
  CheckCircle, 
  TrendingUp,
  Clock,
  Wallet,
  ArrowRight,
  Play,
  Quote,
  X
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  // Show coming soon toast for demo
  const handleDemoClick = () => {
    toast({
      title: "Coming Soon! 🎬",
      description: "Our demo video is currently in production and will be available soon.",
      duration: 4000,
    });
  };

  const features = [
    {
      icon: Shield,
      titleKey: "secureEscrow",
      descriptionKey: "secureEscrowDesc"
    },
    {
      icon: Zap,
      titleKey: "instantPayouts", 
      descriptionKey: "instantPayoutsDesc"
    },
    {
      icon: CreditCard,
      titleKey: "stripeProtected",
      descriptionKey: "stripeProtectedDesc"
    },
    {
      icon: Clock,
      titleKey: "autoRelease",
      descriptionKey: "autoReleaseDesc"
    }
  ];

  const stats = [
    { value: "$2.4M+", labelKey: "paidToCreators" },
    { value: "15,000+", labelKey: "successfulDeals" },
    { value: "99.8%", labelKey: "paymentSuccessRate" },
    { value: "< 2min", labelKey: "averagePayoutTime" }
  ];

  const reviews = [
    {
      name: "Sarah Chen",
      role: "Fashion Creator",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "FlowPay changed everything for me. I finally get paid instantly when I complete my work. No more chasing brands for payments!"
    },
    {
      name: "Marcus Rodriguez",
      role: "Brand Manager, StyleCorp",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The escrow system gives us confidence to work with new creators. We know our money is safe and creators get paid fairly."
    },
    {
      name: "Emma Thompson",
      role: "Lifestyle Influencer",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "Professional, secure, and fast. FlowPay is the payment platform the creator economy has been waiting for."
    },
    {
      name: "David Kim",
      role: "Marketing Director, TechBrand",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "We've processed over $500K through FlowPay. The transparency and security features are unmatched."
    }
  ];

  const trustedBy = [
    "Stripe Connect Partner", "SOC 2 Compliant", "GDPR Compliant", "PCI DSS Level 1", "Bank-Grade Security", "15,000+ Users"
  ];

  const securityCertifications = [
    { name: "SOC 2 Type II", icon: Shield },
    { name: "PCI DSS Level 1", icon: CheckCircle },
    { name: "GDPR Compliant", icon: Users },
    { name: "ISO 27001", icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Secure Creator Payments & Brand Partnerships"
        description="FlowPay is the secure escrow platform for creators and brands. Get paid instantly when work is approved. No more payment delays, with bank-grade security and automatic release."
        keywords={['creator payments', 'escrow platform', 'instant payouts', 'brand partnerships', 'secure payments', 'creator economy', 'influencer payments', 'payment protection']}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "FlowPay",
          "url": "https://flowpay.com",
          "description": "Secure escrow platform for creator payments and brand partnerships",
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "2500"
          }
        }}
      />
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">FlowPay</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => scrollToSection('features')} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('features')}
              </button>
              <button 
                onClick={() => scrollToSection('reviews')} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('reviews')}
              </button>
              <button 
                onClick={() => scrollToSection('security')} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('security')}
              </button>
              <button 
                onClick={() => navigate('/blog')} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('blog')}
              </button>
              <button 
                onClick={() => navigate('/pricing')} 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('pricing')}
              </button>
              <LanguageSwitcher variant="minimal" size="sm" />
              <Button variant="outline" onClick={() => navigate('/auth')}>{t('signIn')}</Button>
              <Button onClick={() => navigate('/auth')}>{t('getStarted')}</Button>
            </div>
            <div className="md:hidden flex items-center space-x-2">
              <LanguageSwitcher variant="minimal" size="sm" />
              <Button onClick={() => navigate('/auth')}>{t('signIn')}</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4">
              {t('trustedBy')}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Get Paid Instantly for Your
              <span className="text-primary"> Creator Work</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Secure escrow platform that protects both creators and brands. Funds release automatically when work is approved - no more payment delays or broken promises.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button size="lg" className="text-lg px-8 py-4" onClick={() => navigate('/auth')}>
                Get Started - It's Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-6 py-4"
                onClick={handleDemoClick}
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </div>
            
            {/* Role-specific value props */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span><strong>Creators:</strong> Get paid instantly when work is approved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <span><strong>Brands:</strong> Your money is protected until you're satisfied</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 border-y bg-muted/20">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground mb-8">Trusted & Secure</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
            {trustedBy.map((certification, index) => (
              <div key={index} className="flex items-center gap-2 text-sm font-medium">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {certification}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Creators & Brands Choose FlowPay
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built specifically for the creator economy with features that protect everyone involved
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">
                    {feature.titleKey === 'secureEscrow' && 'Secure Escrow'}
                    {feature.titleKey === 'instantPayouts' && 'Instant Payouts'}
                    {feature.titleKey === 'stripeProtected' && 'Stripe Protected'}
                    {feature.titleKey === 'autoRelease' && 'Auto-Release'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.titleKey === 'secureEscrow' && 'Your funds are protected with bank-grade security until deliverables are approved.'}
                    {feature.titleKey === 'instantPayouts' && 'Creators get paid immediately upon approval - no more waiting 30 days for payment.'}
                    {feature.titleKey === 'stripeProtected' && 'All payments processed through Stripe with buyer and seller protection.'}
                    {feature.titleKey === 'autoRelease' && 'Payments automatically release if no response within the agreed timeframe.'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How FlowPay Works</h2>
            <p className="text-xl text-muted-foreground">Simple, secure, and transparent for everyone</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg">
                1
              </div>
              <h3 className="font-semibold mb-3 text-lg">Create Partnership</h3>
              <p className="text-muted-foreground leading-relaxed">Brand creates a project with clear milestones and payment terms. Creator reviews and accepts the partnership.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg">
                2
              </div>
              <h3 className="font-semibold mb-3 text-lg">Secure Funding</h3>
              <p className="text-muted-foreground leading-relaxed">Brand funds the project safely through Stripe. Money is held in secure escrow until work is delivered and approved.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg">
                3
              </div>
              <h3 className="font-semibold mb-3 text-lg">Instant Payment</h3>
              <p className="text-muted-foreground leading-relaxed">Creator delivers work and gets paid instantly upon approval. If no response within agreed time, payment releases automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('reviewsTitle')}</h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-lg font-semibold">{t('reviewsRating')}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviews.map((review, index) => (
              <Card key={index} className="border-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="h-6 w-6 text-muted-foreground mb-3" />
                  <p className="text-sm mb-4 italic">"{review.text}"</p>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={review.avatar} alt={review.name} />
                      <AvatarFallback>{review.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-sm">{review.name}</div>
                      <div className="text-xs text-muted-foreground">{review.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section id="security" className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Bank-Grade Security</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your money and data are protected with the same security standards used by major financial institutions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Stripe Secured</h3>
              <p className="text-muted-foreground">All payments processed through Stripe with PCI DSS Level 1 compliance</p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Verified Users</h3>
              <p className="text-muted-foreground">KYC verification ensures all users are legitimate and trustworthy</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">99.8% Success Rate</h3>
              <p className="text-muted-foreground">Proven track record with thousands of successful transactions</p>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12 opacity-60">
            {securityCertifications.map((cert, index) => (
              <div key={index} className="flex items-center gap-2">
                <cert.icon className="h-6 w-6" />
                <span className="font-semibold">{cert.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call-to-Action */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/10 via-blue-50 to-primary/10">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Get Paid Instantly?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators and brands who trust FlowPay for secure, instant payments
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button size="lg" className="text-lg px-10 py-4 shadow-lg" onClick={() => navigate('/auth')}>
                Start Free Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg px-8 py-4"
                onClick={handleDemoClick}
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            
            {/* Trust badges */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-muted-foreground">
                No setup fees • No monthly fees • Only pay when you get paid
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Bank-grade security</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span>4.9/5 rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-muted-foreground">Everything you need to know about FlowPay</p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How does FlowPay protect my money?</h3>
                <p className="text-muted-foreground">FlowPay uses Stripe's secure escrow system to hold funds until deliverables are approved. Your money is protected by the same security standards used by major banks.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What happens if there's a dispute?</h3>
                <p className="text-muted-foreground">Our dispute resolution system allows for partial releases and mediation. Both parties can present their case, and we work to find a fair resolution that protects everyone involved.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">How fast do creators get paid?</h3>
                <p className="text-muted-foreground">Once deliverables are approved, creators typically receive payment within 2 minutes. If there's no response within the agreed timeframe, payments automatically release.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">What are the fees?</h3>
                <p className="text-muted-foreground">FlowPay charges a small percentage only when payments are processed successfully. There are no setup fees, monthly fees, or hidden costs.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative">
          {/* Newsletter Section */}
          <div className="border-b border-gray-800 py-16 px-4">
            <div className="container mx-auto">
              <div className="max-w-4xl mx-auto text-center">
                <h3 className="text-3xl font-bold mb-4">Stay in the loop</h3>
                <p className="text-xl text-gray-300 mb-8">
                  Get the latest updates on new features, creator stories, and industry insights.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 whitespace-nowrap">
                    Subscribe
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-3">
                  Join 10,000+ creators and brands. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </div>

          {/* Main Footer Content */}
          <div className="py-16 px-4">
            <div className="container mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
                {/* Brand Section */}
                <div className="sm:col-span-2 md:col-span-3 lg:col-span-2">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Wallet className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold">FlowPay</span>
                  </div>
                  <p className="text-gray-300 mb-6 text-lg leading-relaxed">
                    The secure escrow platform trusted by 15,000+ creators and brands worldwide. 
                    Get paid instantly with bank-grade security.
                  </p>
                  
                  {/* Social Links */}
                  <div className="space-y-4">
                    <h5 className="font-semibold text-sm uppercase tracking-wider text-gray-400">Follow Us</h5>
                    <div className="flex items-center flex-wrap gap-4">
                      <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors group">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors group">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors group">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.223.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.029 12.017.001z"/>
                        </svg>
                      </a>
                      <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors group">
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
                
                {/* Product Links */}
                <div>
                  <h4 className="font-semibold mb-6 text-white">Product</h4>
                  <div className="space-y-3">
                    <a href="#features" className="block text-gray-300 hover:text-white transition-colors">Features</a>
                    <a href="#security" className="block text-gray-300 hover:text-white transition-colors">Security</a>
                    <button onClick={() => navigate('/pricing')} className="block text-gray-300 hover:text-white transition-colors text-left">Pricing</button>
                    <button onClick={() => navigate('/api')} className="block text-gray-300 hover:text-white transition-colors text-left">API Docs</button>
                    <button onClick={() => navigate('/integrations')} className="block text-gray-300 hover:text-white transition-colors text-left">Integrations</button>
                  </div>
                </div>
                
                {/* Resources Links */}
                <div>
                  <h4 className="font-semibold mb-6 text-white">Resources</h4>
                  <div className="space-y-3">
                    <button onClick={() => navigate('/blog')} className="block text-gray-300 hover:text-white transition-colors text-left">Blog</button>
                    <button onClick={() => navigate('/help')} className="block text-gray-300 hover:text-white transition-colors text-left">Help Center</button>
                    <button onClick={() => navigate('/community')} className="block text-gray-300 hover:text-white transition-colors text-left">Community</button>
                    <button onClick={() => navigate('/status')} className="block text-gray-300 hover:text-white transition-colors text-left">Status Page</button>
                    <button onClick={() => navigate('/changelog')} className="block text-gray-300 hover:text-white transition-colors text-left">Changelog</button>
                  </div>
                </div>
                
                {/* Support Links */}
                <div>
                  <h4 className="font-semibold mb-6 text-white">Support</h4>
                  <div className="space-y-3">
                    <button onClick={() => navigate('/contact')} className="block text-gray-300 hover:text-white transition-colors text-left">Contact Us</button>
                    <a href="mailto:support@flowpay.com" className="block text-gray-300 hover:text-white transition-colors">Email Support</a>
                    <a href="tel:+1-555-0123" className="block text-gray-300 hover:text-white transition-colors">Phone Support</a>
                    <button onClick={() => navigate('/partnerships')} className="block text-gray-300 hover:text-white transition-colors text-left">Partnerships</button>
                    <button onClick={() => navigate('/media-kit')} className="block text-gray-300 hover:text-white transition-colors text-left">Media Kit</button>
                  </div>
                </div>
                
                {/* Legal Links */}
                <div>
                  <h4 className="font-semibold mb-6 text-white">Legal</h4>
                  <div className="space-y-3">
                    <button onClick={() => navigate('/privacy')} className="block text-gray-300 hover:text-white transition-colors text-left">Privacy Policy</button>
                    <button onClick={() => navigate('/terms')} className="block text-gray-300 hover:text-white transition-colors text-left">Terms of Service</button>
                    <button onClick={() => navigate('/cookies')} className="block text-gray-300 hover:text-white transition-colors text-left">Cookie Policy</button>
                    <button onClick={() => navigate('/compliance')} className="block text-gray-300 hover:text-white transition-colors text-left">Compliance</button>
                    <button onClick={() => navigate('/security')} className="block text-gray-300 hover:text-white transition-colors text-left">Security</button>
                  </div>
                </div>
              </div>
              
              {/* Bottom Section */}
              <div className="border-t border-gray-800 pt-8">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-gray-400">
                    <p>© 2024 FlowPay Inc. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-400" />
                        Payments by Stripe
                      </span>
                    </div>
                  </div>
                  
                  {/* Compliance Badges */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-8 h-8 bg-green-900 rounded-lg flex items-center justify-center">
                        <Shield className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">SOC 2 Type II</div>
                        <div className="text-xs">Certified</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">GDPR</div>
                        <div className="text-xs">Compliant</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-8 h-8 bg-purple-900 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium text-white">PCI DSS</div>
                        <div className="text-xs">Level 1</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
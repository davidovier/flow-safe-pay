import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
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
    "TechCrunch", "Forbes", "Shopify", "Creator Economy Report", "Social Media Examiner", "ConvertKit"
  ];

  const securityCertifications = [
    { name: "SOC 2 Type II", icon: Shield },
    { name: "PCI DSS Level 1", icon: CheckCircle },
    { name: "GDPR Compliant", icon: Users },
    { name: "ISO 27001", icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-background">
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
              {t('heroTitle')}
              <span className="text-primary"> {t('heroTitleHighlight')}</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t('heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" className="text-lg px-8" onClick={() => navigate('/auth')}>
                {t('startCreatingDeals')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-lg"
                onClick={handleDemoClick}
              >
                <Play className="mr-2 h-5 w-5" />
                {t('watchDemo')}
              </Button>
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
          <p className="text-center text-muted-foreground mb-8">Featured in</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {trustedBy.map((company, index) => (
              <div key={index} className="text-lg font-semibold">{company}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t('featuresTitle')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('featuresDescription')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(feature.descriptionKey)}</p>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('howItWorksTitle')}</h2>
            <p className="text-xl text-muted-foreground">{t('howItWorksDescription')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold mb-2">{t('step1Title')}</h3>
              <p className="text-muted-foreground">{t('step1Description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold mb-2">{t('step2Title')}</h3>
              <p className="text-muted-foreground">{t('step2Description')}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary-foreground font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold mb-2">{t('step3Title')}</h3>
              <p className="text-muted-foreground">{t('step3Description')}</p>
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

      {/* Money Back Guarantee */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">100% Money-Back Guarantee</h2>
            <p className="text-muted-foreground mb-6">
              If you're not completely satisfied with FlowPay within your first 30 days, 
              we'll refund every penny. No questions asked.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>30-day guarantee</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>No questions asked</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Full refund</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Paid Instantly?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of creators and brands who trust FlowPay for secure, instant payments
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary" 
              className="text-lg px-8"
              onClick={() => navigate('/auth')}
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              onClick={handleDemoClick}
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          <div className="flex flex-col items-center gap-2 mt-6">
            <p className="text-sm opacity-75">
              No setup fees • No monthly fees • Only pay when you get paid
            </p>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Shield className="h-4 w-4" />
              <span>30-day money-back guarantee</span>
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

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">FlowPay</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Secure escrow payments for the creator economy. Get paid instantly when your work is approved.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secured by Stripe</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#features" className="block hover:text-foreground">Features</a>
                <a href="#security" className="block hover:text-foreground">Security</a>
                <button onClick={() => navigate('/pricing')} className="block hover:text-foreground text-left">Pricing</button>
                <a href="#" className="block hover:text-foreground">API</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground">Help Center</a>
                <a href="#" className="block hover:text-foreground">Contact Us</a>
                <a href="#" className="block hover:text-foreground">Status Page</a>
                <a href="#" className="block hover:text-foreground">Community</a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <a href="#" className="block hover:text-foreground">Privacy Policy</a>
                <a href="#" className="block hover:text-foreground">Terms of Service</a>
                <a href="#" className="block hover:text-foreground">Cookie Policy</a>
                <a href="#" className="block hover:text-foreground">Compliance</a>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© 2024 FlowPay. All rights reserved. Payments processed by Stripe.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>SOC 2</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                <span>GDPR</span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span>PCI DSS</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
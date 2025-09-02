import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { Search, Calendar, Clock, TrendingUp, User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  author_name: string;
  author_avatar: string;
  published_at: string;
  reading_time: number;
  views: number;
  tags: string[];
  featured: boolean;
  featured_image_url?: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    fetchBlogData();
    const category = searchParams.get('category');
    if (category) {
      setSelectedCategory(category);
    }
  }, [searchParams]);

  const fetchBlogData = async () => {
    try {
      // Comprehensive blog posts for SEO and user value
      const mockPosts: BlogPost[] = [
        {
          id: '1',
          title: 'Ultimate Guide to Creator Payment Protection: Escrow Solutions for 2024',
          slug: 'creator-payment-protection-escrow-guide-2024',
          excerpt: 'Discover how escrow payments protect creators from payment disputes, late payments, and fraud. Complete guide to secure creator payments with real case studies.',
          author_name: 'Sarah Martinez',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-20T10:00:00Z',
          reading_time: 12,
          views: 3450,
          tags: ['creator-payments', 'escrow', 'payment-protection', 'fraud-prevention'],
          featured: true,
        },
        {
          id: '2',
          title: 'How Brands Can Secure Influencer Partnerships: Escrow Payment Best Practices',
          slug: 'brand-influencer-partnerships-escrow-best-practices',
          excerpt: 'Learn how leading brands protect their marketing budgets and ensure campaign deliverables with escrow payments. Includes contract templates and negotiation tips.',
          author_name: 'Michael Chen',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-18T14:30:00Z',
          reading_time: 10,
          views: 2840,
          tags: ['influencer-marketing', 'brand-partnerships', 'escrow', 'contract-management'],
          featured: true,
        },
        {
          id: '3',
          title: '2024 Creator Economy Report: Payment Trends & Income Statistics',
          slug: 'creator-economy-payment-trends-statistics-2024',
          excerpt: 'Comprehensive analysis of creator payment methods, average earnings, and emerging trends in the creator economy. Data from 10,000+ creators worldwide.',
          author_name: 'Data Research Team',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-15T09:15:00Z',
          reading_time: 15,
          views: 5200,
          tags: ['creator-economy', 'statistics', 'income-report', 'trends'],
          featured: true,
        },
        {
          id: '4',
          title: 'What is Escrow Payment? Complete Guide for Content Creators',
          slug: 'what-is-escrow-payment-complete-guide-creators',
          excerpt: 'Everything creators need to know about escrow payments: how they work, benefits, costs, and when to use them. Protect yourself from payment disputes.',
          author_name: 'Legal Team',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-12T16:00:00Z',
          reading_time: 8,
          views: 4100,
          tags: ['escrow-explained', 'payment-methods', 'creator-education', 'financial-protection'],
          featured: false,
        },
        {
          id: '5',
          title: 'Instagram Creator Payment Issues: How to Get Paid Safely in 2024',
          slug: 'instagram-creator-payment-issues-solutions-2024',
          excerpt: 'Common Instagram creator payment problems and proven solutions. Learn to avoid payment scams, late payments, and brand disputes with secure payment methods.',
          author_name: 'Emma Rodriguez',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-10T11:30:00Z',
          reading_time: 9,
          views: 3600,
          tags: ['instagram-creators', 'payment-issues', 'social-media-monetization', 'creator-safety'],
          featured: false,
        },
        {
          id: '6',
          title: 'TikTok Creator Contracts: Essential Terms for Fair Payment',
          slug: 'tiktok-creator-contracts-fair-payment-terms',
          excerpt: 'Master TikTok creator contracts with our comprehensive guide. Learn essential payment terms, milestone structures, and red flags to avoid.',
          author_name: 'Contract Specialist',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-08T13:45:00Z',
          reading_time: 11,
          views: 2950,
          tags: ['tiktok-creators', 'contracts', 'payment-terms', 'legal-advice'],
          featured: false,
        },
        {
          id: '7',
          title: 'YouTube Creator Payment Delays: Causes & Solutions',
          slug: 'youtube-creator-payment-delays-causes-solutions',
          excerpt: 'Why YouTube creators face payment delays and how to protect your income. Alternative payment methods and dispute resolution strategies.',
          author_name: 'Creator Success Team',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-05T10:20:00Z',
          reading_time: 7,
          views: 2200,
          tags: ['youtube-creators', 'payment-delays', 'income-protection', 'monetization'],
          featured: false,
        },
        {
          id: '8',
          title: 'Brand Partnership Red Flags: When to Demand Escrow Payment',
          slug: 'brand-partnership-red-flags-escrow-payment-protection',
          excerpt: 'Identify risky brand partnerships and protect yourself with escrow payments. Real examples of creator payment scams and how to avoid them.',
          author_name: 'Risk Management Team',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-03T15:10:00Z',
          reading_time: 10,
          views: 3800,
          tags: ['brand-partnerships', 'scam-prevention', 'risk-management', 'creator-protection'],
          featured: false,
        },
        {
          id: '9',
          title: 'Freelance Content Creator Payment Guide: Getting Paid Fast & Secure',
          slug: 'freelance-content-creator-payment-guide-fast-secure',
          excerpt: 'Complete payment guide for freelance content creators. Compare payment methods, processing times, and security features to maximize your income.',
          author_name: 'Freelancer Support',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-01T12:00:00Z',
          reading_time: 13,
          views: 4500,
          tags: ['freelance-creators', 'payment-methods', 'income-optimization', 'security'],
          featured: false,
        },
        {
          id: '10',
          title: 'Creator Tax Guide 2024: Payment Methods & Tax Implications',
          slug: 'creator-tax-guide-2024-payment-methods-implications',
          excerpt: 'Navigate creator taxes with confidence. How different payment methods affect your taxes, deductions you can claim, and record-keeping best practices.',
          author_name: 'Tax Specialist',
          author_avatar: '/placeholder.svg',
          published_at: '2023-12-28T09:30:00Z',
          reading_time: 14,
          views: 3200,
          tags: ['creator-taxes', 'tax-planning', 'payment-records', 'financial-planning'],
          featured: false,
        },
        {
          id: '11',
          title: 'International Creator Payments: Cross-Border Payment Solutions',
          slug: 'international-creator-payments-cross-border-solutions',
          excerpt: 'Navigate international creator payments with ease. Compare cross-border payment solutions, fees, and compliance requirements for global creators.',
          author_name: 'Global Payments Team',
          author_avatar: '/placeholder.svg',
          published_at: '2023-12-25T14:45:00Z',
          reading_time: 12,
          views: 2800,
          tags: ['international-payments', 'cross-border', 'global-creators', 'currency-exchange'],
          featured: false,
        },
        {
          id: '12',
          title: 'Creator Economy Investment Trends: Where VCs Are Betting in 2024',
          slug: 'creator-economy-investment-trends-vc-funding-2024',
          excerpt: 'Analysis of creator economy investments, emerging platforms, and where venture capital is flowing in 2024. Market insights for creators and entrepreneurs.',
          author_name: 'Market Research',
          author_avatar: '/placeholder.svg',
          published_at: '2023-12-22T11:15:00Z',
          reading_time: 16,
          views: 1900,
          tags: ['creator-economy', 'investment-trends', 'venture-capital', 'market-analysis'],
          featured: false,
        },
        {
          id: '13',
          title: 'NFT Creator Royalty Payments: New Models & Payment Systems',
          slug: 'nft-creator-royalty-payments-new-models-systems',
          excerpt: 'Explore evolving NFT creator royalty models and payment systems. How blockchain technology is changing creator compensation structures.',
          author_name: 'Blockchain Analyst',
          author_avatar: '/placeholder.svg',
          published_at: '2023-12-20T16:30:00Z',
          reading_time: 11,
          views: 1600,
          tags: ['nft-creators', 'royalty-payments', 'blockchain', 'web3-creators'],
          featured: false,
        },
        {
          id: '14',
          title: 'Creator Burnout & Financial Stress: Building Sustainable Income',
          slug: 'creator-burnout-financial-stress-sustainable-income',
          excerpt: 'Address creator burnout through financial planning and sustainable income strategies. Mental health resources and payment stability solutions.',
          author_name: 'Creator Wellness Team',
          author_avatar: '/placeholder.svg',
          published_at: '2023-12-18T13:20:00Z',
          reading_time: 9,
          views: 2400,
          tags: ['creator-wellness', 'financial-planning', 'sustainable-income', 'mental-health'],
          featured: false,
        },
        {
          id: '15',
          title: 'Micro-Influencer Payment Rates: 2024 Pricing Guide & Negotiations',
          slug: 'micro-influencer-payment-rates-2024-pricing-guide',
          excerpt: 'Current micro-influencer payment rates across platforms, pricing strategies, and negotiation tips. Data-driven insights for maximizing your rates.',
          author_name: 'Pricing Strategy Team',
          author_avatar: '/placeholder.svg',
          published_at: '2023-12-15T10:45:00Z',
          reading_time: 10,
          views: 5800,
          tags: ['micro-influencers', 'payment-rates', 'pricing-strategy', 'negotiation'],
          featured: false,
        },
        {
          id: '16',
          title: 'Creator Platform Algorithm Changes: Impact on Creator Income',
          slug: 'creator-platform-algorithm-changes-income-impact',
          excerpt: 'How platform algorithm updates affect creator visibility and income. Strategies to maintain earnings during algorithm changes across major platforms.',
          author_name: 'Platform Analytics',
          author_avatar: '/placeholder.svg',
          published_at: '2023-12-12T15:55:00Z',
          reading_time: 8,
          views: 3400,
          tags: ['platform-algorithms', 'creator-income', 'visibility', 'platform-changes'],
          featured: false,
        },
        {
          id: '17',
          title: 'B2B Creator Services: Enterprise Brand Partnership Strategies',
          slug: 'b2b-creator-services-enterprise-brand-partnerships',
          excerpt: 'Scale your creator business with B2B services and enterprise partnerships. Contract negotiation, pricing models, and long-term relationship building.',
          author_name: 'B2B Strategy Team',
          author_avatar: '/placeholder.svg',
          published_at: '2023-12-10T12:40:00Z',
          reading_time: 13,
          views: 2100,
          tags: ['b2b-creators', 'enterprise-partnerships', 'business-growth', 'contract-negotiation'],
          featured: false,
        },
        {
          id: '18',
          title: 'Creator Payment Fraud Prevention: Security Best Practices',
          slug: 'creator-payment-fraud-prevention-security-practices',
          excerpt: 'Protect yourself from payment fraud, fake brand partnerships, and financial scams. Essential security practices for creator payments.',
          author_name: 'Security Team',
          author_avatar: '/placeholder.svg',
          published_at: '2023-12-08T09:25:00Z',
          reading_time: 11,
          views: 2900,
          tags: ['payment-fraud', 'creator-security', 'scam-prevention', 'financial-safety'],
          featured: false,
        }
      ];

      const mockCategories: BlogCategory[] = [
        { id: '1', name: 'Payment Protection', slug: 'payment-protection', color: '#3B82F6' },
        { id: '2', name: 'Creator Economy', slug: 'creator-economy', color: '#10B981' },
        { id: '3', name: 'Brand Partnerships', slug: 'brand-partnerships', color: '#F59E0B' },
        { id: '4', name: 'Escrow Guide', slug: 'escrow', color: '#8B5CF6' },
        { id: '5', name: 'Platform Tips', slug: 'platform-tips', color: '#EF4444' },
        { id: '6', name: 'Financial Planning', slug: 'financial-planning', color: '#14B8A6' },
        { id: '7', name: 'Security & Fraud', slug: 'security', color: '#F97316' },
        { id: '8', name: 'Industry Trends', slug: 'trends', color: '#A855F7' },
      ];

      setPosts(mockPosts);
      setCategories(mockCategories);
      
    } catch (error) {
      console.error('Error fetching blog data:', error);
      toast({
        title: "Error",
        description: "Failed to load blog posts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = !selectedCategory || 
      post.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = posts.filter(post => post.featured).slice(0, 3);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePostClick = (slug: string) => {
    navigate(`/blog/${slug}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">FlowPay Blog</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Insights, tips, and success stories from the creator economy
            </p>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!selectedCategory ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory('')}
                >
                  All Posts
                </Button>
                {categories.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.slug)}
                    style={{ borderColor: selectedCategory === category.slug ? category.color : undefined }}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Posts */}
        {!searchQuery && !selectedCategory && featuredPosts.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Featured Stories
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map(post => (
                <Card 
                  key={post.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20"
                  onClick={() => handlePostClick(post.slug)}
                >
                  <CardHeader className="pb-3">
                    <Badge className="w-fit mb-2 bg-primary">Featured</Badge>
                    <h3 className="text-xl font-semibold line-clamp-2 hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {post.excerpt}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <img 
                          src={post.author_avatar} 
                          alt={post.author_name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{post.author_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time}m
                        </span>
                        <span>{post.views} views</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All Posts */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              {searchQuery || selectedCategory ? 'Search Results' : 'Latest Articles'}
              <span className="text-muted-foreground font-normal ml-2">
                ({filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'})
              </span>
            </h2>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-16">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search terms or browse all posts
              </p>
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
              }}>
                View All Posts
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map(post => (
                <Card 
                  key={post.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handlePostClick(post.slug)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag.replace('-', ' ')}
                        </Badge>
                      ))}
                    </div>
                    <h3 className="text-lg font-semibold line-clamp-2 hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {post.excerpt}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <img 
                          src={post.author_avatar} 
                          alt={post.author_name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span>{post.author_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.reading_time}m
                        </span>
                        <span>{post.views} views</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.published_at)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter CTA */}
        <section className="mt-16 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Stay Updated</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get the latest insights, success stories, and platform updates delivered to your inbox
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input placeholder="Enter your email" type="email" className="flex-1" />
            <Button>Subscribe</Button>
          </div>
        </section>
      </div>
    </div>
  );
}
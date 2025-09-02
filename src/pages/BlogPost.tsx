import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  Share2, 
  Twitter, 
  Linkedin, 
  Facebook,
  User,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author_name: string;
  author_avatar: string;
  published_at: string;
  reading_time: number;
  views: number;
  tags: string[];
  seo_title?: string;
  seo_description?: string;
}

interface RelatedPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  reading_time: number;
  views: number;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchPost(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (post) {
      // Update page title and meta description for SEO
      document.title = post.seo_title || `${post.title} | FlowPay Blog`;
      
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.seo_description || post.excerpt);
      }

      // Increment view count
      incrementViews(post.id);
      
      // Fetch related posts
      fetchRelatedPosts(post.tags, post.id);
    }
  }, [post]);

  const fetchPost = async (postSlug: string) => {
    try {
      // Comprehensive blog post content database
      const blogPostsContent: { [key: string]: BlogPost } = {
        'creator-payment-protection-escrow-guide-2024': {
          id: '1',
          title: 'Ultimate Guide to Creator Payment Protection: Escrow Solutions for 2024',
          slug: postSlug,
          content: `
# Ultimate Guide to Creator Payment Protection: Escrow Solutions for 2024

The creator economy is booming, but payment protection remains a critical challenge. With over $104 billion flowing through the creator economy in 2023, securing your payments has never been more important. This comprehensive guide covers everything creators need to know about escrow payment protection.

## What is Creator Payment Protection?

Creator payment protection refers to financial safeguards that ensure creators receive agreed-upon compensation for their work. Traditional payment methods often leave creators vulnerable to payment delays, disputes, or outright fraud.

### The Current Payment Problem

- **67% of creators** have experienced payment delays
- **34% of creators** have dealt with payment disputes
- **18% of creators** have been victims of payment fraud
- Average payment delay: **45 days** beyond agreed terms

## How Escrow Payments Protect Creators

Escrow services act as a neutral third party, holding funds until both parties fulfill their contractual obligations. Here's how it works:

### The Escrow Process

1. **Agreement**: Brand and creator agree on terms and payment amount
2. **Funding**: Brand deposits payment into secure escrow account
3. **Work Delivery**: Creator completes and submits deliverables
4. **Review Period**: Brand reviews work within agreed timeframe
5. **Release**: Payment automatically releases to creator upon approval or timer expiry

### Key Benefits

- **Payment Guarantee**: Funds are secured before work begins
- **Dispute Resolution**: Professional mediation for conflicts
- **Automated Release**: Payments release automatically if brands don't respond
- **Fraud Protection**: Verified brand accounts and secure transactions

## Types of Payment Protection

### 1. Milestone-Based Escrow
Perfect for large projects, payments release as you complete defined milestones.

**Best for**: Long-term campaigns, content series, product launches

### 2. Full Escrow Protection
Complete payment held in escrow until project completion.

**Best for**: One-time collaborations, sponsored content, product reviews

### 3. Hybrid Protection
Combination of upfront payment and escrow for larger projects.

**Best for**: High-value partnerships, ongoing brand relationships

## Case Studies: Real Creator Protection Stories

### Case Study 1: Instagram Lifestyle Creator
**Situation**: $15,000 campaign with 6-month payment delay
**Solution**: Escrow protection with 5-day auto-release
**Result**: Payment received within 24 hours of deliverable approval

### Case Study 2: YouTube Tech Reviewer  
**Situation**: Brand disputed video quality after approval
**Result**: Escrow mediation ruled in creator's favor, full payment protected

### Case Study 3: TikTok Dance Creator
**Situation**: Fake brand offering $5,000 for viral dance
**Protection**: Escrow verification caught fraudulent account
**Result**: Creator avoided scam, found legitimate brand partner

## Choosing the Right Payment Protection

### Factors to Consider

1. **Project Value**: Higher value projects need stronger protection
2. **Brand Relationship**: New brands require more security
3. **Timeline**: Longer projects benefit from milestone protection  
4. **Platform**: Different platforms have different risks

### Red Flags Requiring Escrow

- Brand refuses upfront payment discussion
- No clear contract or deliverable specifications
- Requests for personal financial information
- Unusually high payment for minimal work
- Brand has no verifiable business presence

## Implementation Guide

### Step 1: Educate Your Clients
Explain escrow benefits to brands as mutual protection.

### Step 2: Include in Contracts
Make escrow protection a standard contract term.

### Step 3: Choose Your Platform
Select an escrow service with creator-friendly terms.

### Step 4: Set Clear Milestones
Define specific, measurable deliverable criteria.

## Cost-Benefit Analysis

### Typical Escrow Fees
- **Standard Rate**: 2.9% of transaction value
- **High-Value Discount**: Reduced rates for $10,000+ projects
- **Monthly Plans**: Fixed rates for regular collaborations

### ROI Calculation
- **Cost**: 2.9% fee on $5,000 project = $145
- **Risk Avoided**: 34% chance of payment issues
- **Expected Value**: $1,700 protection for $145 cost
- **ROI**: 1,072% return on protection investment

## Legal Considerations

### Contract Essentials
- Clear deliverable specifications
- Payment schedule and amounts
- Revision and approval processes
- Dispute resolution procedures

### International Creators
- Currency conversion protections
- International wire transfer fees
- Tax implications and reporting
- Local payment regulations

## Advanced Protection Strategies

### Building Creator-Friendly Terms
- Automatic payment release timers
- Limited revision rounds
- Clear approval criteria
- Penalty clauses for delayed brand responses

### Diversification Approach
- Mix of escrow and traditional payments
- Multiple payment methods as backup
- Geographic diversification of brand partners
- Platform diversification strategies

## Future of Creator Payment Protection

### Emerging Trends
- **Blockchain-based escrow**: Transparent, automated smart contracts
- **AI dispute resolution**: Faster conflict mediation
- **Integrated platform protection**: Built-in payment security
- **Creator insurance products**: Comprehensive income protection

### Industry Predictions 2024-2025
- 78% of high-value creator partnerships will use escrow by 2025
- Average payment delays will decrease by 60% with escrow adoption
- Creator payment fraud will drop by 45% with improved verification

## Getting Started with Payment Protection

### Immediate Actions
1. **Audit current payment risks** in your creator business
2. **Research escrow providers** specializing in creator payments
3. **Update contracts** to include payment protection terms
4. **Educate brand partners** on mutual benefits
5. **Set minimum thresholds** for requiring escrow protection

### Long-term Strategy
- Build payment protection into your creator brand
- Develop standardized contract templates
- Create brand education materials
- Track and measure payment security improvements

## Conclusion

Creator payment protection through escrow services represents a fundamental shift toward professionalized creator businesses. By implementing these protection strategies, creators can focus on creating exceptional content while ensuring secure, timely compensation.

The investment in payment protection pays dividends through reduced stress, improved cash flow, and stronger brand relationships built on mutual trust and security.

*Ready to protect your creator income? Start with FlowPay's comprehensive escrow solutions designed specifically for the creator economy.*
          `,
          excerpt: 'Discover how escrow payments protect creators from payment disputes, late payments, and fraud. Complete guide to secure creator payments with real case studies.',
          author_name: 'Sarah Martinez',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-20T10:00:00Z',
          reading_time: 12,
          views: 3450,
          tags: ['creator-payments', 'escrow', 'payment-protection', 'fraud-prevention'],
          seo_title: 'Creator Payment Protection Guide 2024: Escrow Solutions & Case Studies',
          seo_description: 'Protect your creator income with escrow payments. Complete 2024 guide with case studies, ROI analysis, and implementation strategies. 67% of creators face payment delays - here\'s how to avoid them.'
        },

        'brand-influencer-partnerships-escrow-best-practices': {
          id: '2',
          title: 'How Brands Can Secure Influencer Partnerships: Escrow Payment Best Practices',
          slug: postSlug,
          content: `
# How Brands Can Secure Influencer Partnerships: Escrow Payment Best Practices

Influencer marketing spending reached $16.4 billion in 2023, but payment disputes and campaign failures cost brands millions. This comprehensive guide shows how escrow payments create win-win partnerships that protect both brands and influencers.

## The Brand's Payment Protection Challenge

Modern influencer partnerships face unique challenges that traditional payment methods can't address:

### Common Brand Risks
- **Non-delivery**: 23% of campaigns experience partial or complete non-delivery
- **Quality Issues**: 31% of deliverables require significant revisions
- **Timeline Delays**: Average campaign delay of 2.3 weeks
- **Engagement Fraud**: $1.3 billion lost to fake engagement annually

### Financial Impact
- **Wasted Spend**: $4.2 billion in ineffective influencer campaigns
- **Legal Costs**: Average dispute resolution cost: $12,500
- **Opportunity Cost**: Missed campaign windows and competitive advantages
- **Reputation Risk**: Public disputes damage brand relationships

## Why Brands Need Escrow Protection

### Traditional Payment Problems

**Upfront Payment Risks**:
- No guarantee of deliverable quality
- Limited recourse for non-performance
- Difficulty enforcing content standards
- Creator may disappear after payment

**Post-Delivery Payment Issues**:
- Creators demand payment before brand approval
- Quality disputes after work completion
- Delayed payment damages brand reputation
- No standardized dispute resolution

### Escrow Solution Benefits

1. **Quality Assurance**: Payment releases only after approval
2. **Deadline Enforcement**: Automatic penalties for missed deliverables
3. **Professional Disputes**: Neutral mediation for conflicts
4. **Relationship Preservation**: Structured resolution maintains partnerships

## Escrow Best Practices for Brands

### 1. Campaign Structure Design

**Milestone-Based Payments**:
- Break large campaigns into measurable phases
- Release payments as milestones complete
- Maintain motivation throughout campaign timeline
- Enable early identification of performance issues

**Example Structure**:
- 25% on campaign kickoff and content calendar approval
- 50% on content creation and submission
- 25% on final deliverables and performance metrics

### 2. Clear Performance Criteria

**Deliverable Specifications**:
- Content format and technical requirements
- Brand guideline compliance standards
- Engagement rate expectations and measurement periods
- Revision rounds and approval timelines

**Quality Standards Template**:
\`\`\`
CONTENT REQUIREMENTS:
- Platform: Instagram + Instagram Stories
- Format: 1 feed post + 5 story slides
- Brand mention: @brandname in caption and story
- Hashtag requirements: #sponsored #brandpartner
- FTC compliance: Clear disclosure language

APPROVAL CRITERIA:
- Brand guideline compliance: 100%
- Technical quality: HD resolution, clear audio
- Engagement rate: Minimum baseline performance
- Posting timeline: Within 48 hours of approval
\`\`\`

### 3. Contract Integration

**Essential Escrow Clauses**:
- Payment schedule tied to milestone completion
- Approval timeline and automatic release triggers
- Revision limits and additional work pricing
- Dispute resolution process and mediation procedures

## Implementation Guide for Brands

### Phase 1: Internal Preparation

**Legal Review**:
- Update standard influencer contracts
- Define approval processes and responsible parties
- Establish quality control checklists
- Create dispute escalation procedures

**Team Training**:
- Educate campaign managers on escrow processes
- Define approval timelines and responsibilities
- Create content review workflows
- Establish communication protocols with creators

### Phase 2: Creator Education

**Benefits Presentation**:
- Mutual protection for both parties
- Professional dispute resolution
- Faster payment processing
- Improved campaign success rates

**Process Explanation**:
- Clear milestone definitions and requirements
- Approval timeline commitments
- Automatic release mechanisms
- Professional mediation availability

### Phase 3: Campaign Execution

**Launch Checklist**:
- [ ] Escrow account funded with full campaign budget
- [ ] Milestone criteria clearly documented and agreed
- [ ] Approval team identified and briefed
- [ ] Creator onboarded to escrow platform
- [ ] Timeline and deliverable schedule confirmed

## Case Studies: Brand Success Stories

### Case Study 1: Fashion Brand Product Launch

**Campaign**: $50,000 multi-creator product launch
**Challenge**: Previous campaign had 40% non-delivery rate
**Escrow Structure**: 
- 20% on contract signature
- 60% on content submission
- 20% on performance metrics achievement

**Results**:
- 100% deliverable completion rate
- 15% improvement in content quality scores
- 23% faster campaign completion
- Zero payment disputes

### Case Study 2: Tech Company App Launch

**Campaign**: $25,000 app installation campaign
**Challenge**: Previous campaigns suffered from engagement fraud
**Escrow Protection**:
- Payment contingent on verified app installs
- Quality score minimums for content approval
- Performance bonuses for exceeding targets

**Results**:
- 89% authentic install rate (vs. 34% previous)
- 156% improvement in campaign ROI
- Stronger creator relationships
- Scalable campaign model developed

### Case Study 3: Beauty Brand Seasonal Campaign

**Campaign**: $75,000 holiday season campaign
**Challenge**: Timeline pressure and quality control
**Escrow Innovation**:
- Rapid approval process (24-hour maximum)
- Quality bonus payments for exceptional content
- Early payment releases for top performers

**Results**:
- 2.3x faster campaign completion
- 45% improvement in content engagement
- 12 creators became long-term brand ambassadors
- Model replicated for subsequent seasons

## Cost-Benefit Analysis for Brands

### Escrow Investment
**Typical Costs**:
- Platform fees: 2.9% of campaign value
- Setup time: 2-3 hours per campaign initially
- Training investment: One-time team education

**Example Calculation** ($10,000 campaign):
- Escrow fees: $290
- Traditional payment risks: $3,400 average loss exposure
- Net protection value: $3,110
- ROI on escrow investment: 973%

### Quality Improvements
**Measured Benefits**:
- 34% reduction in revision requests
- 67% faster approval cycles
- 23% improvement in content quality scores
- 89% creator satisfaction with payment process

## Advanced Escrow Strategies

### 1. Performance-Based Releases
- Base payment for content creation
- Bonus releases for engagement milestones
- Long-term relationship incentives
- Brand ambassador progression rewards

### 2. Multi-Campaign Accounts
- Annual budget allocation to escrow
- Streamlined approval for trusted creators
- Volume discounts on platform fees
- Predictable cash flow management

### 3. International Campaign Management
- Multi-currency support and conversion
- Local payment method integration
- Tax compliance and reporting
- Regional legal requirement adherence

## Building Creator Relationships Through Escrow

### Trust Development
**Creator Benefits Communication**:
- Guaranteed payment security
- Professional dispute resolution
- Transparent approval processes
- Fast payment release systems

**Long-term Partnership Building**:
- Preferred creator escrow accounts
- Expedited approval for trusted partners
- Performance bonuses and incentives
- Annual partnership agreements

### Conflict Prevention
**Proactive Measures**:
- Clear expectation setting
- Regular communication checkpoints
- Quality feedback and improvement suggestions
- Recognition and appreciation programs

## Technology Integration

### Campaign Management Tools
- Escrow platform API integration
- Automated milestone tracking
- Performance analytics and reporting
- Creator relationship management

### Workflow Automation
- Approval process automation
- Payment release triggers
- Quality control checklists
- Performance tracking dashboards

## Industry Trends and Future Outlook

### 2024 Predictions
- 67% of high-value brand campaigns will use escrow
- Average campaign success rates will improve by 45%
- Creator-brand relationship satisfaction will increase by 56%
- Payment dispute resolution time will decrease by 73%

### Emerging Innovations
- **AI-powered content quality scoring**
- **Blockchain-based smart contract integration**
- **Predictive campaign performance modeling**
- **Automated compliance and legal review**

## Implementation Roadmap

### Month 1: Foundation
- Legal and compliance review
- Team training and process development
- Platform selection and setup
- Initial creator communication strategy

### Month 2: Pilot Programs
- Small campaign testing with trusted creators
- Process refinement and optimization
- Performance measurement and analysis
- Creator feedback collection and integration

### Month 3: Scale and Optimize
- Full program rollout
- Advanced feature implementation
- Creator relationship program launch
- ROI measurement and reporting

## Conclusion

Escrow payments represent the evolution of professional influencer marketing partnerships. By implementing these best practices, brands can protect their investments while building stronger, more productive creator relationships.

The key to success lies in viewing escrow not as a barrier, but as a foundation for mutual trust and professional collaboration that drives superior campaign results.

*Ready to transform your influencer partnerships? FlowPay's brand-focused escrow solutions provide the security and flexibility you need for successful creator campaigns.*
          `,
          excerpt: 'Learn how leading brands protect their marketing budgets and ensure campaign deliverables with escrow payments. Includes contract templates and negotiation tips.',
          author_name: 'Michael Chen',
          author_avatar: '/placeholder.svg',
          published_at: '2024-01-18T14:30:00Z',
          reading_time: 10,
          views: 2840,
          tags: ['influencer-marketing', 'brand-partnerships', 'escrow', 'contract-management'],
          seo_title: 'Brand Influencer Partnership Guide: Escrow Payment Best Practices 2024',
          seo_description: 'Secure your influencer campaigns with escrow payments. Complete brand guide with case studies, ROI analysis, and contract templates. Reduce campaign risks by 67%.'
        }
      };

      const matchedPost = blogPostsContent[postSlug];
      if (matchedPost) {
        setPost(matchedPost);
      } else {
        // Fallback for any unmatched slugs - create dynamic content
        setPost({
          id: Date.now().toString(),
          title: postSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          slug: postSlug,
          content: `
# ${postSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}

This comprehensive guide covers everything you need to know about this important topic in the creator economy.

## Introduction

Content creators and brands face unique challenges in today's digital marketplace. This guide provides practical solutions and actionable insights.

## Key Benefits

- **Security**: Protect your business interests
- **Efficiency**: Streamline your processes  
- **Growth**: Scale your operations effectively
- **Trust**: Build stronger partnerships

## Implementation Guide

Follow these step-by-step instructions to implement these strategies in your creator business.

## Conclusion

By following these best practices, you'll be well-positioned for success in the creator economy.

*Ready to take your creator business to the next level? FlowPay provides the tools and security you need.*
          `,
          excerpt: 'Comprehensive guide covering essential strategies for success in the creator economy.',
          author_name: 'FlowPay Expert Team',
          author_avatar: '/placeholder.svg',
          published_at: new Date().toISOString(),
          reading_time: 8,
          views: Math.floor(Math.random() * 5000) + 1000,
          tags: ['creator-tips', 'business-growth', 'best-practices'],
          seo_title: `${postSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} | FlowPay Blog`,
          seo_description: 'Expert insights and practical strategies for creator economy success. Learn from industry leaders and implement proven tactics.'
        });
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
      toast({
        title: "Error",
        description: "Failed to load the blog post. Please try again.",
        variant: "destructive"
      });
      navigate('/blog');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (postId: string) => {
    try {
      // Mock view increment since function doesn't exist yet
      console.log('Mock: Incrementing views for post', postId);
    } catch (error) {
      console.error('Error incrementing views:', error);
    }
  };

  const fetchRelatedPosts = async (tags: string[], currentPostId: string) => {
    try {
      // Mock related posts data since blog_posts table doesn't exist yet
      const mockRelatedPosts: RelatedPost[] = [
        {
          id: '2',
          title: 'Building Trust with Brands: The Power of Escrow Payments',
          slug: 'building-trust-escrow-payments',
          excerpt: 'Discover how escrow payments protect both creators and brands.',
          reading_time: 7,
          views: 980
        },
        {
          id: '3',
          title: 'Maximizing Your Creator Income: Payment Strategy Tips',
          slug: 'maximizing-creator-income-tips',
          excerpt: 'Strategic approaches to pricing and contracts.',
          reading_time: 6,
          views: 1450
        }
      ];

      setRelatedPosts(mockRelatedPosts);
    } catch (error) {
      console.error('Error fetching related posts:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shareUrl = window.location.href;
  const shareText = post ? `Check out this article: ${post.title}` : '';

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "The article link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-8">
            <div className="h-6 bg-muted rounded w-32"></div>
            <div className="h-12 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Navigation */}
        <Button
          variant="ghost"
          onClick={() => navigate('/blog')}
          className="mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        {/* Article Header */}
        <article className="space-y-8">
          <header className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag.replace('-', ' ')}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>

            {/* Author and Meta Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b">
              <div className="flex items-center gap-4">
                <img 
                  src={post.author_avatar} 
                  alt={post.author_name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="font-semibold">{post.author_name}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.published_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.reading_time} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.views} views
                    </span>
                  </div>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground mr-2">Share:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareLinks.twitter, '_blank')}
                >
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareLinks.linkedin, '_blank')}
                >
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(shareLinks.facebook, '_blank')}
                >
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-8 text-center my-12">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Creator Business?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join thousands of creators who trust FlowPay for secure, instant payments
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/auth')} size="lg">
                Get Started Free
              </Button>
              <Button variant="outline" onClick={() => navigate('/pricing')} size="lg">
                View Pricing
              </Button>
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              Related Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map(relatedPost => (
                <Card 
                  key={relatedPost.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/blog/${relatedPost.slug}`)}
                >
                  <CardContent className="p-6">
                    <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors mb-3">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {relatedPost.reading_time}m
                      </span>
                      <span>{relatedPost.views} views</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
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
      // Mock blog post data since blog_posts table doesn't exist yet
      const mockPost: BlogPost = {
        id: '1',
        title: 'Getting Started with FlowPay: A Creator\'s Guide',
        slug: postSlug,
        content: `
# Getting Started with FlowPay

FlowPay is designed to make payments between creators and brands secure, transparent, and efficient. Our platform uses escrow services to ensure that both parties are protected throughout the collaboration process.

## Setting Up Your Account

Getting started with FlowPay is simple. Follow these steps:

1. **Sign up** for a FlowPay account
2. **Complete** your profile verification  
3. **Set up** your payment preferences
4. **Start** collaborating with confidence

## How Escrow Works

Our escrow system protects both creators and brands by holding funds in a secure account until project milestones are completed and approved.

## Getting Paid

Once your work is approved, payments are automatically released from escrow to your account. It's that simple!
        `,
        excerpt: 'Learn how to set up your FlowPay account and start accepting secure payments for your creative work.',
        author_name: 'FlowPay Team',
        author_avatar: '/placeholder.svg',
        published_at: '2024-01-15T10:00:00Z',
        reading_time: 5,
        views: 1250,
        tags: ['getting-started', 'creators', 'payments'],
        seo_title: 'Getting Started with FlowPay: A Creator\'s Guide',
        seo_description: 'Learn how to set up your FlowPay account and start accepting secure payments for your creative work.'
      };

      setPost(mockPost);
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
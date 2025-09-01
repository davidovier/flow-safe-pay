/**
 * Dynamic sitemap generation for FlowPay SEO
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const STATIC_PAGES: SitemapUrl[] = [
  // Main pages
  {
    loc: '/',
    changefreq: 'daily',
    priority: 1.0
  },
  {
    loc: '/auth',
    changefreq: 'monthly',
    priority: 0.8
  },
  {
    loc: '/pricing',
    changefreq: 'weekly',
    priority: 0.9
  },
  {
    loc: '/blog',
    changefreq: 'daily',
    priority: 0.8
  },
  
  // Legal pages
  {
    loc: '/privacy',
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    loc: '/terms',
    changefreq: 'monthly',
    priority: 0.5
  },
  {
    loc: '/security',
    changefreq: 'monthly',
    priority: 0.6
  },
  
  // Help pages
  {
    loc: '/help',
    changefreq: 'weekly',
    priority: 0.7
  },
  {
    loc: '/help/getting-started',
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    loc: '/help/payments',
    changefreq: 'monthly',
    priority: 0.6
  },
  {
    loc: '/help/security',
    changefreq: 'monthly',
    priority: 0.6
  }
];

/**
 * Generate XML sitemap
 */
export function generateSitemap(urls: SitemapUrl[] = STATIC_PAGES): string {
  const baseUrl = 'https://flowpay.com';
  
  const urlTags = urls.map(url => {
    const loc = `${baseUrl}${url.loc}`;
    const lastmod = url.lastmod || new Date().toISOString().split('T')[0];
    
    return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    <priority>${url.priority || 0.5}</priority>
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlTags}
</urlset>`;
}

/**
 * Generate robots.txt
 */
export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /

# Disallow sensitive areas
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /settings/
Disallow: /kyc-status/
Disallow: /_next/
Disallow: /static/

# Allow important resources
Allow: /api/og/
Allow: /_next/static/

# Sitemap
Sitemap: https://flowpay.com/sitemap.xml

# Crawl-delay for respectful crawling
Crawl-delay: 1`;
}

/**
 * SEO-friendly URL generation
 */
export function generateSEOUrl(title: string, id?: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .substring(0, 100); // Limit length

  return id ? `${slug}-${id}` : slug;
}

/**
 * Generate meta description from content
 */
export function generateMetaDescription(content: string, maxLength: number = 155): string {
  if (!content) return '';
  
  // Remove HTML tags
  const textOnly = content.replace(/<[^>]*>/g, '');
  
  // Truncate to appropriate length
  if (textOnly.length <= maxLength) {
    return textOnly.trim();
  }
  
  const truncated = textOnly.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  return lastSpace > maxLength * 0.8 
    ? truncated.substring(0, lastSpace) + '...'
    : truncated + '...';
}

/**
 * Generate keywords from content
 */
export function generateKeywords(content: string, existingKeywords: string[] = []): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  const wordCounts = words.reduce((counts, word) => {
    counts[word] = (counts[word] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const keywords = Object.entries(wordCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  return [...new Set([...existingKeywords, ...keywords])];
}
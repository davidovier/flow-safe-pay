/**
 * SEO Head component for FlowPay - Comprehensive meta tags and structured data
 */

import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
  structuredData?: object;
}

const DEFAULT_SEO = {
  title: 'FlowPay - Instant Secure Payments for Creator Deals',
  description: 'Get paid instantly for your creator work. FlowPay is the secure escrow platform trusted by 15,000+ creators and brands. No payment delays, bank-grade security.',
  keywords: [
    'creator payments',
    'influencer payments',
    'secure escrow',
    'instant payouts',
    'creator economy',
    'brand partnerships',
    'payment protection',
    'content creator platform',
    'social media monetization',
    'creator marketplace'
  ],
  image: '/images/flowpay-og-image.jpg',
  url: 'https://flowpay.com',
  type: 'website' as const
};

export function SEOHead({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  keywords = DEFAULT_SEO.keywords,
  image = DEFAULT_SEO.image,
  url = DEFAULT_SEO.url,
  type = DEFAULT_SEO.type,
  author,
  publishedTime,
  modifiedTime,
  noIndex = false,
  structuredData
}: SEOHeadProps) {
  
  const fullTitle = title === DEFAULT_SEO.title ? title : `${title} | FlowPay`;
  const fullUrl = url.startsWith('http') ? url : `https://flowpay.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://flowpay.com${image}`;

  // Default structured data for FlowPay
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "FlowPay",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "description": description,
    "url": fullUrl,
    "author": {
      "@type": "Organization",
      "name": "FlowPay Inc.",
      "url": "https://flowpay.com"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "2500",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "Instant payouts",
      "Bank-grade security",
      "Escrow protection",
      "KYC verification",
      "Milestone tracking",
      "Automated releases"
    ]
  };

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Viewport and Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Author and Publisher */}
      {author && <meta name="author" content={author} />}
      <meta name="publisher" content="FlowPay Inc." />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:alt" content={`${title} - FlowPay`} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="FlowPay" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@flowpay" />
      <meta name="twitter:creator" content="@flowpay" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      
      {/* Article specific (if type is article) */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          <meta property="article:section" content="Creator Economy" />
          <meta property="article:tag" content="creator payments, fintech, escrow" />
        </>
      )}
      
      {/* Performance and Optimization */}
      <meta name="theme-color" content="#3B82F6" />
      <meta name="msapplication-TileColor" content="#3B82F6" />
      
      {/* Comprehensive Security Headers */}
      <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;" />
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Strict-Transport-Security" content="max-age=31536000; includeSubDomains; preload" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <meta name="permissions-policy" content="camera=(), microphone=(), geolocation=(), payment=(self), usb=(), serial=(), bluetooth=(), magnetometer=(), gyroscope=(), accelerometer=()" />
      <meta name="cross-origin-opener-policy" content="same-origin" />
      <meta name="cross-origin-embedder-policy" content="require-corp" />
      <meta name="cross-origin-resource-policy" content="same-origin" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://vncpvmndkdzcdberruxv.supabase.co" />
      <link rel="dns-prefetch" href="https://js.stripe.com" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
      
      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />
      
      {/* Additional Performance Hints */}
      <link rel="prefetch" href="/api/auth" />
      <link rel="prefetch" href="/api/users/profile" />
    </Helmet>
  );
}
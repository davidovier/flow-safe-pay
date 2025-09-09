import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  type?: 'website' | 'article' | 'product'
  canonicalUrl?: string
  noIndex?: boolean
  structuredData?: object
}

const DEFAULT_TITLE = 'FlowPay - Secure Escrow Platform for Creators and Brands'
const DEFAULT_DESCRIPTION = 'Get paid instantly for your creator work. Secure escrow platform that protects both creators and brands. Funds release automatically when work is approved - no more payment delays.'
const DEFAULT_KEYWORDS = ['creator payments', 'escrow platform', 'instant payouts', 'brand partnerships']

function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  image = '/images/og-image.png',
  type = 'website',
  canonicalUrl,
  noIndex = false,
  structuredData,
}: SEOHeadProps) {
  const location = useLocation()
  
  const fullTitle = title ? `${title} | FlowPay` : DEFAULT_TITLE
  const currentUrl = canonicalUrl || `https://flowpay.com${location.pathname}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <link rel="canonical" href={currentUrl} />
      <meta name="robots" content={noIndex ? 'noindex' : 'index,follow'} />
      
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  )
}

export { SEOHead };
export default SEOHead;

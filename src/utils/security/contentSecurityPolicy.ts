/**
 * Enhanced Content Security Policy configuration for FlowPay
 */

export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    "https://js.stripe.com",
    "https://checkout.stripe.com",
    "https://www.googletagmanager.com"
  ],
  "style-src": [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    "https://fonts.googleapis.com"
  ],
  "font-src": [
    "'self'",
    "https://fonts.gstatic.com"
  ],
  "img-src": [
    "'self'",
    "data:",
    "https:",
    "blob:"
  ],
  "connect-src": [
    "'self'",
    "https://*.supabase.co",
    "https://api.stripe.com",
    "https://checkout.stripe.com",
    "https://*.lovableproject.com",
    "wss://*.lovableproject.com"
  ],
  "frame-src": [
    "'self'",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://checkout.stripe.com",
    "https://*.lovableproject.com"
  ],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "media-src": ["'self'"],
  "manifest-src": ["'self'"],
  "worker-src": ["'self'", "blob:"],
  "child-src": ["'self'", "blob:"]
};

export function generateCSPHeader(): string {
  // Disable CSP in development for preview compatibility
  try {
    if (import.meta.env?.DEV) {
      return "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;";
    }
  } catch (e) {
    // Fallback for environments where import.meta.env is not available
    if (process.env.NODE_ENV === 'development') {
      return "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;";
    }
  }
  
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

const isDev = (() => {
  try {
    return import.meta.env?.DEV;
  } catch (e) {
    return process.env.NODE_ENV === 'development';
  }
})();

export const SECURITY_HEADERS = isDev ? {
  // Development headers - minimal restrictions for preview compatibility
  'Content-Security-Policy': generateCSPHeader(),
  'X-Frame-Options': 'ALLOWALL',
  'X-Content-Type-Options': 'nosniff',
} : {
  // Production headers - full security
  'Content-Security-Policy': generateCSPHeader(),
  
  // Prevent clickjacking (allow same origin for preview compatibility)
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Prevent content type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (Feature Policy)
  'Permissions-Policy': [
    'camera=(), microphone=(), geolocation=()',
    'payment=(self)', // Allow payment API for Stripe
    'accelerometer=(), gyroscope=(), magnetometer=()',
    'fullscreen=(self), picture-in-picture=()',
    'usb=(), bluetooth=(), serial=()'
  ].join(', '),
  
  // Cross-Origin policies (relaxed for development preview compatibility)
  'Cross-Origin-Embedder-Policy': 'unsafe-none',
  'Cross-Origin-Opener-Policy': 'unsafe-none',
  'Cross-Origin-Resource-Policy': 'cross-origin'
};

/**
 * Apply security headers to HTML document via meta tags
 */
export function applySecurityMetaTags(): void {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = SECURITY_HEADERS['Content-Security-Policy'];
  document.head.appendChild(meta);

  const referrerMeta = document.createElement('meta');
  referrerMeta.name = 'referrer';
  referrerMeta.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrerMeta);
}

/**
 * Validate if a URL is allowed by CSP
 */
export function isURLAllowedByCSP(url: string, directive: keyof typeof CSP_DIRECTIVES): boolean {
  const allowedSources = CSP_DIRECTIVES[directive];
  const urlObj = new URL(url);
  
  return allowedSources.some(source => {
    if (source === "'self'") {
      return urlObj.origin === window.location.origin;
    }
    if (source.startsWith('https://')) {
      return url.startsWith(source) || urlObj.hostname.endsWith(source.replace('https://*.', ''));
    }
    return false;
  });
}
/**
 * Security headers and CSP configuration for FlowPay
 */

export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://api.stripe.com",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "manifest-src 'self'"
  ].join('; '),
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent content type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'camera=(), microphone=(), geolocation=(), payment=(self)',
    'accelerometer=(), gyroscope=(), magnetometer=()',
    'fullscreen=(self), picture-in-picture=()'
  ].join(', ')
};

/**
 * Apply security headers to HTML document
 */
export function applySecurityHeaders(): void {
  // Add meta tags for security headers
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
 * Security configuration for Vite
 */
export const VITE_SECURITY_CONFIG = {
  server: {
    headers: SECURITY_HEADERS
  }
};
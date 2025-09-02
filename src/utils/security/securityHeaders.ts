/**
 * Security headers and CSP configuration for FlowPay
 */

import { generateCSPHeader, SECURITY_HEADERS } from './contentSecurityPolicy';

export { SECURITY_HEADERS };

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
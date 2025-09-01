/**
 * API Security middleware and utilities for FlowPay
 * Handles CSRF protection, rate limiting, and request validation
 */

import { validateCSRFToken } from './csrf';
import { RateLimiter } from './inputValidation';

export interface SecurityConfig {
  enableCSRF: boolean;
  enableRateLimit: boolean;
  maxRequestsPerWindow: number;
  windowSizeMs: number;
  trustedOrigins: string[];
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  enableCSRF: true,
  enableRateLimit: true,
  maxRequestsPerWindow: 100,
  windowSizeMs: 15 * 60 * 1000, // 15 minutes
  trustedOrigins: ['https://flowpay.com', 'http://localhost:3000', 'http://localhost:5173']
};

/**
 * Validate request origin against trusted origins
 */
export function validateOrigin(origin: string | null, config: SecurityConfig): boolean {
  if (!origin) return false;
  return config.trustedOrigins.includes(origin);
}

/**
 * Validate CSRF token from request headers
 */
export function validateRequestCSRF(headers: Record<string, string>): boolean {
  const csrfToken = headers['x-csrf-token'] || headers['X-CSRF-Token'];
  if (!csrfToken) {
    return false;
  }
  return validateCSRFToken(csrfToken);
}

/**
 * Rate limiting for API endpoints
 */
const apiRateLimiter = new RateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

export function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const allowed = apiRateLimiter.isAllowed(identifier);
  const remaining = apiRateLimiter.getRemainingAttempts(identifier);
  
  return { allowed, remaining };
}

/**
 * Security middleware for API requests
 */
export interface SecurityValidationResult {
  valid: boolean;
  error?: string;
  statusCode?: number;
}

export function validateApiSecurity(
  request: {
    headers: Record<string, string>;
    origin?: string;
    ip?: string;
    method: string;
    path: string;
  },
  config: SecurityConfig = DEFAULT_SECURITY_CONFIG
): SecurityValidationResult {
  
  // Skip validation for safe methods (GET, HEAD, OPTIONS)
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(request.method.toUpperCase())) {
    return { valid: true };
  }

  // Validate origin for state-changing requests
  if (config.trustedOrigins.length > 0 && !validateOrigin(request.origin || null, config)) {
    return {
      valid: false,
      error: 'Origin not allowed',
      statusCode: 403
    };
  }

  // CSRF validation for state-changing requests
  if (config.enableCSRF && !validateRequestCSRF(request.headers)) {
    return {
      valid: false,
      error: 'CSRF token invalid or missing',
      statusCode: 403
    };
  }

  // Rate limiting
  if (config.enableRateLimit && request.ip) {
    const rateCheck = checkRateLimit(request.ip);
    if (!rateCheck.allowed) {
      return {
        valid: false,
        error: 'Rate limit exceeded',
        statusCode: 429
      };
    }
  }

  return { valid: true };
}

/**
 * Generate security headers for responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com",
      "frame-src https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'"
    ].join('; ')
  };
}

/**
 * Log security events for monitoring
 */
export interface SecurityEvent {
  type: 'csrf_validation_failed' | 'rate_limit_exceeded' | 'origin_validation_failed' | 'xss_attempt_detected';
  details: {
    ip?: string;
    userAgent?: string;
    origin?: string;
    path: string;
    timestamp: string;
    additionalData?: any;
  };
}

export function logSecurityEvent(event: SecurityEvent): void {
  // In production, this would send to a logging service
  console.warn('Security Event:', {
    ...event,
    timestamp: new Date().toISOString()
  });
  
  // Store in localStorage for development debugging
  if (typeof window !== 'undefined') {
    const events = JSON.parse(localStorage.getItem('security_events') || '[]');
    events.push(event);
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    localStorage.setItem('security_events', JSON.stringify(events));
  }
}

/**
 * Detect potential XSS attempts in request data
 */
export function detectXSSAttempts(data: any): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*>/gi,
    /expression\s*\(/gi,
    /vbscript:/gi
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return xssPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    if (Array.isArray(value)) {
      return value.some(checkValue);
    }
    return false;
  };

  return checkValue(data);
}
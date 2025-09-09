/**
 * Comprehensive XSS protection utilities for FlowPay
 * Prevents cross-site scripting attacks through multiple layers of defense
 */

/**
 * HTML entities map for encoding
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Dangerous HTML tags that should be stripped
 */
const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'applet', 'form', 'input',
  'button', 'select', 'textarea', 'option', 'meta', 'link', 'style',
  'base', 'frame', 'frameset', 'noframes', 'noscript'
];

/**
 * Dangerous attributes that should be removed
 */
const DANGEROUS_ATTRIBUTES = [
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onfocus',
  'onblur', 'onchange', 'onsubmit', 'onreset', 'onselect', 'onunload',
  'onbeforeunload', 'onresize', 'onscroll', 'ondragstart', 'ondrag',
  'ondragend', 'ondrop', 'ondragover', 'ondragenter', 'ondragleave',
  'oncontextmenu', 'onwheel', 'ontouchstart', 'ontouchmove', 'ontouchend',
  'ontouchcancel', 'onpointerdown', 'onpointermove', 'onpointerup',
  'onpointercancel', 'onpointerover', 'onpointerout', 'onpointerenter',
  'onpointerleave', 'ongotpointercapture', 'onlostpointercapture',
  'src', 'href', 'action', 'formaction', 'data', 'background',
  'style', 'dynsrc', 'lowsrc'
];

/**
 * Dangerous URL schemes
 */
const DANGEROUS_PROTOCOLS = [
  'javascript:', 'vbscript:', 'data:', 'blob:', 'file:', 'ftp:',
  'jar:', 'mailto:', 'tel:', 'sms:', 'mms:', 'market:', 'intent:'
];

/**
 * Encode HTML entities
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input.replace(/[&<>"'`=\/]/g, (match) => HTML_ENTITIES[match] || match);
}

/**
 * Decode HTML entities
 */
export function unescapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  const entityMap = Object.fromEntries(
    Object.entries(HTML_ENTITIES).map(([char, entity]) => [entity, char])
  );
  
  return input.replace(/&(?:amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g, (match) => {
    return entityMap[match] || match;
  });
}

/**
 * Sanitize user input by removing dangerous content
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

  // Remove dangerous script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous iframe tags and their content
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove other dangerous tags
  DANGEROUS_TAGS.forEach(tag => {
    const regex = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(regex, '');
    
    // Also remove self-closing versions
    const selfClosingRegex = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingRegex, '');
  });

  // Remove dangerous attributes
  DANGEROUS_ATTRIBUTES.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove dangerous protocols
  DANGEROUS_PROTOCOLS.forEach(protocol => {
    const regex = new RegExp(protocol.replace(':', '\\s*:\\s*'), 'gi');
    sanitized = sanitized.replace(regex, '');
  });

  // Remove HTML comments that might contain malicious content
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');

  // Remove CDATA sections
  sanitized = sanitized.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');

  // Remove processing instructions
  sanitized = sanitized.replace(/<\?[\s\S]*?\?>/g, '');

  return sanitized.trim();
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let sanitized = url.trim();

  // Check for dangerous protocols
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (sanitized.toLowerCase().startsWith(protocol)) {
      return '';
    }
  }

  // Encode dangerous characters in URL
  sanitized = encodeURI(decodeURI(sanitized));

  // Remove any remaining script tags or javascript
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/<script/gi, '');

  return sanitized;
}

/**
 * Content Security Policy (CSP) header generator
 */
export function generateCSPHeader(config: {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  connectSrc?: string[];
  frameSrc?: string[];
  objectSrc?: string[];
  baseUri?: string[];
  formAction?: string[];
  upgradeInsecureRequests?: boolean;
}): string {
  const directives: string[] = [];

  if (config.defaultSrc) {
    directives.push(`default-src ${config.defaultSrc.join(' ')}`);
  }

  if (config.scriptSrc) {
    directives.push(`script-src ${config.scriptSrc.join(' ')}`);
  }

  if (config.styleSrc) {
    directives.push(`style-src ${config.styleSrc.join(' ')}`);
  }

  if (config.imgSrc) {
    directives.push(`img-src ${config.imgSrc.join(' ')}`);
  }

  if (config.fontSrc) {
    directives.push(`font-src ${config.fontSrc.join(' ')}`);
  }

  if (config.connectSrc) {
    directives.push(`connect-src ${config.connectSrc.join(' ')}`);
  }

  if (config.frameSrc) {
    directives.push(`frame-src ${config.frameSrc.join(' ')}`);
  }

  if (config.objectSrc) {
    directives.push(`object-src ${config.objectSrc.join(' ')}`);
  }

  if (config.baseUri) {
    directives.push(`base-uri ${config.baseUri.join(' ')}`);
  }

  if (config.formAction) {
    directives.push(`form-action ${config.formAction.join(' ')}`);
  }

  if (config.upgradeInsecureRequests) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

/**
 * FlowPay specific CSP configuration
 */
export const FLOWPAY_CSP_CONFIG = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
  styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  fontSrc: ["'self'", "https://fonts.gstatic.com"],
  imgSrc: ["'self'", "data:", "https:", "blob:"],
  connectSrc: ["'self'", "https://*.supabase.co", "https://api.stripe.com"],
  frameSrc: ["https://js.stripe.com"],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  upgradeInsecureRequests: true
};

/**
 * React component wrapper for XSS-safe content rendering
 */
export interface SafeContentProps {
  content: string;
  allowedTags?: string[];
  allowedAttributes?: string[];
  className?: string;
}

/**
 * Sanitize content for safe rendering in React
 */
export function sanitizeForReact(
  content: string,
  allowedTags: string[] = [],
  allowedAttributes: string[] = []
): string {
  if (!content) return '';

  let sanitized = sanitizeInput(content);

  // If no allowed tags specified, escape all HTML
  if (allowedTags.length === 0) {
    return escapeHtml(sanitized);
  }

  // Remove all tags except allowed ones
  const allTags = sanitized.match(/<\/?[^>]+(>|$)/g) || [];
  
  allTags.forEach(tag => {
    const tagMatch = tag.match(/<\/?([^\s>]+)/);
    const tagName = tagMatch?.[1]?.toLowerCase();
    
    if (tagName && !allowedTags.includes(tagName)) {
      sanitized = sanitized.replace(tag, '');
    } else if (tagName && allowedTags.includes(tagName)) {
      // Remove dangerous attributes from allowed tags
      let cleanTag = tag;
      
      DANGEROUS_ATTRIBUTES.forEach(attr => {
        if (!allowedAttributes.includes(attr)) {
          const attrRegex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
          cleanTag = cleanTag.replace(attrRegex, '');
        }
      });
      
      sanitized = sanitized.replace(tag, cleanTag);
    }
  });

  return sanitized;
}

/**
 * XSS detection patterns
 */
const XSS_PATTERNS = [
  // Script injection patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /onfocus\s*=/gi,
  /onblur\s*=/gi,
  
  // Data URI with script
  /data:text\/html/gi,
  /data:text\/javascript/gi,
  /data:application\/javascript/gi,
  
  // Expression patterns
  /expression\s*\(/gi,
  /eval\s*\(/gi,
  /setTimeout\s*\(/gi,
  /setInterval\s*\(/gi,
  
  // Event handlers
  /on\w+\s*=/gi,
  
  // Iframe injection
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  
  // Object/embed injection
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  
  // Meta refresh
  /<meta\b[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi,
  
  // Link javascript
  /<link\b[^>]*href\s*=\s*["']?javascript:/gi
];

/**
 * Detect potential XSS attempts
 */
export function detectXSS(input: string): {
  detected: boolean;
  patterns: string[];
  riskScore: number;
} {
  if (!input || typeof input !== 'string') {
    return { detected: false, patterns: [], riskScore: 0 };
  }

  const detectedPatterns: string[] = [];
  let riskScore = 0;

  XSS_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source);
      // Higher risk for script tags and javascript protocols
      riskScore += index < 4 ? 10 : 5;
    }
  });

  return {
    detected: detectedPatterns.length > 0,
    patterns: detectedPatterns,
    riskScore: Math.min(riskScore, 100) // Cap at 100
  };
}

/**
 * Middleware for XSS protection in API requests
 */
export function validateRequestForXSS(data: any): {
  safe: boolean;
  threats: Array<{
    field: string;
    patterns: string[];
    riskScore: number;
  }>;
} {
  const threats: Array<{
    field: string;
    patterns: string[];
    riskScore: number;
  }> = [];

  const checkValue = (value: any, fieldPath: string): void => {
    if (typeof value === 'string') {
      const xssResult = detectXSS(value);
      if (xssResult.detected) {
        threats.push({
          field: fieldPath,
          patterns: xssResult.patterns,
          riskScore: xssResult.riskScore
        });
      }
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([key, val]) => {
        checkValue(val, `${fieldPath}.${key}`);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        checkValue(item, `${fieldPath}[${index}]`);
      });
    }
  };

  if (typeof data === 'object' && data !== null) {
    Object.entries(data).forEach(([key, value]) => {
      checkValue(value, key);
    });
  } else {
    checkValue(data, 'root');
  }

  return {
    safe: threats.length === 0,
    threats
  };
}

/**
 * Auto-sanitize object recursively
 */
export function autoSanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => autoSanitizeObject(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {};
    Object.entries(obj).forEach(([key, value]) => {
      sanitized[key] = autoSanitizeObject(value);
    });
    return sanitized;
  }
  
  return obj;
}

/**
 * Generate nonce for inline scripts/styles
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Initialize XSS protection for the application
 */
export function initXSSProtection(): void {
  // Set CSP header if possible (this would typically be done server-side)
  if (typeof document !== 'undefined') {
    const existingMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!existingMeta) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = generateCSPHeader(FLOWPAY_CSP_CONFIG);
      document.head.appendChild(meta);
    }
  }

  // Override potentially dangerous global functions in development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const originalEval = window.eval;
    window.eval = function(...args) {
      console.warn('eval() called - potential XSS risk:', args);
      return originalEval.apply(this, args);
    };

    // Don't override setTimeout as it causes type issues
    // Just warn in console instead
    console.warn('XSS Protection: Be careful with dynamic script execution');
  }
}

// Additional exports for test compatibility
export const sanitizeHtml = sanitizeInput;
export const encodeHtmlEntities = escapeHtml;
export const sanitizeObject = autoSanitizeObject;
export const isDangerous = (input: string) => detectXSS(input).detected;
export const validateUrl = (url: string) => sanitizeUrl(url) !== '';
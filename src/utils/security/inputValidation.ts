/**
 * Input validation and sanitization utilities for FlowPay security
 */

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  name: /^[a-zA-Z\s'-]{1,50}$/,
  phone: /^\+?[\d\s()-]{10,20}$/,
  currency: /^[A-Z]{3}$/,
  amount: /^\d+(\.\d{1,2})?$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
};

// Allowed file types for uploads
export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  documents: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime']
};

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 25 * 1024 * 1024, // 25MB
  video: 100 * 1024 * 1024, // 100MB
  default: 5 * 1024 * 1024 // 5MB
};

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove potentially dangerous HTML tags and attributes
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
}

/**
 * Sanitize text input to prevent injection attacks
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return char;
      }
    });
}

/**
 * Validate email address
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (email.length > 320) {
    return { valid: false, error: 'Email address is too long' };
  }
  
  if (!VALIDATION_PATTERNS.email.test(email)) {
    return { valid: false, error: 'Invalid email address format' };
  }
  
  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string; strength?: number } {
  if (!password) {
    return { valid: false, error: 'Password is required', strength: 0 };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long', strength: 1 };
  }
  
  if (password.length > 128) {
    return { valid: false, error: 'Password is too long', strength: 1 };
  }
  
  const checks = {
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[@$!%*?&]/.test(password),
    hasNoCommonPatterns: !/(password|123456|qwerty|admin)/i.test(password)
  };
  
  const strength = Object.values(checks).filter(Boolean).length;
  
  if (strength < 4) {
    return { 
      valid: false, 
      error: 'Password must contain uppercase, lowercase, numbers, and special characters',
      strength 
    };
  }
  
  return { valid: true, strength };
}

/**
 * Validate name input
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Name is required' };
  }
  
  if (name.length > 50) {
    return { valid: false, error: 'Name is too long' };
  }
  
  if (!VALIDATION_PATTERNS.name.test(name)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  return { valid: true };
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) {
    return { valid: false, error: 'Phone number is required' };
  }
  
  if (!VALIDATION_PATTERNS.phone.test(phone)) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  
  return { valid: true };
}

/**
 * Validate monetary amount
 */
export function validateAmount(amount: string | number): { valid: boolean; error?: string } {
  const amountStr = amount.toString();
  
  if (!amountStr) {
    return { valid: false, error: 'Amount is required' };
  }
  
  if (!VALIDATION_PATTERNS.amount.test(amountStr)) {
    return { valid: false, error: 'Invalid amount format' };
  }
  
  const numAmount = parseFloat(amountStr);
  
  if (numAmount < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }
  
  if (numAmount > 1000000) {
    return { valid: false, error: 'Amount exceeds maximum limit' };
  }
  
  return { valid: true };
}

/**
 * Validate file upload
 */
export function validateFile(
  file: File, 
  allowedTypes: string[], 
  maxSize: number = MAX_FILE_SIZES.default
): { valid: boolean; error?: string } {
  
  if (!file) {
    return { valid: false, error: 'File is required' };
  }
  
  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
  }
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check file name
  const fileName = sanitizeText(file.name);
  if (fileName.length > 255) {
    return { valid: false, error: 'File name is too long' };
  }
  
  // Check for dangerous extensions
  const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', '.zip', '.rar'];
  const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  if (dangerousExtensions.includes(fileExtension)) {
    return { valid: false, error: 'File type not allowed for security reasons' };
  }
  
  return { valid: true };
}

/**
 * Validate URL
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url) {
    return { valid: false, error: 'URL is required' };
  }
  
  if (!VALIDATION_PATTERNS.url.test(url)) {
    return { valid: false, error: 'Invalid URL format' };
  }
  
  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  const lowerUrl = url.toLowerCase();
  
  if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
    return { valid: false, error: 'URL protocol not allowed' };
  }
  
  return { valid: true };
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  
  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs });
      return true;
    }
    
    if (attempt.count >= this.maxAttempts) {
      return false;
    }
    
    attempt.count++;
    return true;
  }
  
  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt || Date.now() > attempt.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - attempt.count);
  }
  
  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

/**
 * Content Security Policy nonce generator
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Secure random token generator
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
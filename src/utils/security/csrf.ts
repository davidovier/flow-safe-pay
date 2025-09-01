/**
 * CSRF protection utilities for FlowPay
 */

import { generateSecureToken } from './inputValidation';

const CSRF_TOKEN_KEY = 'flowpay_csrf_token';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate and store CSRF token
 */
export function generateCSRFToken(): string {
  const token = generateSecureToken(32);
  sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  return token;
}

/**
 * Get current CSRF token
 */
export function getCSRFToken(): string | null {
  return sessionStorage.getItem(CSRF_TOKEN_KEY);
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(providedToken: string): boolean {
  const storedToken = getCSRFToken();
  if (!storedToken || !providedToken) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (storedToken.length !== providedToken.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < storedToken.length; i++) {
    result |= storedToken.charCodeAt(i) ^ providedToken.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Add CSRF token to request headers
 */
export function addCSRFHeaders(headers: Record<string, string> = {}): Record<string, string> {
  const token = getCSRFToken();
  if (token) {
    headers[CSRF_HEADER_NAME] = token;
  }
  return headers;
}

/**
 * Initialize CSRF protection
 */
export function initCSRFProtection(): void {
  // Generate token if not exists
  if (!getCSRFToken()) {
    generateCSRFToken();
  }
  
  // Add token to all forms
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const token = getCSRFToken();
    if (token && !form.querySelector('input[name="csrf_token"]')) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'csrf_token';
      input.value = token;
      form.appendChild(input);
    }
  });
}
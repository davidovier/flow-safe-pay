/**
 * Enhanced rate limiting for financial operations
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class FinancialRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  
  constructor(private config: RateLimitConfig) {}
  
  isAllowed(identifier: string): boolean {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }
    
    if (entry.count >= this.config.maxRequests) {
      return false;
    }
    
    entry.count++;
    return true;
  }
  
  getRemainingTime(identifier: string): number {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const entry = this.limits.get(key);
    
    if (!entry) return 0;
    
    return Math.max(0, entry.resetTime - Date.now());
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Predefined rate limiters for different financial operations
export const paymentRateLimiter = new FinancialRateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (userId) => `payment:${userId}`
});

export const payoutRateLimiter = new FinancialRateLimiter({
  maxRequests: 3,
  windowMs: 60 * 1000, // 1 minute
  keyGenerator: (userId) => `payout:${userId}`
});

export const disputeRateLimiter = new FinancialRateLimiter({
  maxRequests: 2,
  windowMs: 300 * 1000, // 5 minutes
  keyGenerator: (userId) => `dispute:${userId}`
});

// Cleanup old entries periodically
setInterval(() => {
  paymentRateLimiter.cleanup();
  payoutRateLimiter.cleanup();
  disputeRateLimiter.cleanup();
}, 60 * 1000); // Every minute

export { FinancialRateLimiter };
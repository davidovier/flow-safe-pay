/**
 * Advanced Rate Limiting and DDoS Protection for FlowPay
 * Multiple layers of protection with different strategies
 */

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (identifier: string) => string;
}

export interface BurstProtectionConfig {
  shortWindowMs: number;
  shortWindowLimit: number;
  longWindowMs: number;
  longWindowLimit: number;
}

export interface DDoSProtectionConfig {
  suspiciousThreshold: number;
  blockDuration: number;
  whitelistedIPs: string[];
  emergencyMode: boolean;
}

/**
 * Advanced Rate Limiter with burst protection
 */
export class AdvancedRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private blocked: Map<string, number> = new Map();
  private suspicious: Set<string> = new Set();

  constructor(
    private config: RateLimitConfig,
    private burstConfig?: BurstProtectionConfig,
    private ddosConfig?: DDoSProtectionConfig
  ) {}

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): { allowed: boolean; reason?: string; retryAfter?: number } {
    const now = Date.now();
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;

    // Check if IP is blocked
    const blockExpiry = this.blocked.get(key);
    if (blockExpiry && now < blockExpiry) {
      return {
        allowed: false,
        reason: 'IP temporarily blocked',
        retryAfter: Math.ceil((blockExpiry - now) / 1000)
      };
    }

    // Clean expired blocks
    if (blockExpiry && now >= blockExpiry) {
      this.blocked.delete(key);
      this.suspicious.delete(key);
    }

    // Emergency mode - stricter limits
    if (this.ddosConfig?.emergencyMode) {
      const emergencyLimit = Math.floor(this.config.maxRequests * 0.1);
      if (this.getRequestCount(key, this.config.windowMs) >= emergencyLimit) {
        this.blockIP(key, this.ddosConfig.blockDuration);
        return {
          allowed: false,
          reason: 'Emergency mode - request denied',
          retryAfter: Math.ceil(this.ddosConfig.blockDuration / 1000)
        };
      }
    }

    // Burst protection
    if (this.burstConfig) {
      const shortWindowCount = this.getRequestCount(key, this.burstConfig.shortWindowMs);
      if (shortWindowCount >= this.burstConfig.shortWindowLimit) {
        this.markSuspicious(key);
        return {
          allowed: false,
          reason: 'Burst limit exceeded',
          retryAfter: Math.ceil(this.burstConfig.shortWindowMs / 1000)
        };
      }
    }

    // Regular rate limiting
    const requestCount = this.getRequestCount(key, this.config.windowMs);
    if (requestCount >= this.config.maxRequests) {
      // Check if this should trigger DDoS protection
      if (this.ddosConfig && requestCount > this.ddosConfig.suspiciousThreshold) {
        this.markSuspicious(key);
        if (this.suspicious.has(key)) {
          this.blockIP(key, this.ddosConfig.blockDuration);
          return {
            allowed: false,
            reason: 'Suspicious activity detected',
            retryAfter: Math.ceil(this.ddosConfig.blockDuration / 1000)
          };
        }
      }

      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        retryAfter: Math.ceil(this.config.windowMs / 1000)
      };
    }

    // Record the request
    this.recordRequest(key);
    return { allowed: true };
  }

  /**
   * Get current request count for identifier
   */
  private getRequestCount(key: string, windowMs: number): number {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove expired requests
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);
    this.requests.set(key, validRequests);
    
    return validRequests.length;
  }

  /**
   * Record a new request
   */
  private recordRequest(key: string): void {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    requests.push(now);
    this.requests.set(key, requests);
  }

  /**
   * Mark IP as suspicious
   */
  private markSuspicious(key: string): void {
    this.suspicious.add(key);
  }

  /**
   * Block IP for specified duration
   */
  private blockIP(key: string, duration: number): void {
    const blockUntil = Date.now() + duration;
    this.blocked.set(key, blockUntil);
  }

  /**
   * Get remaining requests for identifier
   */
  getRemainingRequests(identifier: string): number {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    const currentCount = this.getRequestCount(key, this.config.windowMs);
    return Math.max(0, this.config.maxRequests - currentCount);
  }

  /**
   * Manually whitelist an IP
   */
  whitelist(identifier: string): void {
    const key = this.config.keyGenerator ? this.config.keyGenerator(identifier) : identifier;
    this.blocked.delete(key);
    this.suspicious.delete(key);
    this.requests.delete(key);
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeConnections: number;
    blockedIPs: number;
    suspiciousIPs: number;
    totalRequests: number;
  } {
    let totalRequests = 0;
    this.requests.forEach(requests => {
      totalRequests += requests.length;
    });

    return {
      activeConnections: this.requests.size,
      blockedIPs: this.blocked.size,
      suspiciousIPs: this.suspicious.size,
      totalRequests
    };
  }
}

/**
 * Endpoint-specific rate limiters
 */
export const rateLimiters = {
  // Authentication endpoints - stricter limits
  auth: new AdvancedRateLimiter(
    {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 15 // 15 attempts per 15 minutes
    },
    {
      shortWindowMs: 1 * 60 * 1000, // 1 minute
      shortWindowLimit: 10, // 10 attempts per minute
      longWindowMs: 60 * 60 * 1000, // 1 hour
      longWindowLimit: 20 // 20 attempts per hour
    },
    {
      suspiciousThreshold: 10,
      blockDuration: 60 * 60 * 1000, // 1 hour block
      whitelistedIPs: [],
      emergencyMode: false
    }
  ),

  // API endpoints - moderate limits
  api: new AdvancedRateLimiter(
    {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100 // 100 requests per 15 minutes
    },
    {
      shortWindowMs: 1 * 60 * 1000, // 1 minute
      shortWindowLimit: 20, // 20 requests per minute
      longWindowMs: 60 * 60 * 1000, // 1 hour
      longWindowLimit: 300 // 300 requests per hour
    },
    {
      suspiciousThreshold: 500,
      blockDuration: 30 * 60 * 1000, // 30 minutes block
      whitelistedIPs: [],
      emergencyMode: false
    }
  ),

  // File upload endpoints - very strict limits
  upload: new AdvancedRateLimiter(
    {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10 // 10 uploads per hour
    },
    {
      shortWindowMs: 5 * 60 * 1000, // 5 minutes
      shortWindowLimit: 2, // 2 uploads per 5 minutes
      longWindowMs: 24 * 60 * 60 * 1000, // 24 hours
      longWindowLimit: 50 // 50 uploads per day
    },
    {
      suspiciousThreshold: 20,
      blockDuration: 2 * 60 * 60 * 1000, // 2 hours block
      whitelistedIPs: [],
      emergencyMode: false
    }
  ),

  // Payment endpoints - strictest limits
  payment: new AdvancedRateLimiter(
    {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5 // 5 payment attempts per hour
    },
    {
      shortWindowMs: 10 * 60 * 1000, // 10 minutes
      shortWindowLimit: 1, // 1 payment per 10 minutes
      longWindowMs: 24 * 60 * 60 * 1000, // 24 hours
      longWindowLimit: 20 // 20 payments per day
    },
    {
      suspiciousThreshold: 10,
      blockDuration: 4 * 60 * 60 * 1000, // 4 hours block
      whitelistedIPs: [],
      emergencyMode: false
    }
  )
};

/**
 * Global DDoS protection middleware
 */
export class DDoSProtection {
  private globalStats: Map<string, {
    requests: number[];
    firstSeen: number;
    patterns: string[];
  }> = new Map();

  private emergencyMode = false;
  private emergencyModeExpiry = 0;

  constructor(private config: {
    globalRequestThreshold: number;
    emergencyDuration: number;
    patternDetection: boolean;
  }) {}

  /**
   * Analyze request for DDoS patterns
   */
  analyzeRequest(request: {
    ip: string;
    userAgent: string;
    path: string;
    timestamp: number;
  }): { blocked: boolean; reason?: string; emergencyMode?: boolean } {
    const now = Date.now();
    
    // Check if emergency mode should be disabled
    if (this.emergencyMode && now > this.emergencyModeExpiry) {
      this.emergencyMode = false;
    }

    const stats = this.globalStats.get(request.ip) || {
      requests: [],
      firstSeen: now,
      patterns: []
    };

    // Add current request
    stats.requests.push(now);
    stats.patterns.push(`${request.path}|${request.userAgent.substring(0, 50)}`);

    // Clean old data (keep last hour)
    const oneHour = 60 * 60 * 1000;
    stats.requests = stats.requests.filter(timestamp => now - timestamp < oneHour);
    if (stats.patterns.length > 100) {
      stats.patterns = stats.patterns.slice(-50);
    }

    this.globalStats.set(request.ip, stats);

    // Check for DDoS patterns
    const requestsLastMinute = stats.requests.filter(timestamp => now - timestamp < 60 * 1000).length;
    
    // Trigger emergency mode if too many requests
    if (requestsLastMinute > this.config.globalRequestThreshold) {
      this.activateEmergencyMode();
      return {
        blocked: true,
        reason: 'DDoS protection triggered',
        emergencyMode: true
      };
    }

    // Pattern-based detection
    if (this.config.patternDetection) {
      const uniquePatterns = new Set(stats.patterns.slice(-10)).size;
      if (stats.requests.length > 50 && uniquePatterns < 3) {
        return {
          blocked: true,
          reason: 'Suspicious request pattern detected'
        };
      }
    }

    return { blocked: false };
  }

  /**
   * Activate emergency mode
   */
  private activateEmergencyMode(): void {
    this.emergencyMode = true;
    this.emergencyModeExpiry = Date.now() + this.config.emergencyDuration;
    
    // Enable emergency mode on all rate limiters
    Object.values(rateLimiters).forEach(limiter => {
      if (limiter instanceof AdvancedRateLimiter && (limiter as any).ddosConfig) {
        (limiter as any).ddosConfig.emergencyMode = true;
      }
    });
  }

  /**
   * Get global statistics
   */
  getGlobalStats(): {
    emergencyMode: boolean;
    totalIPs: number;
    totalRequests: number;
    averageRequestsPerIP: number;
  } {
    let totalRequests = 0;
    this.globalStats.forEach(stats => {
      totalRequests += stats.requests.length;
    });

    return {
      emergencyMode: this.emergencyMode,
      totalIPs: this.globalStats.size,
      totalRequests,
      averageRequestsPerIP: this.globalStats.size > 0 ? totalRequests / this.globalStats.size : 0
    };
  }
}

/**
 * Global DDoS protection instance
 */
export const ddosProtection = new DDoSProtection({
  globalRequestThreshold: 100, // 100 requests per minute triggers emergency mode
  emergencyDuration: 10 * 60 * 1000, // 10 minutes emergency mode
  patternDetection: true
});

/**
 * Utility function to get client identifier
 */
export function getClientIdentifier(request: {
  ip?: string;
  headers: Record<string, string>;
}): string {
  // In order of preference: real IP, forwarded IP, user agent hash
  const realIP = request.headers['x-real-ip'];
  const forwardedIP = request.headers['x-forwarded-for']?.split(',')[0];
  const remoteIP = request.ip;
  const userAgent = request.headers['user-agent'];

  const identifier = realIP || forwardedIP || remoteIP || 'unknown';
  
  // Add user agent hash for additional uniqueness
  if (userAgent) {
    const hash = userAgent.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return `${identifier}:${hash}`;
  }

  return identifier;
}
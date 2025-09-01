/**
 * React hook for client-side rate limiting integration
 */

import React, { useState, useEffect, useCallback } from 'react';
import { rateLimiters } from '@/utils/security/rateLimiting';

export type RateLimitType = 'auth' | 'api' | 'upload' | 'payment';

export interface RateLimitState {
  isLimited: boolean;
  remaining: number;
  retryAfter?: number;
  reason?: string;
}

export interface RateLimitHookResult {
  state: RateLimitState;
  checkLimit: () => boolean;
  recordAttempt: () => void;
  resetLimit: () => void;
}

/**
 * Hook for managing rate limiting on the frontend
 */
export function useRateLimit(
  type: RateLimitType,
  identifier?: string
): RateLimitHookResult {
  const [state, setState] = useState<RateLimitState>({
    isLimited: false,
    remaining: 0
  });

  // Get user identifier (IP simulation for client-side)
  const getIdentifier = useCallback(() => {
    if (identifier) return identifier;
    
    // Fallback to browser fingerprinting for client-side rate limiting
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const platform = navigator.platform;
    const screenRes = `${window.screen.width}x${window.screen.height}`;
    
    return btoa(`${userAgent}:${language}:${platform}:${screenRes}`).substring(0, 20);
  }, [identifier]);

  // Check if request is allowed
  const checkLimit = useCallback((): boolean => {
    const id = getIdentifier();
    const limiter = rateLimiters[type];
    const result = limiter.isAllowed(id);
    
    setState({
      isLimited: !result.allowed,
      remaining: limiter.getRemainingRequests(id),
      retryAfter: result.retryAfter,
      reason: result.reason
    });
    
    return result.allowed;
  }, [type, getIdentifier]);

  // Record an attempt (for successful requests)
  const recordAttempt = useCallback(() => {
    const id = getIdentifier();
    rateLimiters[type].isAllowed(id); // This records the request
    
    // Update state
    setState(prevState => ({
      ...prevState,
      remaining: rateLimiters[type].getRemainingRequests(id)
    }));
  }, [type, getIdentifier]);

  // Reset rate limit (e.g., for whitelisting)
  const resetLimit = useCallback(() => {
    const id = getIdentifier();
    rateLimiters[type].whitelist(id);
    
    setState({
      isLimited: false,
      remaining: rateLimiters[type].getRemainingRequests(id)
    });
  }, [type, getIdentifier]);

  // Initialize state
  useEffect(() => {
    checkLimit();
  }, [checkLimit]);

  return {
    state,
    checkLimit,
    recordAttempt,
    resetLimit
  };
}

/**
 * Hook for monitoring rate limit across multiple endpoints
 */
export function useRateLimitMonitor() {
  const [stats, setStats] = useState<Record<RateLimitType, any>>({
    auth: null,
    api: null,
    upload: null,
    payment: null
  });

  const updateStats = useCallback(() => {
    const newStats = {
      auth: rateLimiters.auth.getStats(),
      api: rateLimiters.api.getStats(),
      upload: rateLimiters.upload.getStats(),
      payment: rateLimiters.payment.getStats()
    };
    setStats(newStats);
  }, []);

  // Update stats periodically
  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    stats,
    refresh: updateStats
  };
}

/**
 * Component wrapper for rate-limited actions - moved to separate .tsx file if needed
 */
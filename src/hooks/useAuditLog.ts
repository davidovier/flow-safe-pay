/**
 * React hook for audit logging integration
 */

import { useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  auditLogger, 
  logAuthEvent, 
  logSecurityEvent, 
  logDataAccess, 
  logBusinessEvent,
  AuditEventType,
  AuditQuery 
} from '@/utils/security/auditLogger';

/**
 * Hook for audit logging with user context
 */
export function useAuditLog() {
  const { user } = useAuth();

  // Log authentication events
  const logAuth = useCallback((
    type: Extract<AuditEventType, `AUTH_${string}`>,
    details: Record<string, any> = {}
  ) => {
    logAuthEvent(type, user?.id, {
      ...details,
      user_role: user?.role,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  // Log security events
  const logSecurity = useCallback((
    type: Extract<AuditEventType, `SECURITY_${string}`>,
    details: Record<string, any> = {}
  ) => {
    logSecurityEvent(type, {
      ...details,
      user_id: user?.id,
      user_role: user?.role,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  // Log data access events
  const logDataAccess = useCallback((
    type: Extract<AuditEventType, `DATA_${string}`>,
    resource: string,
    details: Record<string, any> = {}
  ) => {
    logDataAccess(type, resource, {
      ...details,
      user_id: user?.id,
      user_role: user?.role,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  // Log business events
  const logBusiness = useCallback((
    type: Exclude<AuditEventType, `AUTH_${string}` | `SECURITY_${string}` | `DATA_${string}` | `ADMIN_${string}` | `SYSTEM_${string}`>,
    details: Record<string, any> = {}
  ) => {
    logBusinessEvent(type, {
      ...details,
      user_role: user?.role,
      timestamp: new Date().toISOString()
    }, user?.id);
  }, [user]);

  // Generic log function
  const log = useCallback(async (
    type: AuditEventType,
    action: string,
    details: Record<string, any> = {},
    options: {
      severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      resource?: string;
      outcome?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
    } = {}
  ) => {
    await auditLogger.log(type, action, {
      ...details,
      user_role: user?.role,
      timestamp: new Date().toISOString()
    }, {
      ...options,
      userId: user?.id,
      userRole: user?.role
    });
  }, [user]);

  // Query audit events
  const queryEvents = useCallback((params: AuditQuery = {}) => {
    return auditLogger.query({
      ...params,
      userId: params.userId || user?.id // Default to current user
    });
  }, [user]);

  // Get statistics
  const getStats = useCallback((timeframe: 'hour' | 'day' | 'week' = 'day') => {
    return auditLogger.getStatistics(timeframe);
  }, []);

  return {
    logAuth,
    logSecurity,
    logDataAccess,
    logBusiness,
    log,
    queryEvents,
    getStats
  };
}

/**
 * Hook for automatic page view logging
 */
export function usePageViewAudit(pageName: string, resource?: string) {
  const { logDataAccess } = useAuditLog();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      logDataAccess('DATA_ACCESS_USER_PROFILE', resource || pageName, {
        page: pageName,
        access_time: new Date().toISOString(),
        referrer: document.referrer || 'direct'
      });
    }
  }, [pageName, resource, user, logDataAccess]);
}

/**
 * Hook for automatic error logging
 */
export function useErrorAudit() {
  const { log } = useAuditLog();

  const logError = useCallback((
    error: Error,
    context: string,
    additionalDetails: Record<string, any> = {}
  ) => {
    log('SYSTEM_ERROR', `Error in ${context}`, {
      error_message: error.message,
      error_stack: error.stack,
      context,
      ...additionalDetails
    }, {
      severity: 'HIGH',
      outcome: 'FAILURE'
    });
  }, [log]);

  // Set up global error handler
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      logError(
        new Error(event.message),
        'Global Error Handler',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          url: window.location.href
        }
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logError(
        new Error(event.reason?.toString() || 'Unhandled Promise Rejection'),
        'Promise Rejection',
        {
          reason: event.reason,
          url: window.location.href
        }
      );
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [logError]);

  return { logError };
}

/**
 * Higher-order component for automatic audit logging - moved to separate .tsx file if needed
 */
/**
 * Comprehensive audit logging and monitoring system for FlowPay
 * Tracks security events, user actions, and system activities
 */

export type AuditEventType =
  // Authentication events
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILURE'
  | 'AUTH_LOGOUT'
  | 'AUTH_SIGNUP'
  | 'AUTH_PASSWORD_RESET'
  | 'AUTH_EMAIL_VERIFICATION'
  | 'AUTH_MFA_ENABLED'
  | 'AUTH_MFA_DISABLED'
  
  // Security events
  | 'SECURITY_RATE_LIMIT_EXCEEDED'
  | 'SECURITY_SUSPICIOUS_ACTIVITY'
  | 'SECURITY_XSS_ATTEMPT'
  | 'SECURITY_CSRF_VIOLATION'
  | 'SECURITY_FILE_UPLOAD_REJECTED'
  | 'SECURITY_IP_BLOCKED'
  | 'SECURITY_MALWARE_DETECTED'
  
  // Data access events
  | 'DATA_ACCESS_USER_PROFILE'
  | 'DATA_ACCESS_FINANCIAL_INFO'
  | 'DATA_ACCESS_KYC_INFO'
  | 'DATA_MODIFICATION_USER_PROFILE'
  | 'DATA_MODIFICATION_FINANCIAL_INFO'
  | 'DATA_EXPORT_REQUEST'
  | 'DATA_DELETION_REQUEST'
  
  // Business events
  | 'DEAL_CREATED'
  | 'DEAL_FUNDED'
  | 'DEAL_COMPLETED'
  | 'DEAL_DISPUTED'
  | 'PAYMENT_PROCESSED'
  | 'PAYMENT_FAILED'
  | 'KYC_SUBMITTED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'FILE_UPLOADED'
  | 'FILE_DOWNLOADED'
  
  // Administrative events
  | 'ADMIN_LOGIN'
  | 'ADMIN_USER_IMPERSONATION'
  | 'ADMIN_SETTING_CHANGE'
  | 'ADMIN_BULK_ACTION'
  | 'SYSTEM_ERROR'
  | 'SYSTEM_MAINTENANCE';

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  action: string;
  details: Record<string, any>;
  metadata: {
    source: string;
    version: string;
    environment: string;
  };
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  risk_score?: number;
}

export interface AuditQuery {
  userId?: string;
  type?: AuditEventType[];
  severity?: AuditSeverity[];
  startDate?: Date;
  endDate?: Date;
  outcome?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  limit?: number;
  offset?: number;
}

/**
 * Risk scoring for events
 */
const RISK_SCORES: Record<AuditEventType, number> = {
  // Authentication - moderate risk
  'AUTH_LOGIN_SUCCESS': 1,
  'AUTH_LOGIN_FAILURE': 3,
  'AUTH_LOGOUT': 1,
  'AUTH_SIGNUP': 2,
  'AUTH_PASSWORD_RESET': 4,
  'AUTH_EMAIL_VERIFICATION': 1,
  'AUTH_MFA_ENABLED': -1, // Positive security action
  'AUTH_MFA_DISABLED': 6,

  // Security events - high risk
  'SECURITY_RATE_LIMIT_EXCEEDED': 7,
  'SECURITY_SUSPICIOUS_ACTIVITY': 8,
  'SECURITY_XSS_ATTEMPT': 9,
  'SECURITY_CSRF_VIOLATION': 8,
  'SECURITY_FILE_UPLOAD_REJECTED': 5,
  'SECURITY_IP_BLOCKED': 7,
  'SECURITY_MALWARE_DETECTED': 10,

  // Data access - varies by sensitivity
  'DATA_ACCESS_USER_PROFILE': 2,
  'DATA_ACCESS_FINANCIAL_INFO': 5,
  'DATA_ACCESS_KYC_INFO': 6,
  'DATA_MODIFICATION_USER_PROFILE': 3,
  'DATA_MODIFICATION_FINANCIAL_INFO': 7,
  'DATA_EXPORT_REQUEST': 6,
  'DATA_DELETION_REQUEST': 8,

  // Business events - low to moderate
  'DEAL_CREATED': 2,
  'DEAL_FUNDED': 4,
  'DEAL_COMPLETED': 2,
  'DEAL_DISPUTED': 6,
  'PAYMENT_PROCESSED': 3,
  'PAYMENT_FAILED': 5,
  'KYC_SUBMITTED': 2,
  'KYC_APPROVED': 1,
  'KYC_REJECTED': 3,
  'FILE_UPLOADED': 2,
  'FILE_DOWNLOADED': 2,

  // Administrative - high risk
  'ADMIN_LOGIN': 4,
  'ADMIN_USER_IMPERSONATION': 9,
  'ADMIN_SETTING_CHANGE': 6,
  'ADMIN_BULK_ACTION': 7,
  'SYSTEM_ERROR': 4,
  'SYSTEM_MAINTENANCE': 2
};

/**
 * Main audit logger class
 */
export class AuditLogger {
  private events: AuditEvent[] = [];
  private maxEvents = 10000; // Keep last 10k events in memory
  private persistenceEnabled = true;

  constructor() {
    // Load existing events from localStorage in development
    if (typeof window !== 'undefined' && localStorage.getItem('audit_events')) {
      try {
        this.events = JSON.parse(localStorage.getItem('audit_events') || '[]');
      } catch (error) {
        console.warn('Failed to load audit events from storage:', error);
      }
    }

    // Persist events every 5 minutes
    if (typeof window !== 'undefined') {
      setInterval(() => this.persistEvents(), 5 * 60 * 1000);
    }
  }

  /**
   * Log an audit event
   */
  async log(
    type: AuditEventType,
    action: string,
    details: Record<string, any> = {},
    options: {
      userId?: string;
      userRole?: string;
      severity?: AuditSeverity;
      resource?: string;
      outcome?: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
    } = {}
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type,
      severity: options.severity || this.determineSeverity(type),
      userId: options.userId,
      userRole: options.userRole,
      sessionId: this.getSessionId(),
      ipAddress: await this.getClientIP(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      resource: options.resource,
      action,
      details,
      metadata: {
        source: 'flowpay-web',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      },
      outcome: options.outcome || 'SUCCESS',
      risk_score: this.calculateRiskScore(type, details)
    };

    // Add to in-memory storage
    this.events.push(event);

    // Maintain size limit
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Immediate persistence for high-risk events
    if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
      await this.persistEvents();
    }

    // Send to monitoring service for critical events
    if (event.severity === 'CRITICAL') {
      this.sendToMonitoring(event);
    }

    // Real-time alerting for security events
    if (type.startsWith('SECURITY_')) {
      this.checkForAnomalies(event);
    }

    console.debug('Audit event logged:', event);
  }

  /**
   * Query audit events
   */
  query(params: AuditQuery = {}): AuditEvent[] {
    let filtered = [...this.events];

    if (params.userId) {
      filtered = filtered.filter(e => e.userId === params.userId);
    }

    if (params.type && params.type.length > 0) {
      filtered = filtered.filter(e => params.type!.includes(e.type));
    }

    if (params.severity && params.severity.length > 0) {
      filtered = filtered.filter(e => params.severity!.includes(e.severity));
    }

    if (params.startDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) >= params.startDate!);
    }

    if (params.endDate) {
      filtered = filtered.filter(e => new Date(e.timestamp) <= params.endDate!);
    }

    if (params.outcome) {
      filtered = filtered.filter(e => e.outcome === params.outcome);
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const offset = params.offset || 0;
    const limit = params.limit || 100;
    
    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get audit statistics
   */
  getStatistics(timeframe: 'hour' | 'day' | 'week' = 'day'): {
    totalEvents: number;
    eventsByType: Record<AuditEventType, number>;
    eventsBySeverity: Record<AuditSeverity, number>;
    successRate: number;
    topUsers: Array<{userId: string; eventCount: number}>;
    riskScore: number;
  } {
    const cutoff = new Date();
    switch (timeframe) {
      case 'hour':
        cutoff.setHours(cutoff.getHours() - 1);
        break;
      case 'day':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case 'week':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
    }

    const relevantEvents = this.events.filter(e => new Date(e.timestamp) >= cutoff);

    const eventsByType = relevantEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<AuditEventType, number>);

    const eventsBySeverity = relevantEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<AuditSeverity, number>);

    const successfulEvents = relevantEvents.filter(e => e.outcome === 'SUCCESS').length;
    const successRate = relevantEvents.length > 0 ? successfulEvents / relevantEvents.length : 0;

    const userCounts = relevantEvents.reduce((acc, event) => {
      if (event.userId) {
        acc[event.userId] = (acc[event.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topUsers = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([userId, eventCount]) => ({ userId, eventCount }));

    const averageRiskScore = relevantEvents.reduce((sum, event) => sum + (event.risk_score || 0), 0) / relevantEvents.length;

    return {
      totalEvents: relevantEvents.length,
      eventsByType,
      eventsBySeverity,
      successRate,
      topUsers,
      riskScore: averageRiskScore || 0
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine severity based on event type
   */
  private determineSeverity(type: AuditEventType): AuditSeverity {
    const riskScore = RISK_SCORES[type] || 3;
    
    if (riskScore >= 8) return 'CRITICAL';
    if (riskScore >= 6) return 'HIGH';
    if (riskScore >= 3) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Calculate risk score for event
   */
  private calculateRiskScore(type: AuditEventType, details: Record<string, any>): number {
    let baseScore = RISK_SCORES[type] || 3;

    // Adjust based on details
    if (details.repeated_attempts && details.repeated_attempts > 3) {
      baseScore += 2;
    }

    if (details.suspicious_patterns) {
      baseScore += 3;
    }

    if (details.high_value_transaction) {
      baseScore += 2;
    }

    if (details.admin_action) {
      baseScore += 1;
    }

    return Math.min(baseScore, 10); // Cap at 10
  }

  /**
   * Get session ID from browser
   */
  private getSessionId(): string | undefined {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('session_id') || undefined;
    }
    return undefined;
  }

  /**
   * Get client IP address
   */
  private async getClientIP(): Promise<string | undefined> {
    // In a real application, this would be handled by the server
    // For client-side, we can't get the real IP
    return 'client-side';
  }

  /**
   * Persist events to storage
   */
  private async persistEvents(): Promise<void> {
    if (!this.persistenceEnabled) return;

    try {
      if (typeof window !== 'undefined') {
        // Store in localStorage for development
        localStorage.setItem('audit_events', JSON.stringify(this.events));
      }

      // In production, send to backend API
      if (process.env.NODE_ENV === 'production') {
        await this.sendToBackend(this.events.slice(-100)); // Send last 100 events
      }
    } catch (error) {
      console.error('Failed to persist audit events:', error);
    }
  }

  /**
   * Send events to backend API
   */
  private async sendToBackend(events: AuditEvent[]): Promise<void> {
    try {
      await fetch('/api/audit/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events })
      });
    } catch (error) {
      console.error('Failed to send audit events to backend:', error);
    }
  }

  /**
   * Send critical events to monitoring service
   */
  private sendToMonitoring(event: AuditEvent): void {
    // In production, integrate with monitoring services like Sentry, DataDog, etc.
    console.error('CRITICAL AUDIT EVENT:', event);
    
    // Store critical events separately
    if (typeof window !== 'undefined') {
      const criticalEvents = JSON.parse(localStorage.getItem('critical_audit_events') || '[]');
      criticalEvents.push(event);
      localStorage.setItem('critical_audit_events', JSON.stringify(criticalEvents));
    }
  }

  /**
   * Check for anomalous patterns
   */
  private checkForAnomalies(event: AuditEvent): void {
    const recentEvents = this.events.filter(e => 
      new Date().getTime() - new Date(e.timestamp).getTime() < 15 * 60 * 1000 // Last 15 minutes
    );

    // Check for repeated security events from same IP/user
    const similarEvents = recentEvents.filter(e => 
      e.type === event.type && 
      (e.ipAddress === event.ipAddress || e.userId === event.userId)
    );

    if (similarEvents.length >= 3) {
      this.log('SECURITY_SUSPICIOUS_ACTIVITY', 'Repeated security events detected', {
        original_event_type: event.type,
        occurrence_count: similarEvents.length,
        time_window: '15_minutes'
      }, { severity: 'HIGH' });
    }
  }
}

/**
 * Global audit logger instance
 */
export const auditLogger = new AuditLogger();

/**
 * Convenience functions for common audit events
 */
export const logAuthEvent = (
  type: Extract<AuditEventType, `AUTH_${string}`>,
  userId?: string,
  details: Record<string, any> = {}
) => auditLogger.log(type, `User ${type.toLowerCase()}`, details, { userId });

export const logSecurityEvent = (
  type: Extract<AuditEventType, `SECURITY_${string}`>,
  details: Record<string, any> = {}
) => auditLogger.log(type, `Security event: ${type.toLowerCase()}`, details, { severity: 'HIGH' });

export const logDataAccess = (
  type: Extract<AuditEventType, `DATA_${string}`>,
  resource: string,
  userId?: string,
  details: Record<string, any> = {}
) => auditLogger.log(type, `Data access: ${resource}`, details, { userId, resource });

export const logBusinessEvent = (
  type: Exclude<AuditEventType, `AUTH_${string}` | `SECURITY_${string}` | `DATA_${string}` | `ADMIN_${string}` | `SYSTEM_${string}`>,
  details: Record<string, any> = {},
  userId?: string
) => auditLogger.log(type, `Business event: ${type.toLowerCase()}`, details, { userId });
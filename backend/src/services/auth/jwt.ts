import jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger.js';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface JWTVerificationResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}

export class JWTService {
  private readonly secret: string;
  private readonly defaultExpiry: string;
  
  constructor() {
    this.secret = process.env.JWT_SECRET || 'default-development-secret-change-in-production';
    this.defaultExpiry = process.env.JWT_EXPIRES_IN || '7d';
    
    if (this.secret === 'default-development-secret-change-in-production' && process.env.NODE_ENV === 'production') {
      logger.warn('Using default JWT secret in production - this is insecure!');
    }
  }

  /**
   * Sign a JWT token with the given payload
   */
  sign(payload: Omit<JWTPayload, 'iat' | 'exp'>, options?: jwt.SignOptions): string {
    try {
      const token = jwt.sign(payload, this.secret, {
        expiresIn: this.defaultExpiry,
        issuer: 'flowpay',
        audience: 'flowpay-api',
        ...options
      });

      logger.debug('JWT token signed', {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        expiresIn: options?.expiresIn || this.defaultExpiry
      });

      return token;
    } catch (error) {
      logger.error('Failed to sign JWT token', { error, payload });
      throw new Error('Failed to sign JWT token');
    }
  }

  /**
   * Verify a JWT token and return the payload
   */
  verify(token: string): JWTVerificationResult {
    try {
      const payload = jwt.verify(token, this.secret, {
        issuer: 'flowpay',
        audience: 'flowpay-api',
      }) as JWTPayload;

      return {
        valid: true,
        payload
      };
    } catch (error) {
      let errorMessage = 'Unknown JWT error';

      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token has expired';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = 'Invalid token';
      } else if (error instanceof jwt.NotBeforeError) {
        errorMessage = 'Token not active';
      }

      logger.debug('JWT verification failed', { error: errorMessage });

      return {
        valid: false,
        error: errorMessage
      };
    }
  }

  /**
   * Verify token without throwing errors (used for WebSocket auth)
   */
  verifyAsync(token: string): Promise<JWTVerificationResult> {
    return new Promise((resolve) => {
      try {
        jwt.verify(token, this.secret, {
          issuer: 'flowpay',
          audience: 'flowpay-api',
        }, (error, payload) => {
          if (error) {
            let errorMessage = 'Unknown JWT error';

            if (error instanceof jwt.TokenExpiredError) {
              errorMessage = 'Token has expired';
            } else if (error instanceof jwt.JsonWebTokenError) {
              errorMessage = 'Invalid token';
            } else if (error instanceof jwt.NotBeforeError) {
              errorMessage = 'Token not active';
            }

            resolve({
              valid: false,
              error: errorMessage
            });
          } else {
            resolve({
              valid: true,
              payload: payload as JWTPayload
            });
          }
        });
      } catch (error) {
        resolve({
          valid: false,
          error: 'Token verification failed'
        });
      }
    });
  }

  /**
   * Decode token without verification (for debugging)
   */
  decode(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch (error) {
      logger.error('Failed to decode JWT token', { error });
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token: string): Date | null {
    const decoded = this.decode(token);
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token: string): boolean {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return true;
    }

    return expiration.getTime() <= Date.now();
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiration(token: string): number | null {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) {
      return null;
    }

    const timeUntilExpiration = expiration.getTime() - Date.now();
    return timeUntilExpiration > 0 ? timeUntilExpiration : 0;
  }
}

// Export singleton instance
export const jwtService = new JWTService();
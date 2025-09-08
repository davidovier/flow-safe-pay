import { randomBytes, createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger.js';

export interface RefreshTokenPayload {
  userId: string;
  email: string;
  role: string;
  tokenId: string;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface StoredRefreshToken {
  tokenHash: string;
  userId: string;
  email: string;
  role: string;
  deviceId?: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
  lastUsed: Date;
}

export class RefreshTokenService {
  private prisma: PrismaClient;
  private readonly TOKEN_LENGTH = 64; // bytes
  private readonly TOKEN_EXPIRY_DAYS = 30;
  private readonly MAX_TOKENS_PER_USER = 5;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate a new refresh token for a user
   */
  async generateRefreshToken(payload: {
    userId: string;
    email: string;
    role: string;
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<string> {
    try {
      // Generate secure random token
      const tokenBytes = randomBytes(this.TOKEN_LENGTH);
      const token = tokenBytes.toString('base64url');
      
      // Create hash for storage (never store raw tokens)
      const tokenHash = this.hashToken(token);
      
      // Set expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);

      // Clean up old tokens for this user if needed
      await this.cleanupUserTokens(payload.userId);

      // Store token hash in database
      await this.prisma.$executeRaw`
        INSERT INTO refresh_tokens (
          token_hash, user_id, email, role, device_id, user_agent, 
          ip_address, expires_at, created_at, last_used
        ) VALUES (
          ${tokenHash}, ${payload.userId}, ${payload.email}, ${payload.role},
          ${payload.deviceId || null}, ${payload.userAgent || null}, 
          ${payload.ipAddress || null}, ${expiresAt}, NOW(), NOW()
        )
      `;

      logger.info(`Refresh token generated for user ${payload.userId}`, {
        userId: payload.userId,
        deviceId: payload.deviceId,
        expiresAt: expiresAt.toISOString()
      });

      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token', { error, userId: payload.userId });
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Validate and refresh an access token using a refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    jwtSign: (payload: any) => Promise<string>
  ): Promise<{
    accessToken: string;
    newRefreshToken: string;
    user: { id: string; email: string; role: string; kycStatus: string };
  }> {
    try {
      const tokenHash = this.hashToken(refreshToken);

      // Find the stored token
      const storedTokens = await this.prisma.$queryRaw<StoredRefreshToken[]>`
        SELECT token_hash, user_id, email, role, device_id, user_agent, 
               ip_address, expires_at, created_at, last_used
        FROM refresh_tokens 
        WHERE token_hash = ${tokenHash} AND expires_at > NOW()
        LIMIT 1
      `;

      if (storedTokens.length === 0) {
        throw new Error('Invalid or expired refresh token');
      }

      const storedToken = storedTokens[0];

      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: storedToken.userId },
        select: {
          id: true,
          email: true,
          role: true,
          kycStatus: true,
          deletedAt: true
        }
      });

      if (!user || user.kycStatus === 'DELETED' || user.deletedAt) {
        // Clean up tokens for deleted user
        await this.revokeUserTokens(storedToken.userId);
        throw new Error('User account no longer active');
      }

      // Update last used timestamp
      await this.prisma.$executeRaw`
        UPDATE refresh_tokens 
        SET last_used = NOW() 
        WHERE token_hash = ${tokenHash}
      `;

      // Generate new access token
      const accessToken = await jwtSign({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Generate new refresh token (rotate)
      const newRefreshToken = await this.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceId: storedToken.deviceId,
        userAgent: storedToken.userAgent,
        ipAddress: storedToken.ipAddress,
      });

      // Revoke the old refresh token
      await this.revokeToken(refreshToken);

      logger.info(`Access token refreshed for user ${user.id}`, {
        userId: user.id,
        email: user.email
      });

      return {
        accessToken,
        newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          kycStatus: user.kycStatus
        }
      };
    } catch (error) {
      logger.error('Failed to refresh access token', { error });
      throw error;
    }
  }

  /**
   * Revoke a specific refresh token
   */
  async revokeToken(refreshToken: string): Promise<void> {
    try {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.$executeRaw`
        DELETE FROM refresh_tokens WHERE token_hash = ${tokenHash}
      `;
      logger.debug('Refresh token revoked', { tokenHash: tokenHash.substring(0, 8) + '...' });
    } catch (error) {
      logger.error('Failed to revoke refresh token', { error });
      throw new Error('Failed to revoke refresh token');
    }
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeUserTokens(userId: string): Promise<void> {
    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM refresh_tokens WHERE user_id = ${userId}
      `;
      logger.info(`All refresh tokens revoked for user ${userId}`, { userId });
    } catch (error) {
      logger.error('Failed to revoke user tokens', { error, userId });
      throw new Error('Failed to revoke user tokens');
    }
  }

  /**
   * Clean up expired tokens and enforce user token limits
   */
  private async cleanupUserTokens(userId: string): Promise<void> {
    try {
      // Remove expired tokens
      await this.prisma.$executeRaw`
        DELETE FROM refresh_tokens WHERE expires_at <= NOW()
      `;

      // Enforce max tokens per user (remove oldest if needed)
      await this.prisma.$executeRaw`
        DELETE FROM refresh_tokens 
        WHERE user_id = ${userId} 
        AND token_hash NOT IN (
          SELECT token_hash FROM refresh_tokens 
          WHERE user_id = ${userId} 
          ORDER BY created_at DESC 
          LIMIT ${this.MAX_TOKENS_PER_USER - 1}
        )
      `;
    } catch (error) {
      logger.error('Failed to cleanup user tokens', { error, userId });
    }
  }

  /**
   * Create SHA-256 hash of token for secure storage
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get active refresh tokens for a user (for admin/debugging)
   */
  async getUserTokens(userId: string): Promise<Array<{
    deviceId?: string;
    userAgent?: string;
    ipAddress?: string;
    createdAt: Date;
    lastUsed: Date;
    expiresAt: Date;
  }>> {
    try {
      const tokens = await this.prisma.$queryRaw<StoredRefreshToken[]>`
        SELECT device_id, user_agent, ip_address, created_at, last_used, expires_at
        FROM refresh_tokens 
        WHERE user_id = ${userId} AND expires_at > NOW()
        ORDER BY last_used DESC
      `;

      return tokens.map(token => ({
        deviceId: token.deviceId,
        userAgent: token.userAgent,
        ipAddress: token.ipAddress,
        createdAt: token.createdAt,
        lastUsed: token.lastUsed,
        expiresAt: token.expiresAt
      }));
    } catch (error) {
      logger.error('Failed to get user tokens', { error, userId });
      return [];
    }
  }
}
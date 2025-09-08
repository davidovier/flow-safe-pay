import { createHash } from 'crypto';
import { logger } from '../utils/logger.js';

export interface DeliverableData {
  url?: string;
  fileUrl?: string;
  fileHash?: string;
  description?: string;
  requirements?: {
    hashtags?: string[];
    mentions?: string[];
    contentType?: string;
    minDuration?: number; // for videos
    minWords?: number; // for text content
  };
}

export interface ValidationResult {
  urlAccessible: boolean;
  contentMatches: boolean;
  hashVerified: boolean;
  requirementsMet: boolean;
  timestamp: string;
  errors: string[];
  warnings: string[];
  details: {
    httpStatus?: number;
    contentType?: string;
    contentLength?: number;
    detectedHashtags?: string[];
    detectedMentions?: string[];
    wordCount?: number;
    duration?: number;
  };
}

export class DeliverableValidationService {
  private readonly MAX_CONTENT_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly REQUEST_TIMEOUT = 30000; // 30 seconds
  private readonly ALLOWED_CONTENT_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/avi', 'video/mov', 'video/webm',
    'text/html', 'text/plain', 'application/json'
  ];

  /**
   * Validate a deliverable submission
   */
  async validateDeliverable(deliverable: DeliverableData): Promise<ValidationResult> {
    const result: ValidationResult = {
      urlAccessible: false,
      contentMatches: false,
      hashVerified: false,
      requirementsMet: false,
      timestamp: new Date().toISOString(),
      errors: [],
      warnings: [],
      details: {}
    };

    try {
      // Validate URL accessibility if provided
      if (deliverable.url) {
        await this.validateUrlAccessibility(deliverable.url, result);
      }

      // Validate file hash if provided
      if (deliverable.fileUrl && deliverable.fileHash) {
        await this.validateFileHash(deliverable.fileUrl, deliverable.fileHash, result);
      }

      // Validate content requirements
      if (deliverable.requirements) {
        await this.validateContentRequirements(deliverable, result);
      }

      // Determine overall success
      result.requirementsMet = this.determineOverallSuccess(result);

      logger.info('Deliverable validation completed', {
        urlAccessible: result.urlAccessible,
        hashVerified: result.hashVerified,
        requirementsMet: result.requirementsMet,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      });

      return result;

    } catch (error) {
      logger.error('Deliverable validation failed', { error });
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Check if a URL is accessible and gather metadata
   */
  private async validateUrlAccessibility(url: string, result: ValidationResult): Promise<void> {
    try {
      // Basic URL format validation
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        result.errors.push('URL must use HTTP or HTTPS protocol');
        return;
      }

      // Make HEAD request first to check accessibility without downloading content
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'User-Agent': 'FlowPay-Validator/1.0'
          }
        });

        clearTimeout(timeoutId);
        result.details.httpStatus = response.status;

        if (response.ok) {
          result.urlAccessible = true;
          
          // Gather content metadata
          const contentType = response.headers.get('content-type');
          const contentLength = response.headers.get('content-length');
          
          if (contentType) {
            result.details.contentType = contentType;
            
            // Validate content type if it's a media file
            const isAllowed = this.ALLOWED_CONTENT_TYPES.some(type => 
              contentType.toLowerCase().includes(type.toLowerCase())
            );
            
            if (!isAllowed) {
              result.warnings.push(`Unusual content type detected: ${contentType}`);
            }
          }

          if (contentLength) {
            const size = parseInt(contentLength, 10);
            result.details.contentLength = size;
            
            if (size > this.MAX_CONTENT_SIZE) {
              result.warnings.push(`Content size (${this.formatBytes(size)}) exceeds recommended maximum`);
            }
          }

        } else {
          result.errors.push(`URL returned ${response.status} ${response.statusText}`);
        }

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          result.errors.push(`URL request timed out after ${this.REQUEST_TIMEOUT}ms`);
        } else {
          result.errors.push(`URL accessibility check failed: ${error.message}`);
        }
      } else {
        result.errors.push('Unknown error during URL validation');
      }
    }
  }

  /**
   * Validate file hash by downloading and comparing
   */
  private async validateFileHash(fileUrl: string, expectedHash: string, result: ValidationResult): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT * 2); // Longer timeout for file downloads

      try {
        const response = await fetch(fileUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'FlowPay-Validator/1.0'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          result.errors.push(`File URL returned ${response.status} ${response.statusText}`);
          return;
        }

        // Check content length before downloading
        const contentLength = response.headers.get('content-length');
        if (contentLength) {
          const size = parseInt(contentLength, 10);
          if (size > this.MAX_CONTENT_SIZE) {
            result.errors.push(`File too large for hash validation: ${this.formatBytes(size)}`);
            return;
          }
        }

        // Download and hash the content
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Calculate SHA-256 hash
        const actualHash = createHash('sha256').update(buffer).digest('hex');
        
        if (actualHash.toLowerCase() === expectedHash.toLowerCase()) {
          result.hashVerified = true;
        } else {
          result.errors.push('File hash does not match expected value');
          result.details.actualHash = actualHash;
        }

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          result.errors.push(`File download timed out during hash validation`);
        } else {
          result.errors.push(`Hash validation failed: ${error.message}`);
        }
      } else {
        result.errors.push('Unknown error during hash validation');
      }
    }
  }

  /**
   * Validate content requirements (hashtags, mentions, etc.)
   */
  private async validateContentRequirements(deliverable: DeliverableData, result: ValidationResult): Promise<void> {
    if (!deliverable.url || !deliverable.requirements) {
      return;
    }

    try {
      // For social media content, try to fetch and analyze the page
      if (this.isSocialMediaUrl(deliverable.url)) {
        await this.validateSocialMediaContent(deliverable, result);
      } else {
        // For other content types, perform basic validation
        await this.validateGenericContent(deliverable, result);
      }

    } catch (error) {
      logger.warn('Content requirement validation failed', { error, url: deliverable.url });
      result.warnings.push('Could not validate content requirements automatically');
    }
  }

  /**
   * Validate social media content (Instagram, Twitter, TikTok, etc.)
   */
  private async validateSocialMediaContent(deliverable: DeliverableData, result: ValidationResult): Promise<void> {
    // Note: This is a simplified implementation
    // In production, you'd want to use official APIs when available
    
    const requirements = deliverable.requirements!;
    
    if (requirements.hashtags?.length) {
      // For now, we'll mark this as a warning since we can't easily scrape social media
      result.warnings.push(`Please manually verify hashtags: ${requirements.hashtags.join(', ')}`);
    }

    if (requirements.mentions?.length) {
      result.warnings.push(`Please manually verify mentions: ${requirements.mentions.join(', ')}`);
    }

    // Social media URLs are considered to match content requirements if accessible
    if (result.urlAccessible) {
      result.contentMatches = true;
    }
  }

  /**
   * Validate generic web content
   */
  private async validateGenericContent(deliverable: DeliverableData, result: ValidationResult): Promise<void> {
    if (!deliverable.url) return;

    try {
      // Fetch content for analysis
      const response = await fetch(deliverable.url, {
        headers: {
          'User-Agent': 'FlowPay-Validator/1.0'
        }
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        
        if (contentType.includes('text/html')) {
          const html = await response.text();
          this.analyzeHtmlContent(html, deliverable.requirements!, result);
        } else if (contentType.includes('text/plain')) {
          const text = await response.text();
          this.analyzeTextContent(text, deliverable.requirements!, result);
        } else {
          // For other content types, assume requirements are met if URL is accessible
          result.contentMatches = result.urlAccessible;
        }
      }

    } catch (error) {
      result.warnings.push('Could not analyze content automatically');
    }
  }

  /**
   * Analyze HTML content for hashtags, mentions, and other requirements
   */
  private analyzeHtmlContent(html: string, requirements: any, result: ValidationResult): void {
    // Remove HTML tags for text analysis
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    this.analyzeTextContent(text, requirements, result);
  }

  /**
   * Analyze text content for requirements
   */
  private analyzeTextContent(text: string, requirements: any, result: ValidationResult): void {
    let matches = 0;
    let total = 0;

    // Check hashtags
    if (requirements.hashtags?.length) {
      total++;
      const detectedHashtags = text.match(/#\w+/g) || [];
      result.details.detectedHashtags = detectedHashtags.map(tag => tag.toLowerCase());
      
      const requiredHashtags = requirements.hashtags.map((tag: string) => 
        tag.startsWith('#') ? tag.toLowerCase() : `#${tag}`.toLowerCase()
      );

      const hasAllHashtags = requiredHashtags.every((tag: string) => 
        result.details.detectedHashtags?.includes(tag)
      );

      if (hasAllHashtags) {
        matches++;
      } else {
        result.warnings.push(`Missing required hashtags: ${requiredHashtags.join(', ')}`);
      }
    }

    // Check mentions
    if (requirements.mentions?.length) {
      total++;
      const detectedMentions = text.match(/@\w+/g) || [];
      result.details.detectedMentions = detectedMentions.map(mention => mention.toLowerCase());
      
      const requiredMentions = requirements.mentions.map((mention: string) => 
        mention.startsWith('@') ? mention.toLowerCase() : `@${mention}`.toLowerCase()
      );

      const hasAllMentions = requiredMentions.every((mention: string) => 
        result.details.detectedMentions?.includes(mention)
      );

      if (hasAllMentions) {
        matches++;
      } else {
        result.warnings.push(`Missing required mentions: ${requiredMentions.join(', ')}`);
      }
    }

    // Check word count
    if (requirements.minWords) {
      total++;
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      result.details.wordCount = wordCount;

      if (wordCount >= requirements.minWords) {
        matches++;
      } else {
        result.warnings.push(`Content has ${wordCount} words, minimum ${requirements.minWords} required`);
      }
    }

    // Set content matches based on requirements met
    result.contentMatches = total === 0 || matches === total;
  }

  /**
   * Check if URL is from a known social media platform
   */
  private isSocialMediaUrl(url: string): boolean {
    const socialDomains = [
      'instagram.com', 'twitter.com', 'x.com', 'tiktok.com', 
      'youtube.com', 'youtu.be', 'facebook.com', 'linkedin.com',
      'snapchat.com', 'pinterest.com', 'twitch.tv'
    ];

    try {
      const urlObj = new URL(url);
      return socialDomains.some(domain => 
        urlObj.hostname.includes(domain) || urlObj.hostname.endsWith(domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Determine overall validation success
   */
  private determineOverallSuccess(result: ValidationResult): boolean {
    // Must have no critical errors
    const hasCriticalErrors = result.errors.some(error => 
      error.includes('not accessible') || 
      error.includes('hash does not match') ||
      error.includes('timed out')
    );

    if (hasCriticalErrors) {
      return false;
    }

    // Must be accessible if URL provided
    if (result.details.httpStatus && !result.urlAccessible) {
      return false;
    }

    // Hash must verify if provided
    if (result.details.actualHash !== undefined && !result.hashVerified) {
      return false;
    }

    return true;
  }

  /**
   * Format bytes for human-readable display
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)}${units[unitIndex]}`;
  }
}
import { S3Client, GetObjectCommand, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import { Readable } from 'stream';

export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string; // For S3-compatible services like MinIO, DigitalOcean Spaces
}

export interface UploadMetadata {
  size: number;
  type: string;
  hash: string;
  lastModified?: Date;
  dimensions?: {
    width: number;
    height: number;
  };
}

export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;
    
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && { 
        endpoint: config.endpoint,
        forcePathStyle: true // Required for MinIO and some S3-compatible services
      }),
    });
  }

  /**
   * Generate presigned URL for file upload
   */
  async generatePresignedUploadUrl(
    fileKey: string, 
    contentType: string,
    expiresIn: number = 3600
  ): Promise<{ uploadUrl: string; fileUrl: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
      ContentType: contentType,
      ServerSideEncryption: 'AES256', // Enable server-side encryption
      Metadata: {
        'uploaded-by': 'flowpay-backend',
        'upload-timestamp': new Date().toISOString(),
      },
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn });
    const fileUrl = this.getPublicUrl(fileKey);

    return { uploadUrl, fileUrl };
  }

  /**
   * Generate presigned URL for file download
   */
  async generatePresignedDownloadUrl(
    fileKey: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Get public URL for file (for public buckets)
   */
  getPublicUrl(fileKey: string): string {
    const endpoint = process.env.S3_ENDPOINT;
    if (endpoint) {
      // Custom endpoint (like MinIO, DigitalOcean Spaces)
      return `${endpoint}/${this.bucket}/${fileKey}`;
    } else {
      // Standard AWS S3
      const region = process.env.S3_REGION || 'us-east-1';
      return `https://${this.bucket}.s3.${region}.amazonaws.com/${fileKey}`;
    }
  }

  /**
   * Check if file exists and get metadata
   */
  async getFileMetadata(fileKey: string): Promise<UploadMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      const response = await this.client.send(command);

      return {
        size: response.ContentLength || 0,
        type: response.ContentType || 'application/octet-stream',
        hash: response.ETag?.replace(/"/g, '') || '', // ETag is MD5 hash
        lastModified: response.LastModified,
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Download file and calculate SHA-256 hash
   */
  async downloadAndHash(fileKey: string): Promise<{ hash: string; size: number }> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: fileKey,
    });

    const response = await this.client.send(command);
    
    if (!response.Body) {
      throw new Error('File body is empty');
    }

    const hash = crypto.createHash('sha256');
    let size = 0;

    // Handle different body types
    const stream = response.Body as Readable;
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => {
        hash.update(chunk);
        size += chunk.length;
      });

      stream.on('end', () => {
        resolve({
          hash: hash.digest('hex'),
          size,
        });
      });

      stream.on('error', reject);
    });
  }

  /**
   * Verify file upload by checking existence and calculating hash
   */
  async verifyUpload(fileKey: string): Promise<{
    exists: boolean;
    metadata?: UploadMetadata;
    hash?: string;
  }> {
    try {
      const metadata = await this.getFileMetadata(fileKey);
      if (!metadata) {
        return { exists: false };
      }

      // Calculate SHA-256 hash for integrity verification
      const { hash, size } = await this.downloadAndHash(fileKey);

      return {
        exists: true,
        metadata: {
          ...metadata,
          size, // Use calculated size for accuracy
          hash,
        },
        hash,
      };
    } catch (error) {
      throw new Error(`Failed to verify upload: ${error.message}`);
    }
  }

  /**
   * Get image dimensions for image files
   */
  async getImageDimensions(fileKey: string): Promise<{ width: number; height: number } | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        Range: 'bytes=0-1023', // Download first 1KB to check header
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        return null;
      }

      const buffer = Buffer.from(await response.Body.transformToByteArray());
      
      // Simple image dimension detection (basic implementation)
      // For production, consider using a library like 'image-size' or 'sharp'
      const contentType = response.ContentType;
      
      if (contentType?.startsWith('image/')) {
        // This is a simplified approach - in production you'd want more robust parsing
        return await this.parseImageDimensions(buffer, contentType);
      }

      return null;
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }

  /**
   * Parse image dimensions from buffer (simplified implementation)
   */
  private async parseImageDimensions(
    buffer: Buffer, 
    contentType: string
  ): Promise<{ width: number; height: number } | null> {
    try {
      // This is a very basic implementation
      // For production, use a proper image parsing library
      
      if (contentType === 'image/jpeg') {
        return this.parseJpegDimensions(buffer);
      } else if (contentType === 'image/png') {
        return this.parsePngDimensions(buffer);
      }
      
      // For other formats, return null or implement more parsers
      return null;
    } catch (error) {
      return null;
    }
  }

  private parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
      // Simple JPEG dimension parsing
      let offset = 0;
      if (buffer[offset] !== 0xFF || buffer[offset + 1] !== 0xD8) {
        return null; // Not a valid JPEG
      }
      
      offset += 2;
      while (offset < buffer.length - 8) {
        if (buffer[offset] === 0xFF) {
          const marker = buffer[offset + 1];
          if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
            const height = (buffer[offset + 5] << 8) | buffer[offset + 6];
            const width = (buffer[offset + 7] << 8) | buffer[offset + 8];
            return { width, height };
          }
          offset += 2 + ((buffer[offset + 2] << 8) | buffer[offset + 3]);
        } else {
          offset++;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  private parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
    try {
      // Check PNG signature
      if (buffer.length < 24) return null;
      if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') return null;
      
      // Read IHDR chunk
      const width = (buffer[16] << 24) | (buffer[17] << 16) | (buffer[18] << 8) | buffer[19];
      const height = (buffer[20] << 24) | (buffer[21] << 16) | (buffer[22] << 8) | buffer[23];
      
      return { width, height };
    } catch (error) {
      return null;
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      return false;
    }
  }
}

// Create singleton instance
let s3Service: S3Service | null = null;

export function getS3Service(): S3Service {
  if (!s3Service) {
    const config: S3Config = {
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      bucket: process.env.S3_BUCKET_NAME || '',
      endpoint: process.env.S3_ENDPOINT, // Optional for S3-compatible services
    };

    // Validate required config
    if (!config.accessKeyId || !config.secretAccessKey || !config.bucket) {
      throw new Error('S3 configuration is incomplete. Check S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_BUCKET_NAME environment variables.');
    }

    s3Service = new S3Service(config);
  }

  return s3Service;
}
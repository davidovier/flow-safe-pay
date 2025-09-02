import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { getS3Service } from '../lib/s3.js';

export async function uploadRoutes(fastify: FastifyInstance) {
  
  const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  };

  // Generate presigned URL for S3 upload
  fastify.post('/presigned-url', {
    preHandler: requireAuth,
    schema: {
      description: 'Generate presigned URL for file upload',
      tags: ['Uploads'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['fileName', 'fileType', 'fileSize'],
        properties: {
          fileName: { type: 'string' },
          fileType: { type: 'string' },
          fileSize: { type: 'number' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { userId } = request.user as any;
      const { fileName, fileType, fileSize } = request.body as any;

      // Validate file size
      const maxSizeBytes = (parseInt(process.env.MAX_FILE_SIZE_MB || '100', 10)) * 1024 * 1024;
      if (fileSize > maxSizeBytes) {
        return reply.status(413).send({
          error: 'Payload Too Large',
          message: `File size exceeds maximum allowed size of ${process.env.MAX_FILE_SIZE_MB || '100'}MB`,
        });
      }

      // Validate file type
      const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || ['image/*', 'video/*', 'application/pdf'];
      const isAllowedType = allowedTypes.some(pattern => {
        if (pattern.endsWith('/*')) {
          return fileType.startsWith(pattern.slice(0, -1));
        }
        return fileType === pattern;
      });

      if (!isAllowedType) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'File type not allowed',
          allowedTypes,
        });
      }

      // Generate unique file key
      const timestamp = Date.now();
      const randomId = crypto.randomBytes(8).toString('hex');
      const fileExtension = fileName.split('.').pop() || 'bin';
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '');
      const fileKey = `uploads/${userId}/${timestamp}_${randomId}_${sanitizedFileName}`;

      try {
        // Generate actual S3 presigned URL
        const s3Service = getS3Service();
        const { uploadUrl, fileUrl } = await s3Service.generatePresignedUploadUrl(
          fileKey,
          fileType,
          3600 // 1 hour expiry
        );

        // Log upload request for audit
        await fastify.prisma.event.create({
          data: {
            actorUserId: userId,
            type: 'upload.presigned_url_generated',
            payload: {
              fileKey,
              fileName: sanitizedFileName,
              fileType,
              fileSize,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return reply.send({
          uploadUrl,
          fileUrl,
          fileKey,
          expiresIn: 3600,
        });
      } catch (s3Error: any) {
        fastify.log.error('S3 presigned URL generation failed:', s3Error);
        
        // If S3 is not configured, return helpful error
        if (s3Error.message.includes('S3 configuration is incomplete')) {
          return reply.status(500).send({
            error: 'Service Configuration Error',
            message: 'File upload service is not properly configured',
          });
        }
        
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to generate upload URL',
        });
      }

    } catch (error) {
      fastify.log.error('Generate presigned URL error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate upload URL',
      });
    }
  });

  // Verify file upload and calculate hash
  fastify.post('/verify', {
    preHandler: requireAuth,
    schema: {
      description: 'Verify file upload and calculate SHA-256 hash',
      tags: ['Uploads'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['fileKey'],
        properties: {
          fileKey: { type: 'string' },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { fileKey } = request.body as any;
      const user = request.user as any;

      // Verify that user can access this file (basic security check)
      if (!fileKey.startsWith(`uploads/${user.id}/`)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied to this file',
        });
      }

      try {
        const s3Service = getS3Service();
        const verification = await s3Service.verifyUpload(fileKey);

        if (!verification.exists) {
          return reply.status(404).send({
            error: 'Not Found',
            message: 'File not found or upload incomplete',
          });
        }

        let dimensions = null;
        const metadata = verification.metadata!;
        
        // Get image dimensions if it's an image
        if (metadata.type.startsWith('image/')) {
          dimensions = await s3Service.getImageDimensions(fileKey);
        }

        // Log successful verification
        await fastify.prisma.event.create({
          data: {
            actorUserId: user.id,
            type: 'upload.verified',
            payload: {
              fileKey,
              fileHash: verification.hash,
              fileSize: metadata.size,
              fileType: metadata.type,
              verified: true,
              dimensions,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return reply.send({
          fileKey,
          fileHash: verification.hash,
          verified: true,
          metadata: {
            size: metadata.size,
            type: metadata.type,
            hash: metadata.hash,
            lastModified: metadata.lastModified,
            ...(dimensions && { dimensions }),
          },
        });
      } catch (s3Error: any) {
        fastify.log.error('S3 verification failed:', s3Error);
        
        if (s3Error.message.includes('S3 configuration is incomplete')) {
          return reply.status(500).send({
            error: 'Service Configuration Error',
            message: 'File verification service is not properly configured',
          });
        }
        
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to verify file upload',
        });
      }

    } catch (error) {
      fastify.log.error('Verify upload error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to verify upload',
      });
    }
  });

  // Generate download URL for private files
  fastify.post('/download-url', {
    preHandler: requireAuth,
    schema: {
      description: 'Generate presigned download URL for file access',
      tags: ['Uploads'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['fileKey'],
        properties: {
          fileKey: { type: 'string' },
          expiresIn: { type: 'number', default: 3600 },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { fileKey, expiresIn = 3600 } = request.body as any;
      const user = request.user as any;

      // Basic access control - users can only access their own files
      // In production, you'd have more sophisticated access control
      if (!fileKey.startsWith(`uploads/${user.id}/`)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied to this file',
        });
      }

      try {
        const s3Service = getS3Service();
        const downloadUrl = await s3Service.generatePresignedDownloadUrl(fileKey, expiresIn);
        
        // Log download request
        await fastify.prisma.event.create({
          data: {
            actorUserId: user.id,
            type: 'upload.download_requested',
            payload: {
              fileKey,
              expiresIn,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return reply.send({
          downloadUrl,
          expiresIn,
          fileKey,
        });
      } catch (s3Error: any) {
        fastify.log.error('S3 download URL generation failed:', s3Error);
        
        if (s3Error.message.includes('S3 configuration is incomplete')) {
          return reply.status(500).send({
            error: 'Service Configuration Error',
            message: 'File download service is not properly configured',
          });
        }
        
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to generate download URL',
        });
      }

    } catch (error) {
      fastify.log.error('Generate download URL error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to generate download URL',
      });
    }
  });

  // Delete uploaded file
  fastify.delete('/:fileKey', {
    preHandler: requireAuth,
    schema: {
      description: 'Delete uploaded file',
      tags: ['Uploads'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          fileKey: { type: 'string' },
        },
        required: ['fileKey'],
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { fileKey } = request.params as any;
      const user = request.user as any;

      // Decode the fileKey from URL encoding
      const decodedFileKey = decodeURIComponent(fileKey);

      // Basic access control
      if (!decodedFileKey.startsWith(`uploads/${user.id}/`)) {
        return reply.status(403).send({
          error: 'Forbidden',
          message: 'Access denied to this file',
        });
      }

      try {
        const s3Service = getS3Service();
        const deleted = await s3Service.deleteFile(decodedFileKey);
        
        if (deleted) {
          // Log deletion
          await fastify.prisma.event.create({
            data: {
              actorUserId: user.id,
              type: 'upload.deleted',
              payload: {
                fileKey: decodedFileKey,
                timestamp: new Date().toISOString(),
              },
            },
          });

          return reply.send({
            message: 'File deleted successfully',
            fileKey: decodedFileKey,
          });
        } else {
          return reply.status(500).send({
            error: 'Internal Server Error',
            message: 'Failed to delete file',
          });
        }
      } catch (s3Error: any) {
        fastify.log.error('S3 file deletion failed:', s3Error);
        
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to delete file from storage',
        });
      }

    } catch (error) {
      fastify.log.error('Delete file error:', error);
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to delete file',
      });
    }
  });
}
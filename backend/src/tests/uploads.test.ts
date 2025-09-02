import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uploadRoutes } from '../routes/uploads.js';
import { createTestFastifyInstance, createTestUser, createAuthHeaders } from './setup.js';

// Mock S3 service
vi.mock('../lib/s3.js', () => ({
  getS3Service: () => ({
    generatePresignedUploadUrl: vi.fn().mockResolvedValue({
      uploadUrl: 'https://test-bucket.s3.amazonaws.com/test-key?upload=true',
      fileUrl: 'https://test-bucket.s3.amazonaws.com/test-key',
    }),
    verifyUpload: vi.fn().mockResolvedValue({
      exists: true,
      metadata: {
        size: 1024000,
        type: 'image/jpeg',
        hash: 'abcd1234567890',
        lastModified: new Date(),
      },
      hash: 'abcd1234567890',
    }),
    generatePresignedDownloadUrl: vi.fn().mockResolvedValue(
      'https://test-bucket.s3.amazonaws.com/test-key?download=true'
    ),
    deleteFile: vi.fn().mockResolvedValue(true),
    getImageDimensions: vi.fn().mockResolvedValue({ width: 1920, height: 1080 }),
  }),
}));

describe('Upload Routes', () => {
  let fastify: any;
  let user: any;

  beforeEach(async () => {
    fastify = await createTestFastifyInstance();
    await fastify.register(uploadRoutes, { prefix: '/uploads' });
    await fastify.ready();

    user = await createTestUser({
      email: 'user@example.com',
      role: 'CREATOR',
    });
  });

  describe('POST /uploads/presigned-url', () => {
    it('should generate presigned URL for valid file', async () => {
      const fileData = {
        fileName: 'test-image.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000, // 1MB
      };

      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/presigned-url',
        headers,
        payload: fileData,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('uploadUrl');
      expect(body).toHaveProperty('fileUrl');
      expect(body).toHaveProperty('fileKey');
      expect(body).toHaveProperty('expiresIn');
      
      expect(body.fileKey).toContain(user.id);
      expect(body.fileKey).toContain('test-image.jpg');
    });

    it('should reject files that are too large', async () => {
      const fileData = {
        fileName: 'huge-file.jpg',
        fileType: 'image/jpeg',
        fileSize: 200 * 1024 * 1024, // 200MB (over 100MB limit)
      };

      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/presigned-url',
        headers,
        payload: fileData,
      });

      expect(response.statusCode).toBe(413);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Payload Too Large');
    });

    it('should reject disallowed file types', async () => {
      const fileData = {
        fileName: 'malicious.exe',
        fileType: 'application/x-executable',
        fileSize: 1024,
      };

      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/presigned-url',
        headers,
        payload: fileData,
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Bad Request');
      expect(body.message).toBe('File type not allowed');
    });

    it('should sanitize file names', async () => {
      const fileData = {
        fileName: 'test file with spaces & special chars!.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
      };

      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/presigned-url',
        headers,
        payload: fileData,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.fileKey).toContain('testfilewithspacesspecialchars.jpg');
    });

    it('should reject unauthenticated requests', async () => {
      const fileData = {
        fileName: 'test.jpg',
        fileType: 'image/jpeg',
        fileSize: 1024000,
      };

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/presigned-url',
        payload: fileData,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /uploads/verify', () => {
    it('should verify file upload successfully', async () => {
      const fileKey = `uploads/${user.id}/test-file.jpg`;
      
      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/verify',
        headers,
        payload: { fileKey },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.fileKey).toBe(fileKey);
      expect(body.verified).toBe(true);
      expect(body).toHaveProperty('fileHash');
      expect(body).toHaveProperty('metadata');
      expect(body.metadata).toHaveProperty('size');
      expect(body.metadata).toHaveProperty('type');
    });

    it('should reject access to other users files', async () => {
      const otherUser = await createTestUser({
        email: 'other@example.com',
        role: 'CREATOR',
      });

      const fileKey = `uploads/${otherUser.id}/private-file.jpg`;
      
      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/verify',
        headers,
        payload: { fileKey },
      });

      expect(response.statusCode).toBe(403);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Forbidden');
    });

    it('should handle non-existent files', async () => {
      // Mock S3 service to return file not found
      const mockS3Service = await import('../lib/s3.js');
      vi.mocked(mockS3Service.getS3Service).mockReturnValueOnce({
        verifyUpload: vi.fn().mockResolvedValue({ exists: false }),
      } as any);

      const fileKey = `uploads/${user.id}/non-existent.jpg`;
      
      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/verify',
        headers,
        payload: { fileKey },
      });

      expect(response.statusCode).toBe(404);

      const body = JSON.parse(response.body);
      expect(body.error).toBe('Not Found');
    });
  });

  describe('POST /uploads/download-url', () => {
    it('should generate download URL for users own file', async () => {
      const fileKey = `uploads/${user.id}/test-file.jpg`;
      
      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/download-url',
        headers,
        payload: { fileKey },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('downloadUrl');
      expect(body).toHaveProperty('expiresIn');
      expect(body.fileKey).toBe(fileKey);
    });

    it('should reject access to other users files', async () => {
      const otherUser = await createTestUser({
        email: 'other@example.com',
        role: 'CREATOR',
      });

      const fileKey = `uploads/${otherUser.id}/private-file.jpg`;
      
      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/download-url',
        headers,
        payload: { fileKey },
      });

      expect(response.statusCode).toBe(403);
    });

    it('should allow custom expiry time', async () => {
      const fileKey = `uploads/${user.id}/test-file.jpg`;
      
      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'POST',
        url: '/uploads/download-url',
        headers,
        payload: { 
          fileKey,
          expiresIn: 7200, // 2 hours
        },
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.expiresIn).toBe(7200);
    });
  });

  describe('DELETE /uploads/:fileKey', () => {
    it('should delete users own file', async () => {
      const fileKey = encodeURIComponent(`uploads/${user.id}/test-file.jpg`);
      
      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/uploads/${fileKey}`,
        headers,
      });

      expect(response.statusCode).toBe(200);

      const body = JSON.parse(response.body);
      expect(body.message).toContain('deleted successfully');
    });

    it('should reject deletion of other users files', async () => {
      const otherUser = await createTestUser({
        email: 'other@example.com',
        role: 'CREATOR',
      });

      const fileKey = encodeURIComponent(`uploads/${otherUser.id}/private-file.jpg`);
      
      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/uploads/${fileKey}`,
        headers,
      });

      expect(response.statusCode).toBe(403);
    });

    it('should handle URL encoded file keys', async () => {
      const originalFileKey = `uploads/${user.id}/test file with spaces.jpg`;
      const encodedFileKey = encodeURIComponent(originalFileKey);
      
      const headers = await createAuthHeaders(user.id, 'CREATOR');

      const response = await fastify.inject({
        method: 'DELETE',
        url: `/uploads/${encodedFileKey}`,
        headers,
      });

      expect(response.statusCode).toBe(200);
    });
  });
});
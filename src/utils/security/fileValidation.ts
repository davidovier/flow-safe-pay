/**
 * Secure file upload validation for FlowPay
 * Comprehensive security checks for file uploads
 */

export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  requireMimeTypeMatch: boolean;
  scanForMalware: boolean;
  checkMagicBytes: boolean;
  maxDimensions?: {
    width: number;
    height: number;
  };
}

export interface FileValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo: {
    name: string;
    size: number;
    type: string;
    extension: string;
    actualMimeType?: string;
    dimensions?: {
      width: number;
      height: number;
    };
    hash?: string;
  };
}

/**
 * File type configurations for different use cases
 */
export const FILE_CONFIGS = {
  // Profile pictures and avatars
  image: {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    requireMimeTypeMatch: true,
    scanForMalware: true,
    checkMagicBytes: true,
    maxDimensions: {
      width: 2048,
      height: 2048
    }
  },

  // Documents and deliverables
  document: {
    maxSizeBytes: 25 * 1024 * 1024, // 25MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt', '.md'],
    requireMimeTypeMatch: true,
    scanForMalware: true,
    checkMagicBytes: true
  },

  // Videos for content creation
  video: {
    maxSizeBytes: 500 * 1024 * 1024, // 500MB
    allowedMimeTypes: [
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'video/avi'
    ],
    allowedExtensions: ['.mp4', '.mov', '.webm', '.avi'],
    requireMimeTypeMatch: true,
    scanForMalware: true,
    checkMagicBytes: true
  },

  // General files (most restrictive)
  general: {
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'text/plain'
    ],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.txt'],
    requireMimeTypeMatch: true,
    scanForMalware: true,
    checkMagicBytes: true
  }
};

/**
 * Magic bytes signatures for common file types
 */
const MAGIC_BYTES = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46], [0x57, 0x45, 0x42, 0x50]], // RIFF + WEBP
  'application/pdf': [[0x25, 0x50, 0x44, 0x46, 0x2D]], // %PDF-
  'video/mp4': [[0x66, 0x74, 0x79, 0x70]], // ftyp (at offset 4)
  'video/quicktime': [[0x66, 0x74, 0x79, 0x70, 0x71, 0x74]], // ftypqt
  'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]], // PK..
};

/**
 * Malicious file patterns to detect
 */
const MALICIOUS_PATTERNS = [
  // Script patterns
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  
  // Executable signatures
  /^MZ/, // Windows PE
  /^PK.*\.exe$/i, // Zip with exe
  /^#!/, // Shebang scripts
  
  // Suspicious strings
  /eval\s*\(/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /on\w+\s*=/gi
];

/**
 * Calculate SHA-256 hash of file
 */
async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check file magic bytes
 */
async function checkMagicBytes(file: File, expectedMimeType: string): Promise<boolean> {
  const signatures = MAGIC_BYTES[expectedMimeType];
  if (!signatures) return true; // No signature to check

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return signatures.some(signature => {
    // For some formats, check at different offsets
    const offsets = expectedMimeType === 'video/mp4' ? [4] : [0];
    
    return offsets.some(offset => {
      if (bytes.length < offset + signature.length) return false;
      
      return signature.every((byte, index) => {
        return bytes[offset + index] === byte;
      });
    });
  });
}

/**
 * Scan file content for malicious patterns
 */
async function scanForMaliciousContent(file: File): Promise<string[]> {
  const threats: string[] = [];
  
  try {
    // Read first 1MB for scanning
    const maxScanSize = 1024 * 1024; // 1MB
    const slice = file.slice(0, Math.min(file.size, maxScanSize));
    const text = await slice.text();
    
    for (const pattern of MALICIOUS_PATTERNS) {
      if (pattern.test(text)) {
        threats.push(`Suspicious pattern detected: ${pattern.source}`);
      }
    }
    
    // Check for double extensions
    const filename = file.name.toLowerCase();
    const suspiciousExtensions = ['.exe', '.scr', '.bat', '.cmd', '.com', '.pif', '.vbs', '.js'];
    if (suspiciousExtensions.some(ext => filename.includes(ext))) {
      threats.push('Suspicious file extension detected');
    }
    
    // Check for hidden unicode characters
    if (/[\u200B-\u200F\uFEFF\u2060-\u2064\u206A-\u206F]/.test(filename)) {
      threats.push('Hidden unicode characters in filename');
    }
    
  } catch (error) {
    // If we can't read the file as text, it might be binary - that's okay
    console.debug('File scanning: Could not read file as text (likely binary)');
  }
  
  return threats;
}

/**
 * Get image dimensions
 */
async function getImageDimensions(file: File): Promise<{width: number; height: number} | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    
    img.src = url;
  });
}

/**
 * Main file validation function
 */
export async function validateFile(
  file: File,
  config: FileValidationConfig
): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Extract file info
  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  const fileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
    extension,
    hash: await calculateFileHash(file)
  };

  // Basic size validation
  if (file.size > config.maxSizeBytes) {
    errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(config.maxSizeBytes / 1024 / 1024).toFixed(2)}MB`);
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  // MIME type validation
  if (!config.allowedMimeTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`);
  }

  // Extension validation
  if (!config.allowedExtensions.includes(extension)) {
    errors.push(`File extension ${extension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`);
  }

  // MIME type and extension consistency
  if (config.requireMimeTypeMatch) {
    const expectedMimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.avi': 'video/avi'
    };

    const expectedMimeType = expectedMimeTypes[extension as keyof typeof expectedMimeTypes];
    if (expectedMimeType && file.type !== expectedMimeType) {
      warnings.push(`MIME type ${file.type} doesn't match extension ${extension}. Expected ${expectedMimeType}`);
    }
  }

  // Magic bytes validation
  if (config.checkMagicBytes && file.type) {
    const magicBytesValid = await checkMagicBytes(file, file.type);
    if (!magicBytesValid) {
      errors.push('File header does not match declared file type');
    }
  }

  // Malware scanning
  if (config.scanForMalware) {
    const threats = await scanForMaliciousContent(file);
    errors.push(...threats);
  }

  // Image dimension validation
  if (config.maxDimensions && file.type.startsWith('image/')) {
    const dimensions = await getImageDimensions(file);
    if (dimensions) {
      // Note: dimensions are validated but not stored in fileInfo interface
      if (dimensions.width > config.maxDimensions.width || 
          dimensions.height > config.maxDimensions.height) {
        errors.push(`Image dimensions ${dimensions.width}x${dimensions.height} exceed maximum ${config.maxDimensions.width}x${config.maxDimensions.height}`);
      }
    }
  }

  // Filename validation
  const filename = file.name;
  if (filename.length > 255) {
    errors.push('Filename too long (max 255 characters)');
  }

  // Check for dangerous filename patterns
  const dangerousFilenames = [
    'index.php', 'index.html', '.htaccess', 'web.config',
    'autorun.inf', 'desktop.ini', 'thumbs.db'
  ];
  
  if (dangerousFilenames.includes(filename.toLowerCase())) {
    errors.push('Filename is not allowed');
  }

  // Check for path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    errors.push('Filename contains invalid path characters');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileInfo
  };
}

/**
 * Validate multiple files
 */
export async function validateFiles(
  files: File[],
  config: FileValidationConfig,
  maxFiles?: number
): Promise<{
  valid: boolean;
  results: FileValidationResult[];
  globalErrors: string[];
}> {
  const globalErrors: string[] = [];
  
  if (maxFiles && files.length > maxFiles) {
    globalErrors.push(`Too many files selected. Maximum ${maxFiles} files allowed`);
  }

  if (files.length === 0) {
    globalErrors.push('No files selected');
  }

  // Check for duplicate filenames
  const filenames = files.map(f => f.name);
  const duplicates = filenames.filter((name, index) => filenames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    globalErrors.push(`Duplicate filenames detected: ${duplicates.join(', ')}`);
  }

  // Validate each file
  const results = await Promise.all(
    files.map(file => validateFile(file, config))
  );

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = config.maxSizeBytes * files.length;
  if (totalSize > maxTotalSize) {
    globalErrors.push(`Total file size ${(totalSize / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxTotalSize / 1024 / 1024).toFixed(2)}MB`);
  }

  return {
    valid: globalErrors.length === 0 && results.every(r => r.valid),
    results,
    globalErrors
  };
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(originalName: string, hash: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase();
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const hashPrefix = hash.substring(0, 8);
  
  return `${hashPrefix}_${timestamp}_${randomSuffix}${extension ? '.' + extension : ''}`;
}

/**
 * Create a secure upload URL with expiration
 */
export function createSecureUploadUrl(filename: string, expiryMinutes: number = 60): {
  url: string;
  expires: Date;
  token: string;
} {
  const expires = new Date(Date.now() + expiryMinutes * 60 * 1000);
  const token = btoa(`${filename}:${expires.getTime()}:${Math.random()}`);
  
  return {
    url: `/api/upload?token=${token}&filename=${encodeURIComponent(filename)}`,
    expires,
    token
  };
}
/**
 * React hook for secure file uploads with validation
 */

import { useState, useCallback } from 'react';
import { validateFile, validateFiles, FileValidationConfig, FileValidationResult, FILE_CONFIGS } from '@/utils/security/fileValidation';
import { useRateLimit } from './useRateLimit';

export type FileUploadType = 'image' | 'document' | 'video' | 'general';

export interface UploadState {
  uploading: boolean;
  progress: number;
  error?: string;
  success: boolean;
  validationResults?: FileValidationResult[];
}

export interface UploadOptions {
  type: FileUploadType;
  maxFiles?: number;
  customConfig?: Partial<FileValidationConfig>;
  onProgress?: (progress: number) => void;
  onValidation?: (results: FileValidationResult[]) => void;
  onSuccess?: (files: File[], urls: string[]) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for secure file uploads with comprehensive validation
 */
export function useSecureUpload(options: UploadOptions) {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    success: false
  });

  // Rate limiting for uploads
  const { checkLimit, recordAttempt } = useRateLimit('upload');

  // Get validation config based on type
  const getConfig = useCallback((): FileValidationConfig => {
    const baseConfig = FILE_CONFIGS[options.type];
    return {
      ...baseConfig,
      ...options.customConfig
    };
  }, [options.type, options.customConfig]);

  // Validate files before upload
  const validateUpload = useCallback(async (files: File[]): Promise<{
    valid: boolean;
    results: FileValidationResult[];
    globalErrors: string[];
  }> => {
    const config = getConfig();
    return await validateFiles(files, config, options.maxFiles);
  }, [getConfig, options.maxFiles]);

  // Upload files to Supabase Storage
  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    // Rate limiting check
    if (!checkLimit()) {
      throw new Error('Upload rate limit exceeded. Please wait before trying again.');
    }

    setState(prev => ({ ...prev, uploading: true, progress: 0, error: undefined }));

    try {
      // Validate files first
      const validation = await validateUpload(files);
      
      if (!validation.valid) {
        const allErrors = [
          ...validation.globalErrors,
          ...validation.results.flatMap(r => r.errors)
        ];
        throw new Error(`Validation failed: ${allErrors.join(', ')}`);
      }

      // Store validation results
      setState(prev => ({ ...prev, validationResults: validation.results }));
      
      if (options.onValidation) {
        options.onValidation(validation.results);
      }

      // Upload each file
      const uploadPromises = files.map(async (file, index) => {
        const result = validation.results[index];
        const secureFilename = `${result.fileInfo.hash}_${Date.now()}_${file.name}`;
        
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', secureFilename);
        formData.append('type', options.type);
        formData.append('hash', result.fileInfo.hash || '');

        // Upload with progress tracking
        return new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setState(prev => ({ 
                ...prev, 
                progress: Math.round((index + progress / 100) / files.length * 100) 
              }));
              
              if (options.onProgress) {
                options.onProgress(progress);
              }
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response.url || response.path);
              } catch (e) {
                reject(new Error('Invalid server response'));
              }
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };

          xhr.onerror = () => reject(new Error('Upload failed'));
          
          // Upload to Supabase Storage API
          xhr.open('POST', '/api/upload');
          xhr.setRequestHeader('X-Upload-Type', options.type);
          xhr.send(formData);
        });
      });

      const urls = await Promise.all(uploadPromises);
      
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        progress: 100, 
        success: true 
      }));

      // Record successful upload
      recordAttempt();

      if (options.onSuccess) {
        options.onSuccess(files, urls);
      }

      return urls;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setState(prev => ({ 
        ...prev, 
        uploading: false, 
        error: errorMessage, 
        success: false 
      }));

      // Record failed attempt
      recordAttempt();

      if (options.onError) {
        options.onError(errorMessage);
      }

      throw error;
    }
  }, [checkLimit, recordAttempt, validateUpload, options]);

  // Handle file selection and upload
  const handleFileSelect = useCallback(async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    return await uploadFiles(files);
  }, [uploadFiles]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      success: false
    });
  }, []);

  return {
    state,
    uploadFiles,
    handleFileSelect,
    validateUpload,
    reset,
    isUploading: state.uploading,
    progress: state.progress,
    error: state.error,
    success: state.success,
    validationResults: state.validationResults
  };
}

/**
 * Hook for drag and drop file uploads
 */
export function useSecureDropzone(options: UploadOptions & {
  onDrop?: (files: File[]) => void;
  onDragOver?: (isDragOver: boolean) => void;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const upload = useSecureUpload(options);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    if (options.onDragOver) {
      options.onDragOver(true);
    }
  }, [options]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (options.onDragOver) {
      options.onDragOver(false);
    }
  }, [options]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (options.onDragOver) {
      options.onDragOver(false);
    }

    const files = Array.from(e.dataTransfer.files);
    
    if (options.onDrop) {
      options.onDrop(files);
    }

    try {
      await upload.handleFileSelect(files);
    } catch (error) {
      // Error handled by the upload hook
    }
  }, [upload, options]);

  return {
    ...upload,
    isDragOver,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }
  };
}

/**
 * File size formatter utility
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * File type detector utility
 */
export function detectFileType(file: File): FileUploadType {
  const { type, name } = file;
  
  if (type.startsWith('image/')) {
    return 'image';
  }
  
  if (type.startsWith('video/')) {
    return 'video';
  }
  
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument',
    'text/plain',
    'text/markdown'
  ];
  
  if (documentTypes.some(docType => type.startsWith(docType))) {
    return 'document';
  }
  
  // Check by extension as fallback
  const extension = name.split('.').pop()?.toLowerCase();
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const videoExts = ['mp4', 'mov', 'avi', 'webm'];
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'md'];
  
  if (extension && imageExts.includes(extension)) return 'image';
  if (extension && videoExts.includes(extension)) return 'video';
  if (extension && docExts.includes(extension)) return 'document';
  
  return 'general';
}
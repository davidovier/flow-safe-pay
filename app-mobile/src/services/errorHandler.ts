import { Alert } from 'react-native';

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
  statusCode?: number;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
};

export class ErrorHandler {
  static parseError(error: any): ApiError {
    // Handle axios error response
    if (error.response) {
      const { status, data } = error.response;
      return {
        message: data?.message || data?.error || 'Request failed',
        code: data?.code,
        details: data?.details,
        statusCode: status,
      };
    }

    // Handle network/timeout errors
    if (error.request) {
      return {
        message: 'Network error - please check your connection',
        code: 'NETWORK_ERROR',
        statusCode: 0,
      };
    }

    // Handle other errors
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
    };
  }

  static shouldRetry(error: ApiError): boolean {
    // Don't retry client errors (4xx) except for specific cases
    if (error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
      // Retry 408 (Timeout), 429 (Rate Limit), and auth errors handled by interceptor
      return error.statusCode === 408 || error.statusCode === 429;
    }

    // Retry server errors (5xx) and network errors
    return (
      !error.statusCode || 
      error.statusCode >= 500 || 
      error.code === 'NETWORK_ERROR'
    );
  }

  static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
    return Math.min(delay, config.maxDelay);
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG
  ): Promise<T> {
    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.parseError(error);

        // Don't retry on last attempt or if error shouldn't be retried
        if (attempt > config.maxRetries || !this.shouldRetry(lastError)) {
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, config);
        console.log(`Retry attempt ${attempt}/${config.maxRetries} after ${delay}ms delay`);
        
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  static showUserError(error: ApiError, customMessage?: string): void {
    const title = this.getErrorTitle(error);
    const message = customMessage || this.getUserFriendlyMessage(error);

    Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
  }

  static getErrorTitle(error: ApiError): string {
    if (error.statusCode) {
      switch (Math.floor(error.statusCode / 100)) {
        case 4:
          return error.statusCode === 401 ? 'Authentication Required' : 'Request Error';
        case 5:
          return 'Server Error';
        default:
          return 'Error';
      }
    }

    if (error.code === 'NETWORK_ERROR') {
      return 'Connection Error';
    }

    return 'Error';
  }

  static getUserFriendlyMessage(error: ApiError): string {
    // Handle specific error codes
    switch (error.code) {
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'INSUFFICIENT_FUNDS':
        return 'Insufficient funds to complete this transaction.';
      case 'DEAL_NOT_FOUND':
        return 'The requested deal could not be found.';
      case 'UNAUTHORIZED_ACTION':
        return 'You don\'t have permission to perform this action.';
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.';
    }

    // Handle HTTP status codes
    if (error.statusCode) {
      switch (error.statusCode) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Please log in to continue.';
        case 403:
          return 'You don\'t have permission to access this resource.';
        case 404:
          return 'The requested resource was not found.';
        case 408:
          return 'Request timeout. Please try again.';
        case 409:
          return 'This action conflicts with the current state.';
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        case 500:
          return 'Server error. Please try again later.';
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again later.';
      }
    }

    // Fall back to original error message
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  static logError(error: ApiError, context?: string): void {
    const prefix = context ? `[${context}]` : '';
    console.error(`${prefix} API Error:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });
  }
}

// Convenience functions
export const withRetry = ErrorHandler.withRetry.bind(ErrorHandler);
export const handleError = ErrorHandler.parseError.bind(ErrorHandler);
export const showError = ErrorHandler.showUserError.bind(ErrorHandler);
export const logError = ErrorHandler.logError.bind(ErrorHandler);
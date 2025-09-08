import Constants from 'expo-constants';

export interface AppEnvironment {
  apiUrl: string;
  wsUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
  version: string;
  buildNumber: string;
}

const getApiUrl = (): string => {
  // Check for explicit environment variable first
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }
  
  // Check process.env for Expo development
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Default based on development mode
  if (__DEV__) {
    // For local development - adjust based on your setup
    return 'http://localhost:3001';
  }
  
  // Production fallback
  return 'https://api.flowpay.app';
};

const getWsUrl = (): string => {
  const apiUrl = getApiUrl();
  
  // Convert HTTP(S) URL to WebSocket URL
  if (apiUrl.startsWith('https://')) {
    return apiUrl.replace('https://', 'wss://');
  } else if (apiUrl.startsWith('http://')) {
    return apiUrl.replace('http://', 'ws://');
  }
  
  return apiUrl;
};

export const environment: AppEnvironment = {
  apiUrl: getApiUrl(),
  wsUrl: getWsUrl(),
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
  version: Constants.expoConfig?.version || '1.0.0',
  buildNumber: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode?.toString() || '1',
};

// Configuration constants
export const config = {
  // API Configuration
  api: {
    timeout: 15000,
    retryCount: 3,
    retryDelay: 1000,
  },
  
  // Authentication
  auth: {
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
  
  // File Upload
  upload: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedVideoTypes: ['video/mp4', 'video/mov', 'video/avi'],
    allowedDocumentTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  
  // UI Configuration
  ui: {
    animationDuration: 300,
    toastDuration: 4000,
    loadingTimeout: 30000,
  },
  
  // Network
  network: {
    connectionTimeout: 30000,
    retryBackoffMultiplier: 2,
    maxRetryDelay: 10000,
  },
  
  // Feature Flags
  features: {
    enablePushNotifications: true,
    enableBiometricAuth: true,
    enableOfflineMode: false, // TODO: Implement offline support
    enableAnalytics: !__DEV__,
    enableCrashReporting: !__DEV__,
  },
  
  // Deep Linking
  deepLinking: {
    scheme: 'flowpay',
    domains: ['flowpay.app', 'www.flowpay.app'],
  },
  
  // Cache
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Environment-specific overrides
if (environment.isDevelopment) {
  config.api.timeout = 30000; // Longer timeout for development
  config.features.enableAnalytics = false;
  config.features.enableCrashReporting = false;
}

export default environment;
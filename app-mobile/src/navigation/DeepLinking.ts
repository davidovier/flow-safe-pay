import { Linking } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeepLinkParams, DeepLinkHandler, NavigationState } from './types';

export class DeepLinkingService {
  private static instance: DeepLinkingService;
  private handlers: DeepLinkHandler[] = [];
  private pendingUrl: string | null = null;
  private isInitialized = false;

  static getInstance(): DeepLinkingService {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  async initialize(isAuthenticated: boolean, userRole?: string): Promise<void> {
    if (this.isInitialized) return;

    // Register URL scheme handlers
    this.registerHandlers();

    // Handle initial URL if app was opened from link
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      console.log('Initial URL:', initialUrl);
      await this.handleURL(initialUrl, isAuthenticated, userRole);
    }

    // Listen for incoming URLs while app is running
    Linking.addEventListener('url', ({ url }) => {
      console.log('Incoming URL:', url);
      this.handleURL(url, isAuthenticated, userRole);
    });

    // Process any pending URL
    if (this.pendingUrl) {
      await this.handleURL(this.pendingUrl, isAuthenticated, userRole);
      this.pendingUrl = null;
    }

    this.isInitialized = true;
  }

  private registerHandlers(): void {
    this.handlers = [
      // Deal handlers
      {
        path: '/deal/:id',
        handler: (params) => router.push(`/deal/${params.id}`),
        requiresAuth: true,
      },
      {
        path: '/deal/:id/accept',
        handler: (params) => {
          router.push(`/deal/${params.id}`);
          // Could show accept modal here
        },
        requiresAuth: true,
        allowedRoles: ['CREATOR'],
      },
      {
        path: '/deal/:id/fund',
        handler: (params) => {
          router.push(`/deal/${params.id}`);
          // Could show funding modal here
        },
        requiresAuth: true,
        allowedRoles: ['BRAND'],
      },

      // Milestone handlers
      {
        path: '/milestone/:id',
        handler: (params) => router.push(`/milestone/${params.id}`),
        requiresAuth: true,
      },
      {
        path: '/milestone/:id/submit',
        handler: (params) => router.push(`/milestone/${params.id}/submit`),
        requiresAuth: true,
        allowedRoles: ['CREATOR'],
      },
      {
        path: '/milestone/:id/review',
        handler: (params) => {
          router.push(`/milestone/${params.id}`);
          // Could show review modal here
        },
        requiresAuth: true,
        allowedRoles: ['BRAND'],
      },

      // Project handlers
      {
        path: '/project/:id',
        handler: (params) => router.push(`/project/${params.id}`),
        requiresAuth: true,
      },

      // Deliverable handlers
      {
        path: '/deliverable/:id',
        handler: (params) => router.push(`/deliverable/${params.id}`),
        requiresAuth: true,
      },

      // Payment handlers
      {
        path: '/payment-success',
        handler: () => {
          router.push('/(tabs)/deals');
          // Could show success toast
        },
        requiresAuth: true,
      },
      {
        path: '/payment-failed',
        handler: () => {
          router.push('/(tabs)/deals');
          // Could show error toast
        },
        requiresAuth: true,
      },
      {
        path: '/payout-received',
        handler: () => {
          router.push('/(tabs)/payouts');
          // Could show success notification
        },
        requiresAuth: true,
        allowedRoles: ['CREATOR'],
      },

      // Profile handlers
      {
        path: '/profile',
        handler: () => router.push('/(tabs)/profile'),
        requiresAuth: true,
      },
      {
        path: '/profile/settings',
        handler: () => router.push('/profile/settings'),
        requiresAuth: true,
      },
      {
        path: '/profile/kyc',
        handler: () => router.push('/profile/kyc'),
        requiresAuth: true,
      },
      {
        path: '/profile/payment-methods',
        handler: () => router.push('/profile/payment-methods'),
        requiresAuth: true,
      },

      // Auth handlers
      {
        path: '/verify-email',
        handler: (params) => {
          if (params.token) {
            router.push(`/(auth)/verify-email?token=${params.token}`);
          } else {
            router.push('/(auth)/login');
          }
        },
        requiresAuth: false,
      },
      {
        path: '/reset-password',
        handler: (params) => {
          if (params.token) {
            router.push(`/(auth)/reset-password?token=${params.token}`);
          } else {
            router.push('/(auth)/forgot-password');
          }
        },
        requiresAuth: false,
      },

      // Support handlers
      {
        path: '/support',
        handler: () => router.push('/support'),
        requiresAuth: true,
      },
      {
        path: '/dispute/:id',
        handler: (params) => router.push(`/dispute/${params.id}`),
        requiresAuth: true,
      },

      // Notification handlers
      {
        path: '/notifications',
        handler: () => router.push('/notifications'),
        requiresAuth: true,
      },
      {
        path: '/notification/:id',
        handler: (params) => {
          // Navigate to relevant content based on notification type
          router.push('/notifications');
        },
        requiresAuth: true,
      },
    ];
  }

  async handleURL(url: string, isAuthenticated: boolean, userRole?: string): Promise<void> {
    try {
      console.log('Processing deep link:', url);

      // If not authenticated and URL requires auth, store it for later
      if (!isAuthenticated) {
        const handler = this.findHandler(url);
        if (handler?.requiresAuth) {
          this.pendingUrl = url;
          router.push('/(auth)/login');
          return;
        }
      }

      // Parse URL and find matching handler
      const handler = this.findHandler(url);
      if (!handler) {
        console.warn('No handler found for URL:', url);
        router.push('/(tabs)/deals'); // Default fallback
        return;
      }

      // Check role permissions
      if (handler.allowedRoles && userRole && !handler.allowedRoles.includes(userRole as any)) {
        console.warn('User role not allowed for URL:', url, 'Role:', userRole);
        router.push('/(tabs)/deals');
        return;
      }

      // Extract parameters
      const params = this.extractParams(url, handler.path);
      
      // Save navigation state for analytics
      await this.saveNavigationState({
        routeName: handler.path,
        params,
        timestamp: Date.now(),
      });

      // Execute handler
      await handler.handler(params);

    } catch (error) {
      console.error('Deep link handling error:', error);
      router.push('/(tabs)/deals'); // Fallback to main screen
    }
  }

  private findHandler(url: string): DeepLinkHandler | undefined {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;

    return this.handlers.find(handler => {
      const handlerPath = handler.path.replace(/:(\w+)/g, '([^/]+)');
      const regex = new RegExp(`^${handlerPath}$`);
      return regex.test(path);
    });
  }

  private extractParams(url: string, handlerPath: string): Record<string, string> {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    const params: Record<string, string> = {};

    // Extract path parameters
    const pathSegments = path.split('/').filter(Boolean);
    const handlerSegments = handlerPath.split('/').filter(Boolean);

    for (let i = 0; i < handlerSegments.length; i++) {
      const segment = handlerSegments[i];
      if (segment.startsWith(':')) {
        const paramName = segment.slice(1);
        params[paramName] = pathSegments[i];
      }
    }

    // Extract query parameters
    parsedUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return params;
  }

  async saveNavigationState(state: NavigationState): Promise<void> {
    try {
      const key = `nav_state_${Date.now()}`;
      await AsyncStorage.setItem(key, JSON.stringify(state));
      
      // Keep only last 10 navigation states
      const keys = await AsyncStorage.getAllKeys();
      const navKeys = keys.filter(k => k.startsWith('nav_state_')).sort();
      if (navKeys.length > 10) {
        const oldKeys = navKeys.slice(0, navKeys.length - 10);
        await AsyncStorage.multiRemove(oldKeys);
      }
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  }

  async getNavigationHistory(): Promise<NavigationState[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const navKeys = keys.filter(k => k.startsWith('nav_state_')).sort();
      const states = await AsyncStorage.multiGet(navKeys);
      
      return states
        .map(([, value]) => value ? JSON.parse(value) : null)
        .filter(Boolean)
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get navigation history:', error);
      return [];
    }
  }

  // Generate deep links for sharing
  static generateDeepLink(path: string, params?: Record<string, string>): string {
    const baseUrl = 'flowpay://'; // Your custom URL scheme
    let url = baseUrl + path.replace(/^\//, '');

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += '?' + searchParams.toString();
    }

    return url;
  }

  // Generate universal links (HTTPS) for web compatibility
  static generateUniversalLink(path: string, params?: Record<string, string>): string {
    const baseUrl = 'https://flowpay.app'; // Your web domain
    let url = baseUrl + path;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams(params);
      url += '?' + searchParams.toString();
    }

    return url;
  }

  // Share functionality
  static async shareDeepLink(
    path: string, 
    params?: Record<string, string>,
    options?: {
      title?: string;
      message?: string;
      useUniversalLink?: boolean;
    }
  ): Promise<void> {
    try {
      const { Share } = await import('react-native');
      
      const url = options?.useUniversalLink 
        ? this.generateUniversalLink(path, params)
        : this.generateDeepLink(path, params);

      const content = {
        title: options?.title || 'FlowPay',
        message: options?.message || 'Check this out on FlowPay!',
        url,
      };

      await Share.share(content);
    } catch (error) {
      console.error('Share failed:', error);
    }
  }

  // Clear pending URL (call after successful authentication)
  clearPendingUrl(): void {
    this.pendingUrl = null;
  }

  // Get pending URL (useful for post-login redirect)
  getPendingUrl(): string | null {
    return this.pendingUrl;
  }
}
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { environment, config } from '../config/environment';

export const api = axios.create({
  baseURL: environment.apiUrl,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh tracking
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

// Process failed queue after token refresh
const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Request interceptor - attach auth token
api.interceptors.request.use(
  async (config) => {
    // Attach auth token to requests
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get access token:', error);
    }

    // Log requests in development
    if (__DEV__) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with token refresh
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (__DEV__) {
      console.log(`✅ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 errors with token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // Retry original request
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh the token
        const response = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens
        await SecureStore.setItemAsync('accessToken', accessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);
        }

        // Update authorization header for original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        // Process queued requests
        processQueue(null, accessToken);
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear tokens and process queue with error
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        processQueue(refreshError, null);
        
        console.log('Token refresh failed - user needs to login again');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    if (error.response?.status >= 500) {
      console.error('Server error:', error.response.data);
    }
    
    if (__DEV__) {
      console.error(`❌ ${error.response?.status || 'Network Error'} ${error.config?.url}`);
    }
    
    return Promise.reject(error);
  }
);

// API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, password: string, role: 'CREATOR' | 'BRAND', country?: string) =>
    api.post('/auth/register', { email, password, role, country }),
  
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
    
  logout: () => api.post('/auth/logout'),
  
  me: () => api.get('/auth/me'),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
    
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, newPassword }),
};

export const dealApi = {
  getDeals: (params?: { state?: string; limit?: number; offset?: number }) =>
    api.get('/deals', { params }),
  
  getDeal: (dealId: string) =>
    api.get(`/deals/${dealId}`),
  
  createDeal: (data: {
    projectId?: string;
    creatorEmail: string;
    title: string;
    description?: string;
    currency?: string;
    milestones: Array<{
      title: string;
      description?: string;
      amount: number;
      dueAt?: string;
    }>;
  }) => api.post('/deals', data),
  
  acceptDeal: (dealId: string) =>
    api.post(`/deals/${dealId}/accept`),
  
  rejectDeal: (dealId: string, reason?: string) =>
    api.post(`/deals/${dealId}/reject`, { reason }),
  
  fundDeal: (dealId: string, data?: { paymentMethodId?: string }) =>
    api.post(`/deals/${dealId}/fund`, data),
    
  cancelDeal: (dealId: string, reason?: string) =>
    api.post(`/deals/${dealId}/cancel`, { reason }),
};

export const milestoneApi = {
  getMilestone: (milestoneId: string) =>
    api.get(`/milestones/${milestoneId}`),
  
  submitDeliverable: (milestoneId: string, data: {
    url?: string;
    fileUrl?: string;
    fileHash?: string;
    fileName?: string;
    fileSize?: number;
    description?: string;
  }) => api.post(`/milestones/${milestoneId}/deliver`, data),
  
  approveMilestone: (milestoneId: string, feedback?: string) =>
    api.post(`/milestones/${milestoneId}/approve`, { feedback }),
    
  rejectMilestone: (milestoneId: string, data: {
    reason: string;
    feedback?: string;
  }) => api.post(`/milestones/${milestoneId}/reject`, data),
  
  requestRevision: (milestoneId: string, data: {
    feedback: string;
    requirements?: string[];
  }) => api.post(`/milestones/${milestoneId}/revision`, data),
};

export const uploadApi = {
  getPresignedUrl: (data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    category?: 'deliverable' | 'evidence' | 'avatar' | 'document';
  }) => api.post('/uploads/presigned-url', data),
  
  verifyUpload: (fileKey: string) =>
    api.post('/uploads/verify', { fileKey }),
  
  deleteFile: (fileKey: string) =>
    api.delete(`/uploads/${fileKey}`),
};

export const payoutApi = {
  getPayouts: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/payouts', { params }),
  
  getPayout: (payoutId: string) =>
    api.get(`/payouts/${payoutId}`),
};

export const projectApi = {
  getProjects: (params?: { limit?: number; offset?: number }) =>
    api.get('/projects', { params }),
  
  getProject: (projectId: string) =>
    api.get(`/projects/${projectId}`),
  
  createProject: (data: {
    title: string;
    description?: string;
    category?: string;
    tags?: string[];
  }) => api.post('/projects', data),
  
  updateProject: (projectId: string, data: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }) => api.patch(`/projects/${projectId}`, data),
  
  deleteProject: (projectId: string) =>
    api.delete(`/projects/${projectId}`),
};

export const userApi = {
  getProfile: () => api.get('/profile'),
  
  updateProfile: (data: {
    email?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    bio?: string;
    avatar?: string;
  }) => api.patch('/profile', data),
  
  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => api.patch('/profile/password', data),
  
  updateNotifications: (preferences: {
    email_notifications?: boolean;
    push_notifications?: boolean;
    deal_updates?: boolean;
    milestone_updates?: boolean;
    payment_updates?: boolean;
  }) => api.patch('/profile/notifications', preferences),
};

export const disputeApi = {
  getDisputes: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/disputes', { params }),
  
  getDispute: (disputeId: string) =>
    api.get(`/disputes/${disputeId}`),
  
  createDispute: (milestoneId: string, data: {
    reason: string;
    description: string;
    evidence?: string[];
  }) => api.post('/disputes', { milestoneId, ...data }),
  
  respondToDispute: (disputeId: string, data: {
    response: string;
    evidence?: string[];
  }) => api.post(`/disputes/${disputeId}/respond`, data),
  
  escalateDispute: (disputeId: string) =>
    api.post(`/disputes/${disputeId}/escalate`),
};

// Export apiClient alias for compatibility with existing profile screen
export const apiClient = api;
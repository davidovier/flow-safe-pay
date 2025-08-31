import axios from 'axios';
import Constants from 'expo-constants';

// API base URL - use localhost for development in simulator/emulator
const getBaseURL = () => {
  if (__DEV__) {
    // For local development
    return 'http://localhost:3001';
  }
  
  // For production, use the actual API URL
  return process.env.EXPO_PUBLIC_API_URL || 'https://api.flowpay.app';
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (__DEV__) {
      console.log(`✅ ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Authentication error - token may be expired');
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
  
  register: (email: string, password: string, role: 'CREATOR' | 'BRAND') =>
    api.post('/auth/register', { email, password, role }),
  
  me: () => api.get('/auth/me'),
};

export const dealApi = {
  getDeals: (params?: { state?: string; limit?: number; offset?: number }) =>
    api.get('/deals', { params }),
  
  getDeal: (dealId: string) =>
    api.get(`/deals/${dealId}`),
  
  createDeal: (data: {
    projectId: string;
    creatorId: string;
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
  
  fundDeal: (dealId: string, data?: { paymentMethodId?: string }) =>
    api.post(`/deals/${dealId}/fund`, data),
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
  }) => api.post(`/milestones/${milestoneId}/deliver`, data),
  
  approveMilestone: (milestoneId: string) =>
    api.post(`/milestones/${milestoneId}/approve`),
};

export const uploadApi = {
  getPresignedUrl: (data: {
    fileName: string;
    fileType: string;
    fileSize: number;
  }) => api.post('/uploads/presigned-url', data),
  
  verifyUpload: (fileKey: string) =>
    api.post('/uploads/verify', { fileKey }),
};

export const payoutApi = {
  getPayouts: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/payouts', { params }),
  
  getPayout: (payoutId: string) =>
    api.get(`/payouts/${payoutId}`),
};
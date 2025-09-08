import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';
import { DeepLinkingService } from '../navigation/DeepLinking';
import { NavigationHelper } from '../navigation/NavigationHelper';
import { ErrorHandler, withRetry } from '../services/errorHandler';
import { networkStatusManager } from '../services/networkStatus';

interface User {
  id: string;
  email: string;
  role: 'CREATOR' | 'BRAND' | 'ADMIN';
  kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRED';
  country?: string;
  stripeAccountId?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; accessToken: string; refreshToken?: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'CREATOR' | 'BRAND', country?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  user: User | null;
  isLoading: boolean;
}>({
  state: initialState,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkAuthStatus: async () => {},
  user: null,
  isLoading: true,
});

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken || state.refreshToken,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    default:
      return state;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize deep linking when auth state changes
  useEffect(() => {
    const initializeDeepLinking = async () => {
      const deepLinking = DeepLinkingService.getInstance();
      await deepLinking.initialize(!!state.user, state.user?.role);
    };

    if (!state.isLoading) {
      initializeDeepLinking();
    }
  }, [state.user, state.isLoading]);

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Check network connectivity
      if (!networkStatusManager.isOnline()) {
        throw new Error('No internet connection');
      }
      
      const response = await withRetry(
        () => api.post('/auth/login', { email, password }),
        { maxRetries: 2, baseDelay: 1000, maxDelay: 3000, backoffMultiplier: 2 }
      );
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
      
      dispatch({ type: 'SET_USER', payload: { user, accessToken, refreshToken } });
      
      // Handle post-login navigation (including any pending deep links)
      const deepLinking = DeepLinkingService.getInstance();
      const pendingUrl = deepLinking.getPendingUrl();
      NavigationHelper.handlePostAuthRedirect(pendingUrl);
    } catch (error: any) {
      const parsedError = ErrorHandler.parseError(error);
      ErrorHandler.logError(parsedError, 'AuthContext.login');
      dispatch({ type: 'SET_ERROR', payload: parsedError.message });
      throw parsedError;
    }
  };

  const register = async (email: string, password: string, role: 'CREATOR' | 'BRAND', country?: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Check network connectivity
      if (!networkStatusManager.isOnline()) {
        throw new Error('No internet connection');
      }
      
      const response = await withRetry(
        () => api.post('/auth/register', { email, password, role, country }),
        { maxRetries: 2, baseDelay: 1000, maxDelay: 3000, backoffMultiplier: 2 }
      );
      const { user, accessToken, refreshToken } = response.data;

      // Store tokens securely
      await SecureStore.setItemAsync('accessToken', accessToken);
      if (refreshToken) {
        await SecureStore.setItemAsync('refreshToken', refreshToken);
      }
      
      dispatch({ type: 'SET_USER', payload: { user, accessToken, refreshToken } });
      
      // Handle post-registration navigation
      NavigationHelper.handlePostAuthRedirect();
    } catch (error: any) {
      const parsedError = ErrorHandler.parseError(error);
      ErrorHandler.logError(parsedError, 'AuthContext.register');
      dispatch({ type: 'SET_ERROR', payload: parsedError.message });
      throw parsedError;
    }
  };

  const logout = async () => {
    try {
      // Attempt to notify server of logout (optional - don't fail if it doesn't work)
      if (networkStatusManager.isOnline()) {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Ignore server logout errors - we'll clear local tokens regardless
          console.log('Server logout failed, continuing with local logout');
        }
      }
      
      // Remove tokens from storage
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      const parsedError = ErrorHandler.parseError(error);
      ErrorHandler.logError(parsedError, 'AuthContext.logout');
      // Still dispatch logout even if there was an error
      dispatch({ type: 'LOGOUT' });
    }
  };

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = await SecureStore.getItemAsync('accessToken');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        // Verify token with API (with retry for network issues)
        const response = await withRetry(
          () => api.get('/auth/me'),
          { maxRetries: 2, baseDelay: 1000, maxDelay: 3000, backoffMultiplier: 2 }
        );
        const { user } = response.data;
        
        dispatch({ type: 'SET_USER', payload: { user, accessToken: token, refreshToken } });
      } catch (error: any) {
        const parsedError = ErrorHandler.parseError(error);
        
        // If token is expired and we have a refresh token, try to refresh
        if (parsedError.statusCode === 401 && refreshToken) {
          try {
            const refreshResponse = await withRetry(
              () => api.post('/auth/refresh', { refreshToken }),
              { maxRetries: 1, baseDelay: 1000, maxDelay: 2000, backoffMultiplier: 1 }
            );
            const { user, accessToken: newToken, refreshToken: newRefreshToken } = refreshResponse.data;
            
            // Store new tokens
            await SecureStore.setItemAsync('accessToken', newToken);
            if (newRefreshToken) {
              await SecureStore.setItemAsync('refreshToken', newRefreshToken);
            }
            
            dispatch({ type: 'SET_USER', payload: { user, accessToken: newToken, refreshToken: newRefreshToken } });
          } catch (refreshError) {
            // Refresh failed, clear tokens
            const refreshParsedError = ErrorHandler.parseError(refreshError);
            ErrorHandler.logError(refreshParsedError, 'AuthContext.checkAuthStatus.refresh');
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          // Token is invalid, network error, or no refresh token - handle appropriately
          if (parsedError.code === 'NETWORK_ERROR') {
            // For network errors, keep the user logged in locally but show loading state
            dispatch({ type: 'SET_LOADING', payload: false });
            ErrorHandler.logError(parsedError, 'AuthContext.checkAuthStatus.network');
          } else {
            // For auth errors, clear tokens
            await SecureStore.deleteItemAsync('accessToken');
            await SecureStore.deleteItemAsync('refreshToken');
            dispatch({ type: 'LOGOUT' });
          }
        }
      }
    } catch (error) {
      // General error, clear tokens
      const parsedError = ErrorHandler.parseError(error);
      ErrorHandler.logError(parsedError, 'AuthContext.checkAuthStatus.general');
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const value = {
    state,
    login,
    register,
    logout,
    checkAuthStatus,
    user: state.user,
    isLoading: state.isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

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
  isLoading: boolean;
  error: string | null;
}

type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; accessToken: string } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'LOGOUT' };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isLoading: true,
  error: null,
};

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: 'CREATOR' | 'BRAND') => Promise<void>;
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

  const login = async (email: string, password: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data;

      // Store token securely
      await SecureStore.setItemAsync('accessToken', accessToken);
      
      // Set API authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      dispatch({ type: 'SET_USER', payload: { user, accessToken } });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw new Error(message);
    }
  };

  const register = async (email: string, password: string, role: 'CREATOR' | 'BRAND') => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await api.post('/auth/register', { email, password, role });
      const { user, accessToken } = response.data;

      // Store token securely
      await SecureStore.setItemAsync('accessToken', accessToken);
      
      // Set API authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      dispatch({ type: 'SET_USER', payload: { user, accessToken } });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      // Remove token from storage
      await SecureStore.deleteItemAsync('accessToken');
      
      // Clear API authorization header
      delete api.defaults.headers.common['Authorization'];
      
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = await SecureStore.getItemAsync('accessToken');
      
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Set API authorization header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token with API
      const response = await api.get('/auth/me');
      const { user } = response.data;
      
      dispatch({ type: 'SET_USER', payload: { user, accessToken: token } });
    } catch (error) {
      // Token is invalid, clear it
      await SecureStore.deleteItemAsync('accessToken');
      delete api.defaults.headers.common['Authorization'];
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
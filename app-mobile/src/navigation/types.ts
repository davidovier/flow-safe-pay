export type RootStackParamList = {
  index: undefined;
  '(auth)': undefined;
  '(tabs)': undefined;
  'deal/[id]': { id: string };
  'project/[id]': { id: string };
  'milestone/[id]': { id: string };
  'milestone/[id]/submit': { id: string };
  'deliverable/[id]': { id: string };
  'profile/settings': undefined;
  'profile/kyc': undefined;
  'profile/payment-methods': undefined;
  'notifications': undefined;
  'support': undefined;
};

export type TabsParamList = {
  deals: undefined;
  projects: undefined;
  milestones: undefined;
  payouts: undefined;
  profile: undefined;
};

export type AuthParamList = {
  welcome: undefined;
  login: undefined;
  register: undefined;
  'forgot-password': undefined;
  'reset-password': { token: string };
};

export type DeepLinkParams = {
  // Deal deep links
  'deal'?: string;
  'deal-accept'?: string;
  'deal-fund'?: string;
  
  // Milestone deep links
  'milestone'?: string;
  'milestone-submit'?: string;
  'milestone-review'?: string;
  
  // Payment deep links
  'payment-success'?: string;
  'payment-failed'?: string;
  'payout-received'?: string;
  
  // Notification deep links
  'notification'?: string;
  
  // Profile deep links
  'profile'?: string;
  'kyc'?: string;
  'settings'?: string;
  
  // Auth deep links
  'verify-email'?: string;
  'reset-password'?: string;
  
  // Support deep links
  'support'?: string;
  'dispute'?: string;
};

export interface NavigationState {
  routeName: string;
  params?: Record<string, any>;
  timestamp: number;
}

export interface DeepLinkHandler {
  path: string;
  handler: (params: Record<string, string>) => Promise<void> | void;
  requiresAuth?: boolean;
  allowedRoles?: ('CREATOR' | 'BRAND' | 'ADMIN')[];
}
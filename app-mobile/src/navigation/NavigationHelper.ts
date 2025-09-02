import { router } from 'expo-router';
import { DeepLinkingService } from './DeepLinking';

export class NavigationHelper {
  // Navigation utilities for common flows
  static navigateToDeal(dealId: string, options?: { replace?: boolean }): void {
    const path = `/deal/${dealId}`;
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }

  static navigateToMilestone(milestoneId: string, options?: { replace?: boolean }): void {
    const path = `/milestone/${milestoneId}`;
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }

  static navigateToSubmitMilestone(milestoneId: string): void {
    router.push(`/milestone/${milestoneId}/submit`);
  }

  static navigateToProject(projectId: string, options?: { replace?: boolean }): void {
    const path = `/project/${projectId}`;
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }

  static navigateToDeliverable(deliverableId: string): void {
    router.push(`/deliverable/${deliverableId}`);
  }

  // Tab navigation
  static navigateToDealsTab(): void {
    router.push('/(tabs)/deals');
  }

  static navigateToProjectsTab(): void {
    router.push('/(tabs)/projects');
  }

  static navigateToMilestonesTab(): void {
    router.push('/(tabs)/milestones');
  }

  static navigateToPayoutsTab(): void {
    router.push('/(tabs)/payouts');
  }

  static navigateToProfileTab(): void {
    router.push('/(tabs)/profile');
  }

  // Profile sub-pages
  static navigateToSettings(): void {
    router.push('/profile/settings');
  }

  static navigateToKYC(): void {
    router.push('/profile/kyc');
  }

  static navigateToPaymentMethods(): void {
    router.push('/profile/payment-methods');
  }

  // Auth flows
  static navigateToLogin(options?: { replace?: boolean }): void {
    const path = '/(auth)/login';
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  }

  static navigateToRegister(): void {
    router.push('/(auth)/register');
  }

  static navigateToWelcome(): void {
    router.push('/(auth)/welcome');
  }

  static navigateToForgotPassword(): void {
    router.push('/(auth)/forgot-password');
  }

  // Support and help
  static navigateToSupport(): void {
    router.push('/support');
  }

  static navigateToNotifications(): void {
    router.push('/notifications');
  }

  // Back navigation
  static goBack(): void {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to main tab if no back history
      this.navigateToDealsTab();
    }
  }

  // Replace current screen
  static replaceWith(path: string): void {
    router.replace(path);
  }

  // Reset navigation stack
  static resetToMain(): void {
    router.replace('/(tabs)/deals');
  }

  // Deep link sharing helpers
  static async shareDeal(dealId: string, dealTitle?: string): Promise<void> {
    await DeepLinkingService.shareDeepLink(
      `/deal/${dealId}`,
      undefined,
      {
        title: 'FlowPay Deal',
        message: dealTitle ? `Check out "${dealTitle}" on FlowPay` : 'Check out this deal on FlowPay',
        useUniversalLink: true, // Use universal link for better compatibility
      }
    );
  }

  static async shareMilestone(milestoneId: string, milestoneTitle?: string): Promise<void> {
    await DeepLinkingService.shareDeepLink(
      `/milestone/${milestoneId}`,
      undefined,
      {
        title: 'FlowPay Milestone',
        message: milestoneTitle ? `Check out milestone "${milestoneTitle}" on FlowPay` : 'Check out this milestone on FlowPay',
        useUniversalLink: true,
      }
    );
  }

  static async shareProject(projectId: string, projectTitle?: string): Promise<void> {
    await DeepLinkingService.shareDeepLink(
      `/project/${projectId}`,
      undefined,
      {
        title: 'FlowPay Project',
        message: projectTitle ? `Check out "${projectTitle}" on FlowPay` : 'Check out this project on FlowPay',
        useUniversalLink: true,
      }
    );
  }

  // Navigation state helpers
  static async getNavigationHistory(): Promise<any[]> {
    const deepLinking = DeepLinkingService.getInstance();
    return await deepLinking.getNavigationHistory();
  }

  // URL helpers
  static generateInviteLink(dealId: string, inviteToken?: string): string {
    const params = inviteToken ? { token: inviteToken } : undefined;
    return DeepLinkingService.generateUniversalLink(`/deal/${dealId}/accept`, params);
  }

  static generateMilestoneSubmissionLink(milestoneId: string): string {
    return DeepLinkingService.generateUniversalLink(`/milestone/${milestoneId}/submit`);
  }

  static generateMilestoneReviewLink(milestoneId: string): string {
    return DeepLinkingService.generateUniversalLink(`/milestone/${milestoneId}/review`);
  }

  // Conditional navigation based on user role
  static navigateBasedOnRole(
    userRole: 'CREATOR' | 'BRAND' | 'ADMIN',
    paths: {
      creator?: string;
      brand?: string;
      admin?: string;
      default?: string;
    }
  ): void {
    let targetPath = paths.default || '/(tabs)/deals';

    switch (userRole) {
      case 'CREATOR':
        targetPath = paths.creator || targetPath;
        break;
      case 'BRAND':
        targetPath = paths.brand || targetPath;
        break;
      case 'ADMIN':
        targetPath = paths.admin || targetPath;
        break;
    }

    router.push(targetPath);
  }

  // Handle post-authentication redirect
  static handlePostAuthRedirect(pendingUrl?: string): void {
    if (pendingUrl) {
      const deepLinking = DeepLinkingService.getInstance();
      deepLinking.clearPendingUrl();
      // The deep linking service will handle the URL
      return;
    }

    // Default to main screen
    this.resetToMain();
  }

  // Error navigation (when something goes wrong)
  static handleNavigationError(error?: string): void {
    console.error('Navigation error:', error);
    
    // Log error for analytics/debugging
    // You could send this to your error tracking service
    
    // Reset to a safe state
    this.resetToMain();
  }

  // Check if we can navigate to a specific route
  static canNavigateTo(path: string): boolean {
    try {
      // This is a simple check - in a real app you might want to check
      // user permissions, auth state, etc.
      return path.startsWith('/') || path.startsWith('(');
    } catch {
      return false;
    }
  }
}
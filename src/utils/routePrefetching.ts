// OPTIMIZATION: Route prefetching system to preload likely next routes
import { UserRole } from '@/contexts/AuthContext';

// Define likely navigation paths for each user role
export const PREFETCH_ROUTES: Record<UserRole, string[]> = {
  CREATOR: ['/deals', '/deliverables', '/payouts', '/settings'],
  BRAND: ['/projects', '/creators', '/payments', '/settings'], 
  ADMIN: ['/admin/users', '/admin/deals', '/admin/transactions', '/settings'],
  AGENCY: ['/agency/creators', '/agency/deals', '/agency/analytics', '/settings']
};

// Track which routes have been prefetched to avoid duplicates
const prefetchedRoutes = new Set<string>();

/**
 * Prefetch route components for faster navigation
 * Uses dynamic imports with webpack magic comments for chunk naming
 */
export async function prefetchRoute(path: string): Promise<void> {
  if (prefetchedRoutes.has(path)) return;
  
  try {
    switch (path) {
      case '/deals':
        await import(/* webpackChunkName: "deals" */ '@/pages/Deals');
        break;
      case '/deliverables':
        await import(/* webpackChunkName: "deliverables" */ '@/pages/Deliverables');
        break;
      case '/payouts':
        await import(/* webpackChunkName: "payouts" */ '@/pages/Payouts');
        break;
      case '/projects':
        await import(/* webpackChunkName: "projects" */ '@/pages/Projects');
        break;
      case '/creators':
        await import(/* webpackChunkName: "creators" */ '@/pages/Creators');
        break;
      case '/payments':
        await import(/* webpackChunkName: "payments" */ '@/pages/Payments');
        break;
      case '/settings':
        await import(/* webpackChunkName: "settings" */ '@/pages/Settings');
        break;
      case '/admin/users':
        await import(/* webpackChunkName: "admin-users" */ '@/pages/admin/Users');
        break;
      case '/admin/deals':
        await import(/* webpackChunkName: "admin-deals" */ '@/pages/admin/Deals');
        break;
      case '/admin/transactions':
        await import(/* webpackChunkName: "admin-transactions" */ '@/pages/admin/Transactions');
        break;
      default:
        // For other routes, try to prefetch if they exist
        console.debug(`Route prefetching not configured for: ${path}`);
        return;
    }
    
    prefetchedRoutes.add(path);
    console.debug(`Prefetched route: ${path}`);
  } catch (error) {
    console.warn(`Failed to prefetch route ${path}:`, error);
  }
}

/**
 * Prefetch all likely routes for a user role
 * Uses requestIdleCallback for optimal performance
 */
export function prefetchUserRoutes(userRole: UserRole, delay: number = 1000): void {
  const routes = PREFETCH_ROUTES[userRole] || [];
  
  // Use requestIdleCallback if available, otherwise setTimeout
  const scheduleWork = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback, { timeout: delay * 2 });
    } else {
      setTimeout(callback, delay);
    }
  };

  scheduleWork(() => {
    routes.forEach((route, index) => {
      // Stagger prefetching to avoid blocking
      setTimeout(() => {
        prefetchRoute(route);
      }, index * 200);
    });
  });
}

/**
 * Prefetch a specific route when user hovers over a link
 * Provides instant navigation feel
 */
export function prefetchOnHover(path: string): void {
  // Small delay to avoid unnecessary prefetching on quick mouse movements
  setTimeout(() => {
    prefetchRoute(path);
  }, 100);
}

/**
 * Clear prefetch cache (useful for testing or memory management)
 */
export function clearPrefetchCache(): void {
  prefetchedRoutes.clear();
}

/**
 * Get prefetching statistics for debugging
 */
export function getPrefetchStats() {
  return {
    prefetchedCount: prefetchedRoutes.size,
    prefetchedRoutes: Array.from(prefetchedRoutes)
  };
}
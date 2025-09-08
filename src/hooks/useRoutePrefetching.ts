// OPTIMIZATION: Hook for route prefetching integration
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { prefetchUserRoutes, prefetchOnHover } from '@/utils/routePrefetching';

/**
 * Hook that automatically prefetches routes based on user role
 */
export function useRoutePrefetching() {
  const { userProfile } = useAuth();

  useEffect(() => {
    if (userProfile?.role) {
      // Start prefetching after a short delay to prioritize initial page load
      prefetchUserRoutes(userProfile.role, 1500);
    }
  }, [userProfile?.role]);

  return {
    prefetchOnHover,
  };
}

/**
 * Enhanced Link component with hover prefetching
 */
export interface PrefetchLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function PrefetchLink({ to, children, className, onClick }: PrefetchLinkProps) {
  const { prefetchOnHover } = useRoutePrefetching();

  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => prefetchOnHover(to)}
      onFocus={() => prefetchOnHover(to)}
    >
      {children}
    </a>
  );
}
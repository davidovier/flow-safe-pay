import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RoleRouterProps {
  children?: React.ReactNode;
}

// Role-specific default routes after authentication
const ROLE_ROUTES: Record<UserRole, string> = {
  CREATOR: '/dashboard/creator',
  BRAND: '/dashboard/brand', 
  AGENCY: '/dashboard/agency',
  ADMIN: '/dashboard/admin',
};

// Role-specific onboarding routes for first-time users
const ONBOARDING_ROUTES: Record<UserRole, string> = {
  CREATOR: '/onboarding/creator',
  BRAND: '/onboarding/brand',
  AGENCY: '/onboarding/agency', 
  ADMIN: '/dashboard/admin', // Admins don't need onboarding
};

export function RoleRouter({ children }: RoleRouterProps) {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading || !userProfile) return;

    const { role } = userProfile;
    
    // Check if user needs onboarding based on profile completeness
    const needsOnboarding = checkIfNeedsOnboarding(userProfile);
    
    if (needsOnboarding) {
      // Redirect to role-specific onboarding
      navigate(ONBOARDING_ROUTES[role], { replace: true });
    } else {
      // Redirect to role-specific dashboard
      navigate(ROLE_ROUTES[role], { replace: true });
    }
  }, [userProfile, loading, navigate]);

  // Show loading while determining route
  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-600">Setting up your workspace...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Determine if user needs onboarding based on profile completeness
function checkIfNeedsOnboarding(userProfile: any): boolean {
  const { role, first_name, last_name } = userProfile;
  
  // Basic checks that apply to all roles
  if (!first_name || !last_name) {
    return true;
  }
  
  // Role-specific onboarding checks
  switch (role) {
    case 'CREATOR':
      // Creators need portfolio/content type setup
      return !userProfile.creator_profile_completed;
      
    case 'BRAND':
      // Brands need company info and campaign preferences
      return !userProfile.brand_profile_completed;
      
    case 'AGENCY':
      // Agencies need agency setup and creator management preferences
      return !userProfile.agency_profile_completed;
      
    case 'ADMIN':
      // Admins don't need onboarding
      return false;
      
    default:
      return true;
  }
}

// Hook to get role-specific navigation paths
export function useRoleNavigation() {
  const { userProfile } = useAuth();
  
  const getRoleDashboard = (role?: UserRole) => {
    const userRole = role || userProfile?.role;
    return userRole ? ROLE_ROUTES[userRole] : '/dashboard';
  };
  
  const getRoleOnboarding = (role?: UserRole) => {
    const userRole = role || userProfile?.role;
    return userRole ? ONBOARDING_ROUTES[userRole] : '/onboarding';
  };
  
  const isInCorrectEnvironment = (currentPath: string) => {
    if (!userProfile) return true;
    
    const expectedDashboard = ROLE_ROUTES[userProfile.role];
    return currentPath.startsWith(expectedDashboard);
  };
  
  return {
    getRoleDashboard,
    getRoleOnboarding,
    isInCorrectEnvironment,
    userRole: userProfile?.role,
  };
}
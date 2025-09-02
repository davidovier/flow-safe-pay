import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      // Check if user profile is deleted/missing (additional safeguard)
      if (user && !userProfile) {
        console.log('ProtectedRoute: User authenticated but no profile found - likely deleted account');
        navigate('/auth', { replace: true });
        return;
      }

      // Check if account is marked as deleted
      if (userProfile && (
        userProfile.email === 'DELETED_ACCOUNT' || 
        userProfile.first_name === '[DELETED]' ||
        userProfile.kyc_status === 'DELETED'
      )) {
        console.log('ProtectedRoute: Deleted account detected, redirecting to auth');
        navigate('/auth', { replace: true });
        return;
      }

      if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
        navigate('/', { replace: true });
        return;
      }
    }
  }, [user, userProfile, loading, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role))) {
    return null;
  }

  return <>{children}</>;
}
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
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Landing from './Landing';
import Dashboard from './Dashboard';
import { AppLayout } from '@/components/layout/AppLayout';

const Index = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  // If user is authenticated, show dashboard in app layout
  if (!loading && userProfile) {
    return (
      <AppLayout>
        <Dashboard />
      </AppLayout>
    );
  }

  // If user is not authenticated, show landing page
  if (!loading && !userProfile) {
    return <Landing />;
  }

  // Show loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default Index;

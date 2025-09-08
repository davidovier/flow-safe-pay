import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AgencyDashboard } from './AgencyDashboard';
import { BrandDashboard } from './BrandDashboard';
import { CreatorDashboard } from './CreatorDashboard';

// Import other dashboard components when they exist
// import { AdminDashboard } from './AdminDashboard';

interface DashboardRouterProps {
  // Allow passing additional props that might be needed by specific dashboards
  [key: string]: any;
}

export function DashboardRouter(props: DashboardRouterProps) {
  const { userProfile } = useAuth();

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Loading Dashboard...</h2>
          <p className="text-muted-foreground">Please wait while we set up your workspace.</p>
        </div>
      </div>
    );
  }

  // Route to the appropriate dashboard based on user role
  switch (userProfile.role) {
    case 'AGENCY':
      return <AgencyDashboard {...props} />;
    
    case 'CREATOR':
      return <CreatorDashboard {...props} />;
    
    case 'BRAND':
      return <BrandDashboard {...props} />;
    
    case 'ADMIN':
      // For now, show a placeholder - replace with actual AdminDashboard when ready
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              System administration and platform management.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Total Users</h3>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Active Deals</h3>
              </div>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Platform Revenue</h3>
              </div>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
            
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium">Success Rate</h3>
              </div>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">Deal completion</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
            <div className="space-y-2 text-sm">
              <p>• Monitor platform health and performance</p>
              <p>• Manage user accounts and verifications</p>
              <p>• Review and resolve disputes</p>
              <p>• Configure platform settings and policies</p>
            </div>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-2">Unknown User Role</h2>
            <p className="text-muted-foreground">
              We couldn't determine your user type. Please contact support.
            </p>
          </div>
        </div>
      );
  }
}
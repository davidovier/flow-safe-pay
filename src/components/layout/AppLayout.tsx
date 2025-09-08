import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  FolderOpen, 
  Handshake, 
  Upload, 
  CreditCard, 
  Settings, 
  LogOut,
  Users,
  Building2,
  Crown,
  BarChart3
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { userProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const getNavItems = () => {
    if (!userProfile) return [];

    const baseItems = [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
    ];

    if (userProfile.role === 'BRAND') {
      return [
        ...baseItems,
        { icon: Users, label: 'Creators', path: '/creators' },
        { icon: FolderOpen, label: 'Projects', path: '/projects' },
        { icon: Handshake, label: 'Deals', path: '/deals' },
        { icon: CreditCard, label: 'Payments', path: '/payments' },
      ];
    }

    if (userProfile.role === 'CREATOR') {
      return [
        ...baseItems,
        { icon: Handshake, label: 'My Deals', path: '/deals' },
        { icon: Upload, label: 'Deliverables', path: '/deliverables' },
        { icon: CreditCard, label: 'Payouts', path: '/payouts' },
      ];
    }

    if (userProfile.role === 'AGENCY') {
      return [
        ...baseItems,
        { icon: Users, label: 'Creators', path: '/agency/creators' },
        { icon: Handshake, label: 'Deals', path: '/agency/deals' },
        { icon: BarChart3, label: 'Analytics', path: '/agency/analytics' },
        { icon: Crown, label: 'Subscription', path: '/agency/subscription' },
        { icon: Building2, label: 'Agency Settings', path: '/agency/settings' },
      ];
    }

    if (userProfile.role === 'ADMIN') {
      return [
        ...baseItems,
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Handshake, label: 'All Deals', path: '/admin/deals' },
        { icon: CreditCard, label: 'Transactions', path: '/admin/transactions' },
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-primary">FlowPay</h1>
            {userProfile && (
              <Badge variant="secondary" className="text-xs">
                {userProfile.role}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {userProfile?.first_name?.[0]}{userProfile?.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - hidden on mobile, shown on desktop */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16 lg:bg-card/30 lg:border-r">
          <nav className="flex-1 p-4 space-y-2 flex flex-col">
            <div className="space-y-2">
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
            
            {/* Logout button at bottom */}
            <div className="mt-auto pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 lg:pl-64">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 4).map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              className="flex-col h-auto py-2 px-2"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="h-4 w-4 mb-1" />
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}
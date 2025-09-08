import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export function UserRoleDebug() {
  const { user, userProfile, loading } = useAuth();
  const [authMetadata, setAuthMetadata] = useState<any>(null);

  const fetchAuthMetadata = async () => {
    if (user) {
      // Get the raw user data from auth.users
      const { data } = await supabase.auth.getUser();
      setAuthMetadata(data.user?.user_metadata || data.user?.raw_user_meta_data);
    }
  };

  if (loading) return <div>Loading auth debug...</div>;

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800 flex items-center gap-2">
          🐛 User Role Debug Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold">Auth User Info:</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify({
              id: user?.id,
              email: user?.email,
              created_at: user?.created_at,
            }, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">User Profile:</h4>
          <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
            {JSON.stringify(userProfile, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-semibold">Role Status:</h4>
          <div className="flex gap-2">
            <Badge variant={userProfile?.role === 'BRAND' ? 'default' : 'secondary'}>
              Brand: {userProfile?.role === 'BRAND' ? '✅' : '❌'}
            </Badge>
            <Badge variant={userProfile?.role === 'CREATOR' ? 'default' : 'secondary'}>
              Creator: {userProfile?.role === 'CREATOR' ? '✅' : '❌'}
            </Badge>
            <Badge variant={userProfile?.role === 'ADMIN' ? 'destructive' : 'secondary'}>
              Admin: {userProfile?.role === 'ADMIN' ? '✅' : '❌'}
            </Badge>
          </div>
        </div>

        <div>
          <Button 
            onClick={fetchAuthMetadata} 
            size="sm" 
            variant="outline"
            className="text-xs"
          >
            Fetch Auth Metadata
          </Button>
          {authMetadata && (
            <pre className="text-xs bg-white p-2 rounded border mt-2 overflow-auto max-h-32">
              {JSON.stringify(authMetadata, null, 2)}
            </pre>
          )}
        </div>

        <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
          <strong>Expected Behavior:</strong> If you signed up as a BRAND, your role should show BRAND. 
          If it shows CREATOR, there's a bug in the database trigger that assigns roles during signup.
        </div>
      </CardContent>
    </Card>
  );
}
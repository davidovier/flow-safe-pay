import React, { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Smartphone, Monitor, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  types: {
    [key: string]: {
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
}

interface NotificationSettingsProps {
  onBack: () => void;
}

export function NotificationSettings({ onBack }: NotificationSettingsProps) {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: true,
    inApp: true,
    types: {},
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const notificationTypes = [
    {
      key: 'DEAL_CREATED',
      label: 'Deal Created',
      description: 'When a new deal is created for you',
      category: 'Deals',
    },
    {
      key: 'DEAL_ACCEPTED',
      label: 'Deal Accepted',
      description: 'When someone accepts your deal',
      category: 'Deals',
    },
    {
      key: 'DEAL_FUNDED',
      label: 'Deal Funded',
      description: 'When a deal is successfully funded',
      category: 'Deals',
    },
    {
      key: 'MILESTONE_SUBMITTED',
      label: 'Milestone Submitted',
      description: 'When a deliverable is submitted for review',
      category: 'Milestones',
    },
    {
      key: 'MILESTONE_APPROVED',
      label: 'Milestone Approved',
      description: 'When your milestone is approved',
      category: 'Milestones',
    },
    {
      key: 'MILESTONE_REJECTED',
      label: 'Milestone Rejected',
      description: 'When your milestone needs revisions',
      category: 'Milestones',
    },
    {
      key: 'MILESTONE_AUTO_RELEASED',
      label: 'Auto-Released',
      description: 'When a milestone is automatically approved and released',
      category: 'Milestones',
    },
    {
      key: 'PAYMENT_RECEIVED',
      label: 'Payment Received',
      description: 'When you receive a payment',
      category: 'Payments',
    },
    {
      key: 'PAYMENT_FAILED',
      label: 'Payment Failed',
      description: 'When a payment fails or is rejected',
      category: 'Payments',
    },
    {
      key: 'KYC_APPROVED',
      label: 'KYC Approved',
      description: 'When your identity verification is approved',
      category: 'Account',
    },
    {
      key: 'KYC_REJECTED',
      label: 'KYC Rejected',
      description: 'When your identity verification needs attention',
      category: 'Account',
    },
    {
      key: 'DISPUTE_CREATED',
      label: 'Dispute Created',
      description: 'When a dispute is raised on your deal',
      category: 'Disputes',
    },
    {
      key: 'DISPUTE_RESOLVED',
      label: 'Dispute Resolved',
      description: 'When a dispute is resolved',
      category: 'Disputes',
    },
    {
      key: 'REMINDER',
      label: 'Reminders',
      description: 'Important reminders and deadlines',
      category: 'System',
    },
    {
      key: 'SYSTEM_ALERT',
      label: 'System Alerts',
      description: 'Important system announcements',
      category: 'System',
    },
  ];

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/notifications/preferences');
      setPreferences(response.data.preferences);
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load notification preferences',
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      await apiClient.put('/notifications/preferences', preferences);
      toast({
        title: 'Settings Saved',
        description: 'Your notification preferences have been updated',
      });
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save notification preferences',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateGlobalPreference = (channel: keyof Omit<NotificationPreferences, 'types'>, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [channel]: value,
    }));
  };

  const updateTypePreference = (type: string, channel: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: {
          ...prev.types[type],
          [channel]: value,
        },
      },
    }));
  };

  const getTypePreference = (type: string, channel: string): boolean => {
    return preferences.types[type]?.[channel] ?? preferences[channel as keyof Omit<NotificationPreferences, 'types'>];
  };

  const groupedTypes = notificationTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof notificationTypes>);

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="text-center text-sm text-muted-foreground mt-2">Loading preferences...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold">Notification Settings</h3>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="p-4 space-y-6">
          {/* Global Settings */}
          <div>
            <h4 className="font-medium text-sm mb-4">Delivery Methods</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">In-App Notifications</Label>
                    <p className="text-xs text-muted-foreground">Show notifications in the app</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.inApp}
                  onCheckedChange={(checked) => updateGlobalPreference('inApp', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send notifications to your email</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email}
                  onCheckedChange={(checked) => updateGlobalPreference('email', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-xs text-muted-foreground">Send push notifications to your devices</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.push}
                  onCheckedChange={(checked) => updateGlobalPreference('push', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div>
            <h4 className="font-medium text-sm mb-4">Notification Types</h4>
            
            {Object.entries(groupedTypes).map(([category, types]) => (
              <div key={category} className="mb-6">
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {category}
                </h5>
                
                <div className="space-y-4">
                  {types.map((type) => (
                    <div key={type.key} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Label className="text-sm font-medium">{type.label}</Label>
                          <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-3 w-3" />
                          <Switch
                            checked={getTypePreference(type.key, 'inApp')}
                            onCheckedChange={(checked) => updateTypePreference(type.key, 'inApp', checked)}
                            className="scale-75"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <Switch
                            checked={getTypePreference(type.key, 'email')}
                            onCheckedChange={(checked) => updateTypePreference(type.key, 'email', checked)}
                            className="scale-75"
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-3 w-3" />
                          <Switch
                            checked={getTypePreference(type.key, 'push')}
                            onCheckedChange={(checked) => updateTypePreference(type.key, 'push', checked)}
                            className="scale-75"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <Button 
              onClick={savePreferences} 
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
import React, { useState } from 'react';
import { Settings, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const NotificationSettings: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dealUpdates, setDealUpdates] = useState(true);
  const [milestoneUpdates, setMilestoneUpdates] = useState(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Email Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Receive browser push notifications
              </p>
            </div>
            <Switch
              checked={pushNotifications}
              onCheckedChange={setPushNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Deal Updates</h4>
              <p className="text-sm text-muted-foreground">
                Notifications about deal status changes
              </p>
            </div>
            <Switch
              checked={dealUpdates}
              onCheckedChange={setDealUpdates}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Milestone Updates</h4>
              <p className="text-sm text-muted-foreground">
                Notifications about milestone submissions and approvals
              </p>
            </div>
            <Switch
              checked={milestoneUpdates}
              onCheckedChange={setMilestoneUpdates}
            />
          </div>
        </div>

        <Button>Save Settings</Button>
      </CardContent>
    </Card>
  );
};
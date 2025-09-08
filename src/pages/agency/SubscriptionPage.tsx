import React from 'react';
import { SubscriptionManagement } from '@/components/subscription/SubscriptionManagement';

export function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-muted-foreground">
          Manage your agency subscription, billing, and usage.
        </p>
      </div>

      <SubscriptionManagement />
    </div>
  );
}
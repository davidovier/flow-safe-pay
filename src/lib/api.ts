// API utility functions for the application
import { supabase } from '@/integrations/supabase/client';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: string;
  readAt?: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchNotifications(): Promise<NotificationData[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(notification => ({
    ...notification,
    readAt: notification.read_at
  }));
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null);

  if (error) throw error;
}
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiClient } from '../../src/services/api';

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'CREATOR' | 'BRAND' | 'ADMIN';
  kyc_status: 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  created_at: string;
  notification_preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
    deal_updates: boolean;
    milestone_updates: boolean;
    payment_updates: boolean;
  };
}

const ProfileSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

const ProfileItem: React.FC<{ 
  icon: string; 
  title: string; 
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
}> = ({ icon, title, subtitle, value, onPress, showArrow = true }) => (
  <TouchableOpacity 
    style={styles.profileItem} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.profileItemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={20} color="#007AFF" />
      </View>
      <View style={styles.profileItemText}>
        <Text style={styles.profileItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.profileItemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.profileItemRight}>
      {value && <Text style={styles.profileItemValue}>{value}</Text>}
      {showArrow && onPress && (
        <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
      )}
    </View>
  </TouchableOpacity>
);

const NotificationItem: React.FC<{
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}> = ({ icon, title, subtitle, value, onToggle }) => (
  <View style={styles.profileItem}>
    <View style={styles.profileItemLeft}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon as any} size={20} color="#007AFF" />
      </View>
      <View style={styles.profileItemText}>
        <Text style={styles.profileItemTitle}>{title}</Text>
        <Text style={styles.profileItemSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: '#E5E5EA', true: '#34C759' }}
      thumbColor="#FFFFFF"
    />
  </View>
);

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  const { user, logout } = useAuth();
  const router = useRouter();

  const loadProfile = async () => {
    try {
      const response = await apiClient.get('/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationPreference = async (key: string, value: boolean) => {
    if (!profile) return;
    
    setUpdating(true);
    try {
      const updatedPreferences = {
        ...profile.notification_preferences,
        [key]: value,
      };
      
      await apiClient.put('/profile/notifications', updatedPreferences);
      
      setProfile({
        ...profile,
        notification_preferences: updatedPreferences,
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive', 
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Info', 'Account deletion will be implemented in a future update.');
          }
        },
      ]
    );
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'CREATOR': return '#32D74B';
      case 'BRAND': return '#007AFF';
      case 'AGENCY': return '#8B5CF6';
      case 'ADMIN': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getKycStatusInfo = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return { text: 'Verified', color: '#34C759', icon: 'checkmark-circle' };
      case 'PENDING':
        return { text: 'Pending Review', color: '#FF9500', icon: 'time' };
      case 'REJECTED':
        return { text: 'Verification Failed', color: '#FF3B30', icon: 'close-circle' };
      default:
        return { text: 'Not Started', color: '#8E8E93', icon: 'help-circle' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  useEffect(() => {
    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Ionicons name="person-outline" size={64} color="#8E8E93" />
        <Text style={styles.errorTitle}>Profile Unavailable</Text>
        <Text style={styles.errorSubtitle}>
          Unable to load your profile. Please try again.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const kycInfo = getKycStatusInfo(profile.kyc_status);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.first_name[0]}{profile.last_name[0]}
            </Text>
          </View>
        </View>
        <Text style={styles.profileName}>
          {profile.first_name} {profile.last_name}
        </Text>
        <Text style={styles.profileEmail}>{profile.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(profile.role) }]}>
          <Text style={styles.roleBadgeText}>{profile.role}</Text>
        </View>
      </View>

      {/* Account Information */}
      <ProfileSection title="Account Information">
        <ProfileItem
          icon="person"
          title="Personal Information"
          subtitle="Update your name and contact details"
          onPress={() => router.push('/profile/edit')}
        />
        <ProfileItem
          icon="shield-checkmark"
          title="Identity Verification"
          subtitle={kycInfo.text}
          value={kycInfo.text}
          onPress={() => router.push('/profile/kyc')}
        />
        <ProfileItem
          icon="card"
          title="Payment Methods"
          subtitle="Manage your payment and payout methods"
          onPress={() => router.push('/profile/payment-methods')}
        />
        <ProfileItem
          icon="document-text"
          title="Tax Information"
          subtitle="Update your tax and billing details"
          onPress={() => router.push('/profile/tax-info')}
        />
        {profile.role === 'AGENCY' && (
          <>
            <ProfileItem
              icon="business"
              title="Agency Settings"
              subtitle="Manage your agency configuration"
              onPress={() => router.push('/profile/agency-settings')}
            />
            <ProfileItem
              icon="people"
              title="Creator Management"
              subtitle="View and manage your creators"
              onPress={() => router.push('/agency/creators')}
            />
            <ProfileItem
              icon="star"
              title="Subscription"
              subtitle="Manage your agency subscription"
              onPress={() => router.push('/profile/subscription')}
            />
          </>
        )}
      </ProfileSection>

      {/* Notification Preferences */}
      <ProfileSection title="Notifications">
        <NotificationItem
          icon="mail"
          title="Email Notifications"
          subtitle="Receive important updates via email"
          value={profile.notification_preferences.email_notifications}
          onToggle={(value) => updateNotificationPreference('email_notifications', value)}
        />
        <NotificationItem
          icon="notifications"
          title="Push Notifications"
          subtitle="Get notified about app activities"
          value={profile.notification_preferences.push_notifications}
          onToggle={(value) => updateNotificationPreference('push_notifications', value)}
        />
        <NotificationItem
          icon="briefcase"
          title="Deal Updates"
          subtitle="Notifications about deal status changes"
          value={profile.notification_preferences.deal_updates}
          onToggle={(value) => updateNotificationPreference('deal_updates', value)}
        />
        <NotificationItem
          icon="checkmark-circle"
          title="Milestone Updates"
          subtitle="Alerts for milestone submissions and approvals"
          value={profile.notification_preferences.milestone_updates}
          onToggle={(value) => updateNotificationPreference('milestone_updates', value)}
        />
        <NotificationItem
          icon="card"
          title="Payment Updates"
          subtitle="Notifications about payments and payouts"
          value={profile.notification_preferences.payment_updates}
          onToggle={(value) => updateNotificationPreference('payment_updates', value)}
        />
      </ProfileSection>

      {/* Support & Legal */}
      <ProfileSection title="Support & Legal">
        <ProfileItem
          icon="help-circle"
          title="Help & Support"
          subtitle="Get help or contact support"
          onPress={() => router.push('/support')}
        />
        <ProfileItem
          icon="document"
          title="Terms of Service"
          subtitle="Read our terms and conditions"
          onPress={() => router.push('/legal/terms')}
        />
        <ProfileItem
          icon="shield"
          title="Privacy Policy"
          subtitle="Learn how we protect your data"
          onPress={() => router.push('/legal/privacy')}
        />
        <ProfileItem
          icon="information-circle"
          title="About FlowPay"
          subtitle={`Member since ${formatDate(profile.created_at)}`}
          onPress={() => router.push('/about')}
        />
      </ProfileSection>

      {/* Account Actions */}
      <ProfileSection title="Account Actions">
        <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={[styles.actionButtonText, { color: '#FF3B30' }]}>Delete Account</Text>
        </TouchableOpacity>
      </ProfileSection>

      {/* Loading overlay */}
      {updating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 0,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemText: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileItemValue: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
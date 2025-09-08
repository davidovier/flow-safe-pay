import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { api } from '../../src/services/api';

interface AgencyStats {
  totalClients: number;
  totalCreators: number;
  activeDeals: number;
  totalRevenue: number;
  totalCommission: number;
  completedDeals: number;
  tier: string;
  creatorLimit: number;
  clientLimit: number;
  conversionRate: number;
}

interface Creator {
  id: string;
  email: string;
  createdAt: string;
  kycStatus: string;
}

export default function AgencyScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [agency, setAgency] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAgencyData = async () => {
    try {
      const [agencyResponse, analyticsResponse] = await Promise.all([
        api.get('/agencies/me'),
        // TODO: Replace with actual analytics endpoint
        Promise.resolve({
          data: {
            totalClients: 5,
            totalCreators: 18,
            activeDeals: 12,
            totalRevenue: 185000,
            totalCommission: 27750,
            completedDeals: 28,
            conversionRate: 74,
          }
        })
      ]);

      setAgency(agencyResponse.data);
      setStats({
        ...analyticsResponse.data,
        tier: agencyResponse.data.subscription?.tier || 'PROFESSIONAL',
        creatorLimit: agencyResponse.data.maxCreators || 25,
        clientLimit: agencyResponse.data.maxClients || 10,
      });
    } catch (error: any) {
      console.error('Error loading agency data:', error);
      Alert.alert('Error', 'Failed to load agency data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'AGENCY') {
      loadAgencyData();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAgencyData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (user?.role !== 'AGENCY') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="business" size={64} color="#8B5CF6" />
          <Text style={styles.errorTitle}>Agency Access Required</Text>
          <Text style={styles.errorText}>
            This section is only available to Agency users
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="hourglass-outline" size={48} color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading agency data...</Text>
        </View>
      </View>
    );
  }

  if (!agency) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="add-circle-outline" size={64} color="#8B5CF6" />
          <Text style={styles.errorTitle}>Set Up Your Agency</Text>
          <Text style={styles.errorText}>
            Complete your agency setup to start managing creators
          </Text>
          <TouchableOpacity style={styles.setupButton}>
            <Text style={styles.setupButtonText}>Complete Setup</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Agency Dashboard</Text>
          <Text style={styles.agencyName}>{agency.name}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <Ionicons name="business" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>
              {stats?.totalClients || 0}
              <Text style={styles.statLimit}>/{stats?.clientLimit || 10}</Text>
            </Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
          
          <View style={[styles.statCard, styles.statCardSecondary]}>
            <Ionicons name="people" size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>
              {stats?.totalCreators || 0}
              <Text style={styles.statLimit}>/{stats?.creatorLimit || 25}</Text>
            </Text>
            <Text style={styles.statLabel}>Creators</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardSecondary]}>
            <Ionicons name="briefcase" size={24} color="#059669" />
            <Text style={styles.statValue}>{stats?.activeDeals || 0}</Text>
            <Text style={styles.statLabel}>Active Deals</Text>
          </View>
          
          <View style={[styles.statCard, styles.statCardSecondary]}>
            <Ionicons name="trophy" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{stats?.conversionRate || 0}%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardSecondary]}>
            <Ionicons name="trending-up" size={24} color="#DC2626" />
            <Text style={styles.statValue}>
              {formatCurrency(stats?.totalRevenue || 0)}
            </Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          
          <View style={[styles.statCard, styles.statCardSecondary]}>
            <Ionicons name="card" size={24} color="#10B981" />
            <Text style={styles.statValue}>
              {formatCurrency(stats?.totalCommission || 0)}
            </Text>
            <Text style={styles.statLabel}>Commission</Text>
          </View>
        </View>
      </View>

      {/* Subscription Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Ionicons name="star" size={20} color="#F59E0B" />
            <Text style={styles.subscriptionTier}>{stats?.tier || 'STARTER'}</Text>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subscriptionDescription}>
            Managing {stats?.totalClients || 0} clients and {stats?.totalCreators || 0} creators
          </Text>
          {stats && (stats.totalCreators >= stats.creatorLimit * 0.8 || stats.totalClients >= stats.clientLimit * 0.8) && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.warningText}>
                Approaching capacity limits. Consider upgrading.
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="business" size={32} color="#3B82F6" />
            <Text style={styles.actionTitle}>Onboard Client</Text>
            <Text style={styles.actionDescription}>Add new brand clients</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="person-add" size={32} color="#8B5CF6" />
            <Text style={styles.actionTitle}>Invite Creator</Text>
            <Text style={styles.actionDescription}>Expand creator portfolio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="add-circle" size={32} color="#059669" />
            <Text style={styles.actionTitle}>Create Deal</Text>
            <Text style={styles.actionDescription}>Match clients with creators</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="analytics" size={32} color="#F59E0B" />
            <Text style={styles.actionTitle}>View Analytics</Text>
            <Text style={styles.actionDescription}>Track commission & performance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="document-text" size={32} color="#0891B2" />
            <Text style={styles.actionTitle}>Deal Pipeline</Text>
            <Text style={styles.actionDescription}>Monitor active deals</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <Ionicons name="settings" size={32} color="#6B7280" />
            <Text style={styles.actionTitle}>Settings</Text>
            <Text style={styles.actionDescription}>Agency configuration</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {[
          {
            id: '1',
            icon: 'checkmark-circle',
            color: '#10B981',
            title: 'Deal completed by Mike Chen',
            subtitle: 'StyleCorp campaign - $930 commission',
            time: '2 hours ago',
          },
          {
            id: '2',
            icon: 'business',
            color: '#3B82F6',
            title: 'New client onboarded',
            subtitle: 'TechFlow joined - PROFESSIONAL tier',
            time: '1 day ago',
          },
          {
            id: '3',
            icon: 'add-circle',
            color: '#059669',
            title: 'Deal created',
            subtitle: 'FitLife x Emma Davis - $3,200 value',
            time: '2 days ago',
          },
          {
            id: '4',
            icon: 'person-add',
            color: '#8B5CF6',
            title: 'Creator invited',
            subtitle: 'Sarah Johnson accepted invitation',
            time: '3 days ago',
          },
        ].map((activity) => (
          <View key={activity.id} style={styles.activityCard}>
            <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
              <Ionicons name={activity.icon as any} size={20} color={activity.color} />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{activity.title}</Text>
              <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
            </View>
            <View style={styles.activityTime}>
              <Text style={styles.activityTimeText}>{activity.time}</Text>
            </View>
          </View>
        ))}

        {/* Quick Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Portfolio Overview</Text>
          <View style={styles.insightsCard}>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Active Creator Portfolio</Text>
              <Text style={styles.insightValue}>{stats?.totalCreators || 0} creators</Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Client Relationships</Text>
              <Text style={styles.insightValue}>{stats?.totalClients || 0} active clients</Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>This Month's Commission</Text>
              <Text style={styles.insightValue}>{formatCurrency(stats?.totalCommission || 0)}</Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightLabel}>Deal Success Rate</Text>
              <Text style={styles.insightValue}>{stats?.conversionRate || 0}%</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  agencyName: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  settingsButton: {
    padding: 8,
  },
  statsContainer: {
    padding: 20,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  statCardSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLimit: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'normal',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTier: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  upgradeButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 8,
    flex: 1,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityTime: {
    alignItems: 'flex-end',
  },
  activityTimeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  insightsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  insightLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  insightValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  creatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  creatorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  creatorEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  creatorDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  creatorStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusPending: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 20,
  },
  inviteButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  setupButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  setupButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/services/api';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  creatorsCount: number;
  deliverablesCount: number;
  pendingApprovals: number;
  completedDeliverables: number;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#34C759';
      case 'DRAFT': return '#8E8E93';
      case 'PAUSED': return '#FF9500';
      case 'COMPLETED': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.statusBadgeText}>{status}</Text>
    </View>
  );
};

const ProgressBar: React.FC<{ value: number; max: number; color?: string }> = ({ value, max, color = '#007AFF' }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: color }]} 
        />
      </View>
    </View>
  );
};

export default function CampaignsScreen() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      // Mock data - replace with actual API call
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Summer Fashion Collection',
          description: 'Promote our new summer collection with lifestyle content',
          status: 'ACTIVE',
          budget: 15000,
          spent: 8500,
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          creatorsCount: 8,
          deliverablesCount: 24,
          pendingApprovals: 3,
          completedDeliverables: 18,
        },
        {
          id: '2',
          name: 'Tech Product Launch',
          description: 'Launch campaign for our new smart watch',
          status: 'ACTIVE',
          budget: 25000,
          spent: 18750,
          startDate: '2024-07-15',
          endDate: '2024-09-15',
          creatorsCount: 12,
          deliverablesCount: 36,
          pendingApprovals: 6,
          completedDeliverables: 28,
        },
        {
          id: '3',
          name: 'Holiday Promotion',
          description: 'Holiday season promotional campaign',
          status: 'DRAFT',
          budget: 20000,
          spent: 0,
          startDate: '2024-11-01',
          endDate: '2024-12-31',
          creatorsCount: 0,
          deliverablesCount: 0,
          pendingApprovals: 0,
          completedDeliverables: 0,
        },
      ];

      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      Alert.alert('Error', 'Failed to load campaigns');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCampaigns();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading campaigns...</Text>
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
        <Text style={styles.headerTitle}>My Campaigns</Text>
        <TouchableOpacity style={styles.createButton}>
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.createButtonText}>New Campaign</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{campaigns.filter(c => c.status === 'ACTIVE').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{campaigns.filter(c => c.status === 'DRAFT').length}</Text>
          <Text style={styles.statLabel}>Draft</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {campaigns.reduce((sum, c) => sum + c.pendingApprovals, 0)}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCurrency(campaigns.reduce((sum, c) => sum + c.spent, 0))}
          </Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
      </View>

      {/* Campaigns List */}
      <View style={styles.campaignsSection}>
        <Text style={styles.sectionTitle}>Campaigns</Text>
        
        {campaigns.map((campaign) => (
          <TouchableOpacity key={campaign.id} style={styles.campaignCard}>
            <View style={styles.campaignHeader}>
              <View style={styles.campaignInfo}>
                <Text style={styles.campaignName}>{campaign.name}</Text>
                <Text style={styles.campaignDescription} numberOfLines={2}>
                  {campaign.description}
                </Text>
              </View>
              <StatusBadge status={campaign.status} />
            </View>

            <View style={styles.campaignDetails}>
              <Text style={styles.campaignDates}>
                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
              </Text>
            </View>

            {/* Budget Progress */}
            <View style={styles.budgetSection}>
              <View style={styles.budgetHeader}>
                <Text style={styles.budgetLabel}>Budget</Text>
                <Text style={styles.budgetText}>
                  {formatCurrency(campaign.spent)} / {formatCurrency(campaign.budget)}
                </Text>
              </View>
              <ProgressBar 
                value={campaign.spent} 
                max={campaign.budget}
                color="#007AFF"
              />
              <Text style={styles.budgetPercentage}>
                {Math.round((campaign.spent / campaign.budget) * 100)}% spent
              </Text>
            </View>

            {/* Campaign Stats */}
            <View style={styles.campaignStats}>
              <View style={styles.statItem}>
                <Ionicons name="people" size={16} color="#8E8E93" />
                <Text style={styles.statItemText}>{campaign.creatorsCount} creators</Text>
              </View>
              
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.statItemText}>
                  {campaign.completedDeliverables}/{campaign.deliverablesCount} done
                </Text>
              </View>
              
              {campaign.pendingApprovals > 0 && (
                <View style={styles.statItem}>
                  <Ionicons name="clock" size={16} color="#FF9500" />
                  <Text style={[styles.statItemText, { color: '#FF9500' }]}>
                    {campaign.pendingApprovals} pending
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {campaign.status === 'DRAFT' && (
                <TouchableOpacity style={[styles.actionButton, styles.primaryButton]}>
                  <Ionicons name="play" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Launch</Text>
                </TouchableOpacity>
              )}
              
              {campaign.status === 'ACTIVE' && (
                <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
                  <Ionicons name="pause" size={16} color="#007AFF" />
                  <Text style={styles.secondaryButtonText}>Pause</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
                <Ionicons name="pencil" size={16} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Edit</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
                <Ionicons name="bar-chart" size={16} color="#007AFF" />
                <Text style={styles.secondaryButtonText}>Analytics</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {campaigns.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="megaphone-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyStateTitle}>No Campaigns Yet</Text>
          <Text style={styles.emptyStateDescription}>
            Create your first campaign to start working with creators
          </Text>
          <TouchableOpacity style={styles.createFirstButton}>
            <Text style={styles.createFirstButtonText}>Create Campaign</Text>
          </TouchableOpacity>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  campaignsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  campaignInfo: {
    flex: 1,
    marginRight: 12,
  },
  campaignName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  campaignDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  campaignDetails: {
    marginBottom: 16,
  },
  campaignDates: {
    fontSize: 14,
    color: '#8E8E93',
  },
  budgetSection: {
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  budgetText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  budgetPercentage: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  campaignStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItemText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  progressBarContainer: {
    marginVertical: 4,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
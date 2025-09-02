import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiClient } from '../../src/services/api';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { NavigationHelper } from '../../src/navigation/NavigationHelper';

interface Deal {
  id: string;
  state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  amount_total: number;
  currency: string;
  created_at: string;
  updated_at: string;
  projects: {
    id: string;
    title: string;
    description: string;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string;
    };
  };
  users: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  milestones: Array<{
    id: string;
    title: string;
    description: string | null;
    amount: number;
    state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
    due_at: string | null;
    submitted_at: string | null;
  }>;
}

export default function DealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDeal();
    }
  }, [id]);

  const fetchDeal = async () => {
    try {
      const response = await apiClient.get(`/deals/${id}`);
      setDeal(response.data);
    } catch (error: any) {
      console.error('Error fetching deal:', error);
      Alert.alert(
        'Error',
        'Failed to load deal details. Please try again.',
        [
          { text: 'Go Back', onPress: () => NavigationHelper.goBack() },
          { text: 'Retry', onPress: () => fetchDeal() },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDeal();
    setRefreshing(false);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (state: string) => {
    const colors = {
      DRAFT: '#f59e0b',
      FUNDED: '#3b82f6',
      RELEASED: '#10b981',
      DISPUTED: '#ef4444',
      REFUNDED: '#6b7280',
    };
    return colors[state as keyof typeof colors] || '#6b7280';
  };

  const getMilestoneStatusColor = (state: string) => {
    const colors = {
      PENDING: '#f59e0b',
      SUBMITTED: '#3b82f6',
      APPROVED: '#10b981',
      RELEASED: '#10b981',
      DISPUTED: '#ef4444',
    };
    return colors[state as keyof typeof colors] || '#6b7280';
  };

  const getBrandName = (deal: Deal) => {
    const brand = deal.projects.users;
    return `${brand.first_name || ''} ${brand.last_name || ''}`.trim() || brand.email;
  };

  const getCreatorName = (deal: Deal) => {
    if (!deal.users) return 'Unknown Creator';
    const creator = deal.users;
    return `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.email;
  };

  const handleMilestonePress = (milestoneId: string) => {
    NavigationHelper.navigateToMilestone(milestoneId);
  };

  const handleSubmitMilestone = (milestoneId: string) => {
    NavigationHelper.navigateToSubmitMilestone(milestoneId);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!deal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Deal Not Found</Text>
          <Text style={styles.errorText}>The requested deal could not be found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{deal.projects.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(deal.state) }]}>
            <Text style={styles.statusText}>{deal.state}</Text>
          </View>
        </View>

        {/* Description */}
        {deal.projects.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{deal.projects.description}</Text>
          </View>
        )}

        {/* Deal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deal Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Total Amount</Text>
              <Text style={styles.infoValue}>
                {formatAmount(deal.amount_total, deal.currency)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={styles.infoValue}>{getBrandName(deal)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Creator</Text>
              <Text style={styles.infoValue}>{getCreatorName(deal)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDate(deal.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones ({deal.milestones.length})</Text>
          {deal.milestones.map((milestone, index) => (
            <View 
              key={milestone.id} 
              style={styles.milestoneCard}
              onTouchEnd={() => handleMilestonePress(milestone.id)}
            >
              <View style={styles.milestoneHeader}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <View style={[
                  styles.milestoneStatusBadge, 
                  { backgroundColor: getMilestoneStatusColor(milestone.state) }
                ]}>
                  <Text style={styles.milestoneStatusText}>{milestone.state}</Text>
                </View>
              </View>

              {milestone.description && (
                <Text style={styles.milestoneDescription}>{milestone.description}</Text>
              )}

              <View style={styles.milestoneFooter}>
                <Text style={styles.milestoneAmount}>
                  {formatAmount(milestone.amount, deal.currency)}
                </Text>
                {milestone.due_at && (
                  <Text style={styles.milestoneDueDate}>
                    Due: {formatDate(milestone.due_at)}
                  </Text>
                )}
              </View>

              {/* Creator actions */}
              {userProfile?.role === 'CREATOR' && milestone.state === 'PENDING' && deal.state === 'FUNDED' && (
                <View style={styles.milestoneActions}>
                  <View 
                    style={styles.actionButton}
                    onTouchEnd={() => handleSubmitMilestone(milestone.id)}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color="#007AFF" />
                    <Text style={styles.actionButtonText}>Submit Deliverable</Text>
                  </View>
                </View>
              )}

              {/* Status indicators */}
              {milestone.submitted_at && (
                <Text style={styles.milestoneSubmitted}>
                  Submitted: {formatDate(milestone.submitted_at)}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  section: {
    backgroundColor: '#ffffff',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600',
  },
  milestoneCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 12,
  },
  milestoneStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  milestoneStatusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  milestoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  milestoneDueDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  milestoneActions: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 8,
  },
  milestoneSubmitted: {
    fontSize: 12,
    color: '#059669',
    marginTop: 8,
    fontStyle: 'italic',
  },
});
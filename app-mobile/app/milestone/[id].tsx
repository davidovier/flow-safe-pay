import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiClient } from '../../src/services/api';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { NavigationHelper } from '../../src/navigation/NavigationHelper';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  currency: string;
  state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
  due_at: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  released_at: string | null;
  deal: {
    id: string;
    state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
    projects: {
      title: string;
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
  };
  deliverables?: Array<{
    id: string;
    url: string | null;
    file_hash: string | null;
    submitted_at: string | null;
    checks: any;
  }>;
}

export default function MilestoneScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMilestone();
    }
  }, [id]);

  const fetchMilestone = async () => {
    try {
      const response = await apiClient.get(`/milestones/${id}`);
      setMilestone(response.data);
    } catch (error: any) {
      console.error('Error fetching milestone:', error);
      Alert.alert(
        'Error',
        'Failed to load milestone details. Please try again.',
        [
          { text: 'Go Back', onPress: () => NavigationHelper.goBack() },
          { text: 'Retry', onPress: () => fetchMilestone() },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMilestone();
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (state: string) => {
    const colors = {
      PENDING: '#f59e0b',
      SUBMITTED: '#3b82f6',
      APPROVED: '#10b981',
      RELEASED: '#10b981',
      DISPUTED: '#ef4444',
    };
    return colors[state as keyof typeof colors] || '#6b7280';
  };

  const getBrandName = (milestone: Milestone) => {
    const brand = milestone.deal.projects.users;
    return `${brand.first_name || ''} ${brand.last_name || ''}`.trim() || brand.email;
  };

  const getCreatorName = (milestone: Milestone) => {
    if (!milestone.deal.users) return 'Unknown Creator';
    const creator = milestone.deal.users;
    return `${creator.first_name || ''} ${creator.last_name || ''}`.trim() || creator.email;
  };

  const handleSubmitDeliverable = () => {
    NavigationHelper.navigateToSubmitMilestone(milestone!.id);
  };

  const handleViewDeliverable = (deliverableId: string) => {
    NavigationHelper.navigateToDeliverable(deliverableId);
  };

  const canSubmitDeliverable = () => {
    return (
      milestone &&
      userProfile?.role === 'CREATOR' &&
      milestone.state === 'PENDING' &&
      milestone.deal.state === 'FUNDED' &&
      milestone.deal.users?.email === userProfile.email
    );
  };

  const canReviewDeliverable = () => {
    return (
      milestone &&
      userProfile?.role === 'BRAND' &&
      milestone.state === 'SUBMITTED' &&
      milestone.deal.projects.users.email === userProfile.email
    );
  };

  const isDueToday = () => {
    if (!milestone?.due_at) return false;
    const dueDate = new Date(milestone.due_at);
    const today = new Date();
    return dueDate.toDateString() === today.toDateString();
  };

  const isOverdue = () => {
    if (!milestone?.due_at) return false;
    return new Date(milestone.due_at) < new Date();
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!milestone) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Milestone Not Found</Text>
          <Text style={styles.errorText}>The requested milestone could not be found.</Text>
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
          <Text style={styles.title}>{milestone.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(milestone.state) }]}>
            <Text style={styles.statusText}>{milestone.state}</Text>
          </View>
        </View>

        {/* Due Date Alert */}
        {milestone.due_at && (isDueToday() || isOverdue()) && (
          <View style={[
            styles.alertBanner, 
            { backgroundColor: isOverdue() ? '#fef2f2' : '#fef3c7', borderColor: isOverdue() ? '#fca5a5' : '#fbbf24' }
          ]}>
            <Ionicons 
              name={isOverdue() ? "alert-circle" : "time"} 
              size={16} 
              color={isOverdue() ? "#ef4444" : "#f59e0b"} 
            />
            <Text style={[
              styles.alertText, 
              { color: isOverdue() ? '#dc2626' : '#d97706' }
            ]}>
              {isOverdue() ? 'Overdue:' : 'Due Today:'} {formatDate(milestone.due_at)}
            </Text>
          </View>
        )}

        {/* Description */}
        {milestone.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{milestone.description}</Text>
          </View>
        )}

        {/* Milestone Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestone Information</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Amount</Text>
              <Text style={styles.infoValue}>
                {formatAmount(milestone.amount, milestone.currency)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Project</Text>
              <Text style={styles.infoValue}>{milestone.deal.projects.title}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Brand</Text>
              <Text style={styles.infoValue}>{getBrandName(milestone)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Creator</Text>
              <Text style={styles.infoValue}>{getCreatorName(milestone)}</Text>
            </View>
            {milestone.due_at && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Due Date</Text>
                <Text style={styles.infoValue}>{formatDate(milestone.due_at)}</Text>
              </View>
            )}
            {milestone.submitted_at && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Submitted</Text>
                <Text style={styles.infoValue}>{formatDate(milestone.submitted_at)}</Text>
              </View>
            )}
            {milestone.approved_at && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Approved</Text>
                <Text style={styles.infoValue}>{formatDate(milestone.approved_at)}</Text>
              </View>
            )}
            {milestone.released_at && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Released</Text>
                <Text style={styles.infoValue}>{formatDate(milestone.released_at)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {(canSubmitDeliverable() || canReviewDeliverable()) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            {canSubmitDeliverable() && (
              <View 
                style={styles.actionButton}
                onTouchEnd={handleSubmitDeliverable}
              >
                <Ionicons name="cloud-upload-outline" size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Submit Deliverable</Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </View>
            )}

            {canReviewDeliverable() && (
              <View style={styles.actionButton}>
                <Ionicons name="eye-outline" size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Review Deliverable</Text>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </View>
            )}
          </View>
        )}

        {/* Deliverables */}
        {milestone.deliverables && milestone.deliverables.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Deliverables</Text>
            {milestone.deliverables.map((deliverable, index) => (
              <View 
                key={deliverable.id} 
                style={styles.deliverableCard}
                onTouchEnd={() => handleViewDeliverable(deliverable.id)}
              >
                <View style={styles.deliverableHeader}>
                  <Ionicons 
                    name={deliverable.url ? "link-outline" : "document-outline"} 
                    size={20} 
                    color="#6b7280" 
                  />
                  <Text style={styles.deliverableTitle}>
                    Deliverable #{index + 1}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                </View>

                {deliverable.submitted_at && (
                  <Text style={styles.deliverableSubmitted}>
                    Submitted: {formatDate(deliverable.submitted_at)}
                  </Text>
                )}

                {deliverable.file_hash && (
                  <View style={styles.deliverableHash}>
                    <Ionicons name="shield-checkmark-outline" size={14} color="#10b981" />
                    <Text style={styles.deliverableHashText}>
                      File integrity verified
                    </Text>
                  </View>
                )}

                {deliverable.checks?.status && (
                  <View style={styles.deliverableStatus}>
                    <View style={[
                      styles.deliverableStatusBadge,
                      { backgroundColor: getStatusColor(deliverable.checks.status.toUpperCase()) }
                    ]}>
                      <Text style={styles.deliverableStatusText}>
                        {deliverable.checks.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}

                {deliverable.checks?.feedback && (
                  <Text style={styles.deliverableFeedback}>
                    Feedback: {deliverable.checks.feedback}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Status Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Timeline</Text>
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, { backgroundColor: '#10b981' }]}>
                <Ionicons name="add-circle" size={16} color="#ffffff" />
              </View>
              <Text style={styles.timelineText}>Milestone created</Text>
            </View>

            {milestone.submitted_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, { backgroundColor: '#3b82f6' }]}>
                  <Ionicons name="cloud-upload" size={16} color="#ffffff" />
                </View>
                <Text style={styles.timelineText}>
                  Deliverable submitted - {formatDate(milestone.submitted_at)}
                </Text>
              </View>
            )}

            {milestone.approved_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, { backgroundColor: '#10b981' }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                </View>
                <Text style={styles.timelineText}>
                  Milestone approved - {formatDate(milestone.approved_at)}
                </Text>
              </View>
            )}

            {milestone.released_at && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineIcon, { backgroundColor: '#10b981' }]}>
                  <Ionicons name="cash" size={16} color="#ffffff" />
                </View>
                <Text style={styles.timelineText}>
                  Payment released - {formatDate(milestone.released_at)}
                </Text>
              </View>
            )}
          </View>
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  deliverableCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  deliverableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliverableTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    flex: 1,
    marginLeft: 8,
  },
  deliverableSubmitted: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
  },
  deliverableHash: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliverableHashText: {
    fontSize: 12,
    color: '#10b981',
    marginLeft: 4,
  },
  deliverableStatus: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  deliverableStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliverableStatusText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  deliverableFeedback: {
    fontSize: 12,
    color: '#4b5563',
    fontStyle: 'italic',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
});
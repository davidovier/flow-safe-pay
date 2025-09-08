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
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/services/api';

interface Deliverable {
  id: string;
  title: string;
  description: string;
  type: 'image' | 'video' | 'text' | 'link';
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  submittedAt: string;
  reviewedAt?: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  campaign: {
    id: string;
    name: string;
  };
  milestone: {
    id: string;
    title: string;
    amount: number;
  };
  feedback?: {
    message: string;
    rating?: number;
  };
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'approved': return '#34C759';
      case 'rejected': return '#FF3B30';
      case 'revision_requested': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'revision_requested': return 'Needs Revision';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.statusBadgeText}>{getStatusText(status)}</Text>
    </View>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  return (
    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(priority) }]}>
      <Text style={styles.priorityBadgeText}>{priority.toUpperCase()}</Text>
    </View>
  );
};

const ContentTypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const getIconName = (type: string) => {
    switch (type) {
      case 'image': return 'image';
      case 'video': return 'videocam';
      case 'text': return 'document-text';
      case 'link': return 'link';
      default: return 'document';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'image': return '#007AFF';
      case 'video': return '#FF3B30';
      case 'text': return '#34C759';
      case 'link': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  return (
    <View style={[styles.typeIconContainer, { backgroundColor: getIconColor(type) + '20' }]}>
      <Ionicons name={getIconName(type) as any} size={20} color={getIconColor(type)} />
    </View>
  );
};

export default function ContentScreen() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [filteredDeliverables, setFilteredDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewType, setReviewType] = useState<'approve' | 'reject' | 'revision'>('approve');
  const [reviewMessage, setReviewMessage] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  const router = useRouter();

  useEffect(() => {
    loadDeliverables();
  }, []);

  useEffect(() => {
    filterDeliverables();
  }, [deliverables, filterStatus]);

  const loadDeliverables = async () => {
    try {
      // Mock data - replace with actual API call
      const mockDeliverables: Deliverable[] = [
        {
          id: '1',
          title: 'Instagram Post - Summer Collection',
          description: 'Lifestyle post featuring the new summer dress collection with natural lighting and outdoor setting.',
          type: 'image',
          status: 'pending',
          submittedAt: '2024-01-15T10:30:00Z',
          creator: {
            id: '1',
            firstName: 'Sarah',
            lastName: 'Johnson',
            username: '@sarahjohnson',
          },
          campaign: {
            id: '1',
            name: 'Summer Fashion Collection',
          },
          milestone: {
            id: '1',
            title: 'Instagram Post Creation',
            amount: 750,
          },
          tags: ['Instagram', 'Fashion', 'Summer', 'Lifestyle'],
          priority: 'high',
        },
        {
          id: '2',
          title: 'YouTube Review - Smart Watch',
          description: 'Comprehensive 10-minute review of the new smart watch features.',
          type: 'video',
          status: 'pending',
          submittedAt: '2024-01-15T08:45:00Z',
          creator: {
            id: '2',
            firstName: 'Mike',
            lastName: 'Chen',
            username: '@miketechtalk',
          },
          campaign: {
            id: '2',
            name: 'Tech Product Launch',
          },
          milestone: {
            id: '2',
            title: 'Product Review Video',
            amount: 1500,
          },
          tags: ['YouTube', 'Tech', 'Review', 'Product Launch'],
          priority: 'high',
        },
        {
          id: '3',
          title: 'Wellness Blog Post',
          description: 'Article about maintaining work-life balance and mental health tips.',
          type: 'text',
          status: 'revision_requested',
          submittedAt: '2024-01-14T16:20:00Z',
          reviewedAt: '2024-01-15T09:30:00Z',
          creator: {
            id: '3',
            firstName: 'Emma',
            lastName: 'Wilson',
            username: '@emmawellness',
          },
          campaign: {
            id: '3',
            name: 'Wellness Campaign',
          },
          milestone: {
            id: '3',
            title: 'Blog Article',
            amount: 400,
          },
          feedback: {
            message: 'Great content overall! Please add more specific examples and include the brand mention in the conclusion.',
            rating: 4,
          },
          tags: ['Blog', 'Wellness', 'Mental Health'],
          priority: 'medium',
        },
        {
          id: '4',
          title: 'TikTok Recipe Video',
          description: '60-second recipe video showcasing quick meal prep.',
          type: 'video',
          status: 'approved',
          submittedAt: '2024-01-13T14:15:00Z',
          reviewedAt: '2024-01-14T10:00:00Z',
          creator: {
            id: '4',
            firstName: 'Alex',
            lastName: 'Rivera',
            username: '@alexfoodie',
          },
          campaign: {
            id: '4',
            name: 'Kitchen Products Campaign',
          },
          milestone: {
            id: '4',
            title: 'TikTok Content',
            amount: 600,
          },
          feedback: {
            message: 'Perfect execution! The video is engaging and showcases the products beautifully.',
            rating: 5,
          },
          tags: ['TikTok', 'Recipe', 'Food', 'Kitchen'],
          priority: 'low',
        },
      ];

      setDeliverables(mockDeliverables);
    } catch (error) {
      console.error('Error loading deliverables:', error);
      Alert.alert('Error', 'Failed to load deliverables');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterDeliverables = () => {
    let filtered = [...deliverables];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }

    // Sort by submission date (newest first)
    filtered.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    setFilteredDeliverables(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDeliverables();
  };

  const handleReview = (deliverable: Deliverable, type: 'approve' | 'reject' | 'revision') => {
    setSelectedDeliverable(deliverable);
    setReviewType(type);
    setReviewMessage('');
    setReviewRating(5);
    setReviewModalVisible(true);
  };

  const submitReview = async () => {
    if (!selectedDeliverable) return;

    try {
      // Mock API call - replace with actual implementation
      const updatedStatus = reviewType === 'approve' ? 'approved' : 
                           reviewType === 'reject' ? 'rejected' : 
                           'revision_requested';

      const updatedDeliverable = {
        ...selectedDeliverable,
        status: updatedStatus as any,
        reviewedAt: new Date().toISOString(),
        feedback: {
          message: reviewMessage,
          rating: reviewType === 'approve' ? reviewRating : undefined,
        },
      };

      setDeliverables(deliverables.map(d => 
        d.id === selectedDeliverable.id ? updatedDeliverable : d
      ));

      setReviewModalVisible(false);
      setSelectedDeliverable(null);

      Alert.alert(
        'Review Submitted',
        `Deliverable ${reviewType === 'approve' ? 'approved' : 
                      reviewType === 'reject' ? 'rejected' : 
                      'sent back for revision'}`
      );
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading content...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {[
          { key: 'all', label: 'All', count: deliverables.length },
          { key: 'pending', label: 'Pending', count: deliverables.filter(d => d.status === 'pending').length },
          { key: 'approved', label: 'Approved', count: deliverables.filter(d => d.status === 'approved').length },
          { key: 'revision_requested', label: 'Needs Revision', count: deliverables.filter(d => d.status === 'revision_requested').length },
          { key: 'rejected', label: 'Rejected', count: deliverables.filter(d => d.status === 'rejected').length },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              filterStatus === filter.key && styles.activeFilterTab
            ]}
            onPress={() => setFilterStatus(filter.key)}
          >
            <Text style={[
              styles.filterTabText,
              filterStatus === filter.key && styles.activeFilterTabText
            ]}>
              {filter.label}
            </Text>
            {filter.count > 0 && (
              <View style={[
                styles.filterCount,
                filterStatus === filter.key && styles.activeFilterCount
              ]}>
                <Text style={[
                  styles.filterCountText,
                  filterStatus === filter.key && styles.activeFilterCountText
                ]}>
                  {filter.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Deliverables List */}
      <ScrollView 
        style={styles.deliverablesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredDeliverables.map((deliverable) => (
          <View key={deliverable.id} style={styles.deliverableCard}>
            <View style={styles.deliverableHeader}>
              <ContentTypeIcon type={deliverable.type} />
              <View style={styles.deliverableInfo}>
                <Text style={styles.deliverableTitle}>{deliverable.title}</Text>
                <Text style={styles.deliverableDescription} numberOfLines={2}>
                  {deliverable.description}
                </Text>
              </View>
              <View style={styles.badges}>
                <StatusBadge status={deliverable.status} />
                <PriorityBadge priority={deliverable.priority} />
              </View>
            </View>

            <View style={styles.deliverableDetails}>
              <View style={styles.creatorInfo}>
                <View style={styles.creatorAvatar}>
                  <Text style={styles.avatarText}>
                    {deliverable.creator.firstName[0]}{deliverable.creator.lastName[0]}
                  </Text>
                </View>
                <View>
                  <Text style={styles.creatorName}>
                    {deliverable.creator.firstName} {deliverable.creator.lastName}
                  </Text>
                  <Text style={styles.creatorUsername}>{deliverable.creator.username}</Text>
                </View>
              </View>

              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneAmount}>{formatCurrency(deliverable.milestone.amount)}</Text>
                <Text style={styles.milestoneTitle}>{deliverable.milestone.title}</Text>
              </View>
            </View>

            <View style={styles.campaignInfo}>
              <Ionicons name="folder" size={14} color="#8E8E93" />
              <Text style={styles.campaignName}>{deliverable.campaign.name}</Text>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.submissionDate}>
                Submitted {formatDate(deliverable.submittedAt)}
              </Text>
            </View>

            {/* Tags */}
            <View style={styles.tagsContainer}>
              {deliverable.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {deliverable.tags.length > 3 && (
                <Text style={styles.moreTags}>+{deliverable.tags.length - 3}</Text>
              )}
            </View>

            {/* Feedback (if exists) */}
            {deliverable.feedback && (
              <View style={styles.feedbackContainer}>
                <View style={styles.feedbackHeader}>
                  <Ionicons name="chatbubble" size={14} color="#8E8E93" />
                  <Text style={styles.feedbackLabel}>Previous Feedback</Text>
                  {deliverable.feedback.rating && (
                    <View style={styles.ratingContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= deliverable.feedback!.rating! ? "star" : "star-outline"}
                          size={12}
                          color="#FFD700"
                        />
                      ))}
                    </View>
                  )}
                </View>
                <Text style={styles.feedbackText}>{deliverable.feedback.message}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.viewButton}>
                <Ionicons name="eye" size={16} color="#007AFF" />
                <Text style={styles.viewButtonText}>View</Text>
              </TouchableOpacity>

              {deliverable.status === 'pending' && (
                <>
                  <TouchableOpacity 
                    style={styles.approveButton}
                    onPress={() => handleReview(deliverable, 'approve')}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.revisionButton}
                    onPress={() => handleReview(deliverable, 'revision')}
                  >
                    <Ionicons name="pencil" size={16} color="#FF9500" />
                    <Text style={styles.revisionButtonText}>Revision</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.rejectButton}
                    onPress={() => handleReview(deliverable, 'reject')}
                  >
                    <Ionicons name="close" size={16} color="#FF3B30" />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ))}

        {filteredDeliverables.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="images-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyStateTitle}>
              {filterStatus === 'all' ? 'No content to review' : `No ${filterStatus.replace('_', ' ')} content`}
            </Text>
            <Text style={styles.emptyStateDescription}>
              {filterStatus === 'all' 
                ? "Content submissions will appear here for review" 
                : "Try selecting a different filter to see more content"}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewModalVisible}
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {reviewType === 'approve' ? 'Approve Content' :
                 reviewType === 'reject' ? 'Reject Content' :
                 'Request Revision'}
              </Text>
              <TouchableOpacity 
                onPress={() => setReviewModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {selectedDeliverable && (
              <View style={styles.modalBody}>
                <Text style={styles.reviewingText}>
                  Reviewing "{selectedDeliverable.title}" by {selectedDeliverable.creator.firstName} {selectedDeliverable.creator.lastName}
                </Text>

                {reviewType === 'approve' && (
                  <View style={styles.ratingSection}>
                    <Text style={styles.sectionLabel}>Rating (optional)</Text>
                    <View style={styles.starRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                          key={star}
                          onPress={() => setReviewRating(star)}
                        >
                          <Ionicons
                            name={star <= reviewRating ? "star" : "star-outline"}
                            size={32}
                            color="#FFD700"
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.messageSection}>
                  <Text style={styles.sectionLabel}>
                    {reviewType === 'approve' ? 'Feedback (optional)' :
                     reviewType === 'reject' ? 'Reason for rejection' :
                     'Revision notes'}
                  </Text>
                  <TextInput
                    style={styles.messageInput}
                    value={reviewMessage}
                    onChangeText={setReviewMessage}
                    placeholder={
                      reviewType === 'approve' ? 'Great work! The content looks perfect...' :
                      reviewType === 'reject' ? 'Please explain why this is being rejected...' :
                      'Please describe the changes needed...'
                    }
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setReviewModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.submitButton,
                      reviewType === 'reject' && styles.rejectSubmitButton
                    ]}
                    onPress={submitReview}
                  >
                    <Text style={styles.submitButtonText}>
                      {reviewType === 'approve' ? 'Approve & Release Payment' :
                       reviewType === 'reject' ? 'Reject Content' :
                       'Request Revision'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
  filterContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeFilterTabText: {
    color: '#FFFFFF',
  },
  filterCount: {
    marginLeft: 6,
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
  },
  activeFilterCountText: {
    color: '#FFFFFF',
  },
  deliverablesList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  deliverableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deliverableHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deliverableInfo: {
    flex: 1,
  },
  deliverableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  deliverableDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  badges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  priorityBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deliverableDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  creatorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  creatorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  creatorUsername: {
    fontSize: 12,
    color: '#8E8E93',
  },
  milestoneInfo: {
    alignItems: 'flex-end',
  },
  milestoneAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  milestoneTitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  campaignInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  campaignName: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  separator: {
    fontSize: 12,
    color: '#E5E5EA',
    marginHorizontal: 8,
  },
  submissionDate: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#007AFF',
  },
  moreTags: {
    fontSize: 11,
    color: '#8E8E93',
  },
  feedbackContainer: {
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  feedbackLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginLeft: 4,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  feedbackText: {
    fontSize: 13,
    color: '#000000',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 16,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#34C759',
    borderRadius: 16,
    gap: 4,
  },
  approveButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  revisionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: 16,
    gap: 4,
  },
  revisionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF9500',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 16,
    gap: 4,
  },
  rejectButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF3B30',
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
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    paddingTop: 20,
  },
  reviewingText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
  },
  ratingSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
  },
  starRating: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  messageSection: {
    marginBottom: 24,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  submitButton: {
    flex: 2,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectSubmitButton: {
    backgroundColor: '#FF3B30',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
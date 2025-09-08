import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiClient } from '../../src/services/api';

interface Deal {
  id: string;
  title: string;
  brand: {
    id: string;
    name: string;
  };
  agency?: {
    id: string;
    name: string;
  };
  totalAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  deadline: string;
  createdAt: string;
  milestones: Milestone[];
  tags: string[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  deadline: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REVISION_REQUESTED';
  feedback?: string;
  rating?: number;
}

const DealCard: React.FC<{ deal: Deal; onPress: () => void }> = ({ deal, onPress }) => {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'PENDING': return '#FF9500';
      case 'ACCEPTED':
      case 'IN_PROGRESS': return '#007AFF';
      case 'DELIVERED': return '#8B5CF6';
      case 'COMPLETED': return '#34C759';
      case 'CANCELLED': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'PENDING': return 'Pending';
      case 'ACCEPTED': return 'Accepted';
      case 'IN_PROGRESS': return 'In Progress';
      case 'DELIVERED': return 'Delivered';
      case 'COMPLETED': return 'Completed';
      case 'CANCELLED': return 'Cancelled';
      default: return state;
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getProgress = () => {
    if (deal.milestones.length === 0) return 0;
    const approvedMilestones = deal.milestones.filter(m => m.status === 'APPROVED').length;
    return (approvedMilestones / deal.milestones.length) * 100;
  };

  return (
    <TouchableOpacity style={styles.dealCard} onPress={onPress}>
      <View style={styles.dealHeader}>
        <Text style={styles.dealTitle} numberOfLines={1}>
          {deal.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStateColor(deal.status) }]}>
          <Text style={styles.statusText}>{getStateText(deal.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.dealSubtitle}>
        {deal.brand.name} {deal.agency && `via ${deal.agency.name}`}
      </Text>
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {deal.milestones.filter(m => m.status === 'APPROVED').length}/{deal.milestones.length} milestones
        </Text>
      </View>
      
      <View style={styles.dealFooter}>
        <View>
          <Text style={styles.dealAmount}>{formatAmount(deal.totalAmount)}</Text>
          <Text style={styles.dealPaid}>{formatAmount(deal.paidAmount)} paid</Text>
        </View>
        <View style={styles.dealDates}>
          <Text style={styles.dealDate}>Due: {formatDate(deal.deadline)}</Text>
          <Text style={styles.dealCreated}>Created: {formatDate(deal.createdAt)}</Text>
        </View>
      </View>
      
      {/* Tags */}
      <View style={styles.tagsContainer}>
        {deal.tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};

export default function DealsScreen() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();

  const loadDeals = async () => {
    try {
      // TODO: Replace with actual API call
      const mockDeals: Deal[] = [
        {
          id: '1',
          title: 'Summer Fashion Campaign',
          brand: { id: '1', name: 'StyleCorp' },
          agency: { id: '1', name: 'Creative Agency' },
          totalAmount: 5000,
          paidAmount: 2000,
          status: 'IN_PROGRESS',
          deadline: '2024-03-15',
          createdAt: '2024-02-01',
          tags: ['Fashion', 'Summer', 'Lifestyle'],
          milestones: [
            {
              id: '1',
              title: 'Instagram Posts',
              description: '3 high-quality Instagram posts',
              amount: 2000,
              deadline: '2024-02-20',
              status: 'APPROVED',
              feedback: 'Outstanding work! Perfect aesthetics.',
              rating: 5,
            },
            {
              id: '2',
              title: 'TikTok Videos',
              description: '2 engaging TikTok videos',
              amount: 1500,
              deadline: '2024-03-01',
              status: 'IN_PROGRESS',
            },
            {
              id: '3',
              title: 'YouTube Shorts',
              description: '1 YouTube Shorts video',
              amount: 1500,
              deadline: '2024-03-10',
              status: 'PENDING',
            },
          ],
        },
        {
          id: '2',
          title: 'Tech Product Review',
          brand: { id: '2', name: 'TechFlow' },
          totalAmount: 3500,
          paidAmount: 0,
          status: 'PENDING',
          deadline: '2024-03-25',
          createdAt: '2024-02-25',
          tags: ['Tech', 'Review', 'Innovation'],
          milestones: [
            {
              id: '4',
              title: 'Unboxing Video',
              description: 'YouTube unboxing and first impressions',
              amount: 2000,
              deadline: '2024-03-10',
              status: 'PENDING',
            },
            {
              id: '5',
              title: 'Social Media Posts',
              description: '5 Instagram stories + 3 posts',
              amount: 1500,
              deadline: '2024-03-20',
              status: 'PENDING',
            },
          ],
        },
        {
          id: '3',
          title: 'Fitness Equipment Campaign',
          brand: { id: '3', name: 'FitLife' },
          agency: { id: '2', name: 'Health Marketing Co' },
          totalAmount: 4000,
          paidAmount: 4000,
          status: 'COMPLETED',
          deadline: '2024-02-28',
          createdAt: '2024-01-15',
          tags: ['Fitness', 'Health', 'Wellness'],
          milestones: [
            {
              id: '6',
              title: 'Workout Videos',
              description: '3 workout demonstration videos',
              amount: 2500,
              deadline: '2024-02-15',
              status: 'APPROVED',
              rating: 5,
            },
            {
              id: '7',
              title: 'Before/After Content',
              description: 'Progress showcase content',
              amount: 1500,
              deadline: '2024-02-25',
              status: 'APPROVED',
              rating: 4,
            },
          ],
        },
      ];
      
      // Filter deals based on current filter
      const filteredDeals = filter 
        ? mockDeals.filter(deal => deal.status === filter)
        : mockDeals;
      
      setDeals(filteredDeals);
    } catch (error) {
      console.error('Error loading deals:', error);
      Alert.alert('Error', 'Failed to load deals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDeals();
  };

  const handleDealPress = (dealId: string) => {
    router.push(`/deal/${dealId}`);
  };

  const handleBrowseOpportunities = () => {
    // Navigate to opportunities screen or marketplace
    Alert.alert('Browse Opportunities', 'This would navigate to the opportunities marketplace');
  };

  useEffect(() => {
    loadDeals();
  }, [filter]);

  const FilterButton: React.FC<{ 
    title: string; 
    filterValue: string | null; 
    isActive: boolean 
  }> = ({ title, filterValue, isActive }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setFilter(isActive ? null : filterValue)}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading deals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton title="All" filterValue={null} isActive={filter === null} />
        <FilterButton title="Pending" filterValue="PENDING" isActive={filter === 'PENDING'} />
        <FilterButton title="Active" filterValue="IN_PROGRESS" isActive={filter === 'IN_PROGRESS'} />
        <FilterButton title="Delivered" filterValue="DELIVERED" isActive={filter === 'DELIVERED'} />
        <FilterButton title="Completed" filterValue="COMPLETED" isActive={filter === 'COMPLETED'} />
      </View>

      {/* Deals List */}
      {deals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No deals found</Text>
          <Text style={styles.emptySubtitle}>
            {filter 
              ? `No ${filter.toLowerCase().replace('_', ' ')} deals at the moment`
              : 'Browse opportunities and apply to deals that match your skills'
            }
          </Text>
          <TouchableOpacity style={styles.createButton} onPress={handleBrowseOpportunities}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Browse Opportunities</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DealCard
              deal={item}
              onPress={() => handleDealPress(item.id)}
            />
          )}
          contentContainerStyle={styles.dealsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      {deals.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleBrowseOpportunities}>
          <Ionicons name="search" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  dealsList: {
    padding: 16,
  },
  dealCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dealSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBackground: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  dealAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  dealPaid: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  dealDates: {
    alignItems: 'flex-end',
  },
  dealDate: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  dealCreated: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 4,
  },
  tag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
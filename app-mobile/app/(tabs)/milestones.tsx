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

interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  state: 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'RELEASED' | 'DISPUTED';
  due_at?: string;
  submitted_at?: string;
  approved_at?: string;
  released_at?: string;
  created_at: string;
  deal: {
    id: string;
    project: {
      title: string;
      brand: {
        first_name: string;
        last_name: string;
      };
    };
    creator: {
      first_name: string;
      last_name: string;
    };
  };
}

const MilestoneCard: React.FC<{ milestone: Milestone; onPress: () => void }> = ({ milestone, onPress }) => {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'PENDING': return '#FF9500';
      case 'SUBMITTED': return '#007AFF';
      case 'APPROVED': return '#32D74B';
      case 'RELEASED': return '#34C759';
      case 'DISPUTED': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'PENDING': return 'time-outline';
      case 'SUBMITTED': return 'document-outline';
      case 'APPROVED': return 'checkmark-circle-outline';
      case 'RELEASED': return 'card-outline';
      case 'DISPUTED': return 'warning-outline';
      default: return 'help-circle-outline';
    }
  };

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDueDateInfo = () => {
    if (!milestone.due_at) return null;
    const dueDate = new Date(milestone.due_at);
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Overdue', color: '#FF3B30' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: '#FF9500' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: '#FF9500' };
    } else if (diffDays <= 3) {
      return { text: `Due in ${diffDays} days`, color: '#FF9500' };
    } else {
      return { text: `Due ${formatDate(milestone.due_at)}`, color: '#8E8E93' };
    }
  };

  const dueDateInfo = getDueDateInfo();

  return (
    <TouchableOpacity style={styles.milestoneCard} onPress={onPress}>
      <View style={styles.milestoneHeader}>
        <View style={styles.titleContainer}>
          <Ionicons 
            name={getStateIcon(milestone.state) as any} 
            size={20} 
            color={getStateColor(milestone.state)} 
            style={styles.stateIcon}
          />
          <Text style={styles.milestoneTitle} numberOfLines={1}>
            {milestone.title}
          </Text>
        </View>
        <Text style={styles.milestoneAmount}>
          {formatAmount(milestone.amount, milestone.currency)}
        </Text>
      </View>
      
      <Text style={styles.projectTitle} numberOfLines={1}>
        {milestone.deal.project.title}
      </Text>
      
      {milestone.description && (
        <Text style={styles.milestoneDescription} numberOfLines={2}>
          {milestone.description}
        </Text>
      )}
      
      <View style={styles.milestoneFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStateColor(milestone.state) }]}>
          <Text style={styles.statusText}>{milestone.state}</Text>
        </View>
        {dueDateInfo && (
          <Text style={[styles.dueDate, { color: dueDateInfo.color }]}>
            {dueDateInfo.text}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function MilestonesScreen() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();

  const loadMilestones = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await apiClient.get('/milestones', { params });
      setMilestones(response.data);
    } catch (error) {
      console.error('Error loading milestones:', error);
      Alert.alert('Error', 'Failed to load milestones');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMilestones();
  };

  const handleMilestonePress = (milestoneId: string) => {
    router.push(`/milestone/${milestoneId}`);
  };

  useEffect(() => {
    loadMilestones();
  }, [filter]);

  const FilterButton: React.FC<{ 
    title: string; 
    filterValue: string | null; 
    isActive: boolean;
    count?: number;
  }> = ({ title, filterValue, isActive, count }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setFilter(isActive ? null : filterValue)}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {title}
        {count !== undefined && ` (${count})`}
      </Text>
    </TouchableOpacity>
  );

  const getMilestoneCounts = () => {
    return {
      pending: milestones.filter(m => m.state === 'PENDING').length,
      submitted: milestones.filter(m => m.state === 'SUBMITTED').length,
      approved: milestones.filter(m => m.state === 'APPROVED').length,
      released: milestones.filter(m => m.state === 'RELEASED').length,
    };
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading milestones...</Text>
      </View>
    );
  }

  const counts = getMilestoneCounts();

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton title="All" filterValue={null} isActive={filter === null} />
        <FilterButton 
          title="Pending" 
          filterValue="PENDING" 
          isActive={filter === 'PENDING'}
          count={counts.pending}
        />
        <FilterButton 
          title="Submitted" 
          filterValue="SUBMITTED" 
          isActive={filter === 'SUBMITTED'}
          count={counts.submitted}
        />
        <FilterButton 
          title="Completed" 
          filterValue="RELEASED" 
          isActive={filter === 'RELEASED'}
          count={counts.released}
        />
      </View>

      {/* Milestones List */}
      {milestones.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No milestones found</Text>
          <Text style={styles.emptySubtitle}>
            {filter 
              ? `No ${filter.toLowerCase()} milestones at the moment`
              : 'Milestones will appear here when deals are created'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={milestones.filter(m => !filter || m.state === filter)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MilestoneCard
              milestone={item}
              onPress={() => handleMilestonePress(item.id)}
            />
          )}
          contentContainerStyle={styles.milestonesList}
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
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  milestonesList: {
    padding: 16,
  },
  milestoneCard: {
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
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  stateIcon: {
    marginRight: 8,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  milestoneAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34C759',
  },
  projectTitle: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
    lineHeight: 20,
  },
  milestoneFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dueDate: {
    fontSize: 12,
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
  },
});
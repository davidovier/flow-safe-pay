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
  project: {
    id: string;
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
  amount_total: number;
  currency: string;
  state: 'DRAFT' | 'FUNDED' | 'RELEASED' | 'DISPUTED' | 'REFUNDED';
  created_at: string;
  funded_at?: string;
  completed_at?: string;
}

const DealCard: React.FC<{ deal: Deal; onPress: () => void }> = ({ deal, onPress }) => {
  const getStateColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return '#FF9500';
      case 'FUNDED': return '#007AFF';
      case 'RELEASED': return '#34C759';
      case 'DISPUTED': return '#FF3B30';
      case 'REFUNDED': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getStateText = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'Pending';
      case 'FUNDED': return 'Active';
      case 'RELEASED': return 'Completed';
      case 'DISPUTED': return 'Disputed';
      case 'REFUNDED': return 'Refunded';
      default: return state;
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.dealCard} onPress={onPress}>
      <View style={styles.dealHeader}>
        <Text style={styles.dealTitle} numberOfLines={1}>
          {deal.project.title}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStateColor(deal.state) }]}>
          <Text style={styles.statusText}>{getStateText(deal.state)}</Text>
        </View>
      </View>
      
      <Text style={styles.dealSubtitle}>
        {deal.project.brand.first_name} {deal.project.brand.last_name}
      </Text>
      
      <View style={styles.dealFooter}>
        <Text style={styles.dealAmount}>
          {formatAmount(deal.amount_total, deal.currency)}
        </Text>
        <Text style={styles.dealDate}>
          {formatDate(deal.created_at)}
        </Text>
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
      const params = filter ? { status: filter } : {};
      const response = await apiClient.get('/deals', { params });
      setDeals(response.data);
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

  const handleCreateDeal = () => {
    if (user?.role === 'BRAND') {
      router.push('/create-deal');
    } else {
      Alert.alert('Info', 'Only brands can create deals');
    }
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
        <FilterButton title="Pending" filterValue="DRAFT" isActive={filter === 'DRAFT'} />
        <FilterButton title="Active" filterValue="FUNDED" isActive={filter === 'FUNDED'} />
        <FilterButton title="Completed" filterValue="RELEASED" isActive={filter === 'RELEASED'} />
      </View>

      {/* Deals List */}
      {deals.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No deals found</Text>
          <Text style={styles.emptySubtitle}>
            {filter 
              ? `No ${filter.toLowerCase()} deals at the moment`
              : 'Start by creating or accepting your first deal'
            }
          </Text>
          {user?.role === 'BRAND' && (
            <TouchableOpacity style={styles.createButton} onPress={handleCreateDeal}>
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createButtonText}>Create Deal</Text>
            </TouchableOpacity>
          )}
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

      {/* Floating Action Button for Brands */}
      {user?.role === 'BRAND' && deals.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleCreateDeal}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
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
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#34C759',
  },
  dealDate: {
    fontSize: 12,
    color: '#8E8E93',
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
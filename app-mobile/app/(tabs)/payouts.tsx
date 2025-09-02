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

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED';
  provider: 'STRIPE' | 'MANGOPAY' | 'CRYPTO';
  processed_at?: string;
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
  };
  milestone?: {
    id: string;
    title: string;
  };
}

const PayoutCard: React.FC<{ payout: Payout; onPress: () => void }> = ({ payout, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FF9500';
      case 'PROCESSING': return '#007AFF';
      case 'COMPLETED': return '#34C759';
      case 'FAILED': return '#FF3B30';
      case 'CANCELED': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return 'time-outline';
      case 'PROCESSING': return 'refresh-outline';
      case 'COMPLETED': return 'checkmark-circle-outline';
      case 'FAILED': return 'close-circle-outline';
      case 'CANCELED': return 'ban-outline';
      default: return 'help-circle-outline';
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'STRIPE': return 'card-outline';
      case 'MANGOPAY': return 'wallet-outline';
      case 'CRYPTO': return 'logo-bitcoin';
      default: return 'card-outline';
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity style={styles.payoutCard} onPress={onPress}>
      <View style={styles.payoutHeader}>
        <View style={styles.amountContainer}>
          <Text style={styles.payoutAmount}>
            {formatAmount(payout.amount, payout.currency)}
          </Text>
          <View style={styles.providerContainer}>
            <Ionicons 
              name={getProviderIcon(payout.provider) as any} 
              size={14} 
              color="#8E8E93" 
            />
            <Text style={styles.providerText}>{payout.provider}</Text>
          </View>
        </View>
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor(payout.status) + '20' }]}>
          <Ionicons 
            name={getStatusIcon(payout.status) as any} 
            size={16} 
            color={getStatusColor(payout.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(payout.status) }]}>
            {payout.status}
          </Text>
        </View>
      </View>
      
      <Text style={styles.projectTitle} numberOfLines={1}>
        {payout.deal.project.title}
      </Text>
      
      <Text style={styles.brandName}>
        by {payout.deal.project.brand.first_name} {payout.deal.project.brand.last_name}
      </Text>
      
      {payout.milestone && (
        <Text style={styles.milestoneTitle} numberOfLines={1}>
          📋 {payout.milestone.title}
        </Text>
      )}
      
      <View style={styles.payoutFooter}>
        <Text style={styles.payoutDate}>
          {payout.processed_at ? `Processed ${formatDate(payout.processed_at)}` : `Created ${formatDate(payout.created_at)}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const SummaryCard: React.FC<{ title: string; amount: string; icon: string; color: string }> = ({ 
  title, 
  amount, 
  icon, 
  color 
}) => (
  <View style={[styles.summaryCard, { borderLeftColor: color }]}>
    <View style={styles.summaryHeader}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.summaryTitle}>{title}</Text>
    </View>
    <Text style={[styles.summaryAmount, { color }]}>{amount}</Text>
  </View>
);

export default function PayoutsScreen() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  
  const { user } = useAuth();
  const router = useRouter();

  const loadPayouts = async () => {
    try {
      const params = filter ? { status: filter } : {};
      const response = await apiClient.get('/payouts', { params });
      setPayouts(response.data);
    } catch (error) {
      console.error('Error loading payouts:', error);
      Alert.alert('Error', 'Failed to load payouts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadPayouts();
  };

  const handlePayoutPress = (payoutId: string) => {
    router.push(`/payout/${payoutId}`);
  };

  useEffect(() => {
    if (user?.role === 'CREATOR') {
      loadPayouts();
    } else {
      setLoading(false);
    }
  }, [filter, user]);

  const calculateSummary = () => {
    const totalEarnings = payouts
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingAmount = payouts
      .filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum, p) => sum + p.amount, 0);

    const thisMonthEarnings = payouts
      .filter(p => {
        if (p.status !== 'COMPLETED' || !p.processed_at) return false;
        const processedDate = new Date(p.processed_at);
        const now = new Date();
        return processedDate.getMonth() === now.getMonth() && 
               processedDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, p) => sum + p.amount, 0);

    return { totalEarnings, pendingAmount, thisMonthEarnings };
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Default to USD for summary
    }).format(amount / 100);
  };

  if (user?.role !== 'CREATOR') {
    return (
      <View style={styles.centered}>
        <Ionicons name="card-outline" size={64} color="#8E8E93" />
        <Text style={styles.emptyTitle}>Payouts</Text>
        <Text style={styles.emptySubtitle}>
          Payouts are only available for creators.{'\n'}
          Switch to a creator account to view your earnings.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading payouts...</Text>
      </View>
    );
  }

  const { totalEarnings, pendingAmount, thisMonthEarnings } = calculateSummary();

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

  return (
    <View style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <SummaryCard
          title="Total Earned"
          amount={formatAmount(totalEarnings)}
          icon="trophy"
          color="#34C759"
        />
        <SummaryCard
          title="This Month"
          amount={formatAmount(thisMonthEarnings)}
          icon="calendar"
          color="#007AFF"
        />
        <SummaryCard
          title="Pending"
          amount={formatAmount(pendingAmount)}
          icon="time"
          color="#FF9500"
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton title="All" filterValue={null} isActive={filter === null} />
        <FilterButton title="Completed" filterValue="COMPLETED" isActive={filter === 'COMPLETED'} />
        <FilterButton title="Pending" filterValue="PENDING" isActive={filter === 'PENDING'} />
        <FilterButton title="Processing" filterValue="PROCESSING" isActive={filter === 'PROCESSING'} />
      </View>

      {/* Payouts List */}
      {payouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="card-outline" size={64} color="#8E8E93" />
          <Text style={styles.emptyTitle}>No payouts yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete milestones and get deals approved to receive payouts.
          </Text>
        </View>
      ) : (
        <FlatList
          data={payouts.filter(p => !filter || p.status === filter)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PayoutCard
              payout={item}
              onPress={() => handlePayoutPress(item.id)}
            />
          )}
          contentContainerStyle={styles.payoutsList}
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
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '700',
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
  payoutsList: {
    padding: 16,
  },
  payoutCard: {
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
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  amountContainer: {
    flex: 1,
  },
  payoutAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#34C759',
    marginBottom: 4,
  },
  providerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 8,
  },
  payoutFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingTop: 12,
  },
  payoutDate: {
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
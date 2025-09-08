import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/services/api';

interface PricingTier {
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  name: string;
  description: string;
  basePrice: number;
  perCreatorPrice: number;
  maxCreators: number;
  platformFeeRate: number;
  features: string[];
}

interface SubscriptionDetails {
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';
  currentPeriodEnd: string;
  trialEndsAt?: string;
  creatorCount: number;
  monthlyCost: number;
  utilizationPercentage: number;
  recommendedTier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  billingCycle: string;
  platformFeeRate: number;
  isTrialing: boolean;
  agencyId: string;
}

interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  invoiceUrl: string | null;
  periodStart: string;
  periodEnd: string;
}

const PRICING_TIERS: Record<string, PricingTier> = {
  STARTER: {
    tier: 'STARTER',
    name: 'Starter',
    description: 'Perfect for new agencies getting started',
    basePrice: 99,
    perCreatorPrice: 15,
    maxCreators: 5,
    platformFeeRate: 5.0,
    features: [
      'Up to 5 creators',
      'Basic analytics',
      'Email support',
      'Standard platform fee (5%)',
    ],
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL',
    name: 'Professional',
    description: 'Ideal for growing agencies',
    basePrice: 299,
    perCreatorPrice: 12,
    maxCreators: 25,
    platformFeeRate: 3.5,
    features: [
      'Up to 25 creators',
      'Advanced analytics',
      'Priority support',
      'Reduced platform fee (3.5%)',
      'White-label options',
      'Custom reporting',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise',
    description: 'For large agencies and maximum flexibility',
    basePrice: 999,
    perCreatorPrice: 10,
    maxCreators: 100,
    platformFeeRate: 2.5,
    features: [
      'Up to 100 creators',
      'Full analytics suite',
      'Dedicated account manager',
      'Lowest platform fee (2.5%)',
      'Full white-label solution',
      'Custom integrations',
      'API access',
      'Custom contracts',
    ],
  },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TRIALING': return '#FF9500';
      case 'ACTIVE': return '#34C759';
      case 'PAST_DUE': return '#FF3B30';
      case 'CANCELED': return '#8E8E93';
      case 'INCOMPLETE': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  return (
    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.statusBadgeText}>{status.replace('_', ' ')}</Text>
    </View>
  );
};

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <View style={styles.progressBarContainer}>
      <View style={styles.progressBarBackground}>
        <View 
          style={[styles.progressBarFill, { width: `${percentage}%` }]} 
        />
      </View>
    </View>
  );
};

const PlanCard: React.FC<{ 
  tier: PricingTier; 
  isCurrentPlan: boolean; 
  isRecommended: boolean;
  onSelect: () => void;
  loading: boolean;
}> = ({ tier, isCurrentPlan, isRecommended, onSelect, loading }) => (
  <View style={[styles.planCard, isCurrentPlan && styles.currentPlanCard]}>
    <View style={styles.planHeader}>
      <Text style={styles.planName}>{tier.name}</Text>
      {isCurrentPlan && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Current</Text>
        </View>
      )}
      {isRecommended && !isCurrentPlan && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedBadgeText}>Recommended</Text>
        </View>
      )}
    </View>
    
    <Text style={styles.planDescription}>{tier.description}</Text>
    
    <View style={styles.planPricing}>
      <Text style={styles.planPrice}>${tier.basePrice}</Text>
      <Text style={styles.planPricePeriod}>/month</Text>
    </View>
    
    <Text style={styles.planPriceDetails}>
      + ${tier.perCreatorPrice}/creator after {Math.floor(tier.maxCreators / 2)}
    </Text>
    
    <View style={styles.planFeatures}>
      {tier.features.map((feature, index) => (
        <View key={index} style={styles.planFeature}>
          <Ionicons name="checkmark" size={16} color="#34C759" />
          <Text style={styles.planFeatureText}>{feature}</Text>
        </View>
      ))}
    </View>
    
    {!isCurrentPlan && (
      <TouchableOpacity 
        style={[
          styles.planButton, 
          isRecommended && styles.recommendedPlanButton
        ]}
        onPress={onSelect}
        disabled={loading}
      >
        {loading && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />}
        <Text style={styles.planButtonText}>
          {isRecommended ? 'Upgrade' : 'Switch Plan'}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

export default function SubscriptionScreen() {
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      
      // Get agency details first
      const agencyResponse = await apiClient.get('/agencies/me');
      const agency = agencyResponse.data;

      // Load subscription details
      const subscriptionResponse = await apiClient.get(`/subscriptions/agency/${agency.id}`);
      setSubscription(subscriptionResponse.data);

      // Load billing history
      const billingResponse = await apiClient.get(`/subscriptions/agency/${agency.id}/billing-history`);
      setBillingHistory(billingResponse.data.invoices || []);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      Alert.alert('Error', 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: string) => {
    try {
      setUpgrading(true);
      setSelectedTier(tier);

      // Create Stripe checkout session
      const response = await apiClient.post('/subscriptions/checkout-session', {
        tier,
        successUrl: 'flowpay://subscription-success',
        cancelUrl: 'flowpay://subscription-canceled',
      });

      const { url } = response.data;
      
      // Open Stripe checkout in browser
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error creating checkout session:', error);
      Alert.alert('Error', 'Failed to start upgrade process');
    } finally {
      setUpgrading(false);
      setSelectedTier(null);
    }
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription?',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Cancel at Period End', 
          onPress: () => cancelSubscription(false),
          style: 'default'
        },
        { 
          text: 'Cancel Immediately', 
          onPress: () => cancelSubscription(true),
          style: 'destructive'
        },
      ]
    );
  };

  const cancelSubscription = async (immediate: boolean) => {
    try {
      if (!subscription) return;

      await apiClient.post(`/subscriptions/agency/${subscription.agencyId}/cancel`, {
        immediate,
      });

      Alert.alert(
        'Success',
        immediate 
          ? 'Subscription canceled immediately' 
          : 'Subscription will be canceled at the end of current period'
      );

      loadSubscriptionData();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      Alert.alert('Error', 'Failed to cancel subscription');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading subscription...</Text>
      </View>
    );
  }

  if (!subscription) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <Text style={styles.headerSubtitle}>
            Select a subscription plan to manage your creators and unlock advanced features.
          </Text>
        </View>
        
        <View style={styles.plansContainer}>
          {Object.values(PRICING_TIERS).map((tier) => (
            <PlanCard
              key={tier.tier}
              tier={tier}
              isCurrentPlan={false}
              isRecommended={tier.tier === 'PROFESSIONAL'}
              onSelect={() => handleUpgrade(tier.tier)}
              loading={upgrading && selectedTier === tier.tier}
            />
          ))}
        </View>
      </ScrollView>
    );
  }

  const currentTier = PRICING_TIERS[subscription.tier];

  return (
    <ScrollView style={styles.container}>
      {/* Current Subscription Overview */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Current Subscription</Text>
          <StatusBadge status={subscription.status} />
        </View>
        
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionInfo}>
            <Text style={styles.subscriptionPlan}>{currentTier.name} Plan</Text>
            <Text style={styles.subscriptionDescription}>{currentTier.description}</Text>
            
            <View style={styles.subscriptionDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Monthly Cost:</Text>
                <Text style={styles.detailValue}>${subscription.monthlyCost}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Platform Fee:</Text>
                <Text style={styles.detailValue}>{subscription.platformFeeRate}%</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Billing Cycle:</Text>
                <Text style={styles.detailValue}>{subscription.billingCycle}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Creator Usage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Creator Usage</Text>
        
        <View style={styles.usageCard}>
          <View style={styles.usageHeader}>
            <Ionicons name="people" size={20} color="#007AFF" />
            <Text style={styles.usageTitle}>
              {subscription.creatorCount} of {currentTier.maxCreators} creators
            </Text>
            <Text style={styles.usagePercentage}>
              {Math.round(subscription.utilizationPercentage)}%
            </Text>
          </View>
          
          <ProgressBar value={subscription.creatorCount} max={currentTier.maxCreators} />
          
          {subscription.utilizationPercentage > 80 && (
            <View style={styles.warningCard}>
              <Ionicons name="warning" size={16} color="#FF9500" />
              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>Approaching Limit</Text>
                <Text style={styles.warningSubtitle}>
                  Consider upgrading to {PRICING_TIERS[subscription.recommendedTier].name} 
                  for more creators and better rates.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Trial Information */}
      {subscription.isTrialing && subscription.trialEndsAt && (
        <View style={styles.section}>
          <View style={styles.trialCard}>
            <View style={styles.trialHeader}>
              <Ionicons name="time" size={20} color="#007AFF" />
              <Text style={styles.trialTitle}>Free Trial Active</Text>
            </View>
            <Text style={styles.trialText}>
              Your free trial ends on {formatDate(subscription.trialEndsAt)}. 
              Your subscription will automatically start after the trial period.
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.section}>
        <View style={styles.actionButtons}>
          {subscription.tier !== 'ENTERPRISE' && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => handleUpgrade(subscription.recommendedTier)}
              disabled={upgrading}
            >
              {upgrading && <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />}
              <Ionicons name="trending-up" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancelSubscription}
            disabled={subscription.status === 'CANCELED'}
          >
            <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Available Plans */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Plans</Text>
        <View style={styles.plansContainer}>
          {Object.values(PRICING_TIERS).map((tier) => (
            <PlanCard
              key={tier.tier}
              tier={tier}
              isCurrentPlan={tier.tier === subscription.tier}
              isRecommended={tier.tier === subscription.recommendedTier}
              onSelect={() => handleUpgrade(tier.tier)}
              loading={upgrading && selectedTier === tier.tier}
            />
          ))}
        </View>
      </View>

      {/* Billing History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Billing History</Text>
        
        {billingHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No billing history available.</Text>
          </View>
        ) : (
          <View style={styles.billingList}>
            {billingHistory.map((invoice) => (
              <View key={invoice.id} style={styles.billingItem}>
                <View style={styles.billingInfo}>
                  <Text style={styles.billingAmount}>
                    {formatCurrency(invoice.amount)}
                  </Text>
                  <Text style={styles.billingPeriod}>
                    {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                  </Text>
                </View>
                
                <View style={styles.billingActions}>
                  <StatusBadge status={invoice.status} />
                  {invoice.invoiceUrl && (
                    <TouchableOpacity 
                      style={styles.downloadButton}
                      onPress={() => Linking.openURL(invoice.invoiceUrl!)}
                    >
                      <Ionicons name="download-outline" size={16} color="#007AFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionPlan: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  subscriptionDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  usageCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  usageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  usageTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 8,
  },
  usagePercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    marginLeft: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  warningSubtitle: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 2,
  },
  trialCard: {
    backgroundColor: '#E5F3FF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  trialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  trialText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 8,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  plansContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  currentPlanCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  recommendedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  planDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  planPricePeriod: {
    fontSize: 16,
    color: '#8E8E93',
  },
  planPriceDetails: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 16,
  },
  planFeatures: {
    gap: 8,
    marginBottom: 16,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planFeatureText: {
    fontSize: 14,
    color: '#000000',
    marginLeft: 8,
    flex: 1,
  },
  planButton: {
    backgroundColor: '#E5E5EA',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  recommendedPlanButton: {
    backgroundColor: '#007AFF',
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  billingList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  billingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  billingInfo: {
    flex: 1,
  },
  billingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  billingPeriod: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  billingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadButton: {
    padding: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
  },
});
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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/services/api';

const { width } = Dimensions.get('window');

interface AnalyticsOverview {
  totalSpend: number;
  totalSpendChange: number;
  totalReach: number;
  totalReachChange: number;
  totalEngagements: number;
  totalEngagementsChange: number;
  averageROI: number;
  averageROIChange: number;
  activeCampaigns: number;
  completedCampaigns: number;
}

interface CampaignMetrics {
  id: string;
  name: string;
  spend: number;
  reach: number;
  engagements: number;
  roi: number;
  status: string;
  completionRate: number;
}

interface CreatorMetrics {
  id: string;
  name: string;
  username: string;
  totalEarnings: number;
  averageEngagementRate: number;
  completedDeals: number;
  averageRating: number;
}

interface ContentMetrics {
  totalPosts: number;
  avgEngagementRate: number;
  topPerformingPlatform: string;
  contentTypes: {
    type: string;
    count: number;
    avgEngagement: number;
  }[];
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  campaignPerformance: CampaignMetrics[];
  creatorPerformance: CreatorMetrics[];
  contentMetrics: ContentMetrics;
}

const MetricCard: React.FC<{
  title: string;
  value: string;
  change: number;
  icon: string;
  color?: string;
}> = ({ title, value, change, icon, color = '#007AFF' }) => {
  const isPositive = change >= 0;

  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricTitle}>{title}</Text>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <View style={styles.changeContainer}>
        <Ionicons 
          name={isPositive ? 'trending-up' : 'trending-down'} 
          size={14} 
          color={isPositive ? '#34C759' : '#FF3B30'} 
        />
        <Text style={[
          styles.changeText, 
          { color: isPositive ? '#34C759' : '#FF3B30' }
        ]}>
          {Math.abs(change)}% from last period
        </Text>
      </View>
    </View>
  );
};

const ChartBar: React.FC<{ 
  value: number; 
  maxValue: number; 
  label: string; 
  color?: string;
}> = ({ value, maxValue, label, color = '#007AFF' }) => {
  const percentage = (value / maxValue) * 100;

  return (
    <View style={styles.chartBarContainer}>
      <View style={styles.chartBarWrapper}>
        <View 
          style={[
            styles.chartBar, 
            { 
              height: `${Math.max(percentage, 5)}%`, 
              backgroundColor: color 
            }
          ]} 
        />
      </View>
      <Text style={styles.chartBarLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.chartBarValue}>{value.toFixed(1)}%</Text>
    </View>
  );
};

export default function AnalyticsScreen() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const router = useRouter();

  const periods = [
    { key: '7d', label: '7 days' },
    { key: '30d', label: '30 days' },
    { key: '90d', label: '3 months' },
    { key: '365d', label: '1 year' },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'campaigns', label: 'Campaigns' },
    { key: 'creators', label: 'Creators' },
    { key: 'content', label: 'Content' },
  ];

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      // Mock data - replace with actual API call
      const mockData: AnalyticsData = {
        overview: {
          totalSpend: 45280,
          totalSpendChange: 12.5,
          totalReach: 2840000,
          totalReachChange: 18.3,
          totalEngagements: 156000,
          totalEngagementsChange: 24.7,
          averageROI: 320,
          averageROIChange: 8.2,
          activeCampaigns: 8,
          completedCampaigns: 12,
        },
        campaignPerformance: [
          {
            id: '1',
            name: 'Summer Fashion Collection',
            spend: 15000,
            reach: 850000,
            engagements: 45000,
            roi: 280,
            status: 'active',
            completionRate: 75,
          },
          {
            id: '2',
            name: 'Tech Product Launch',
            spend: 25000,
            reach: 1200000,
            engagements: 78000,
            roi: 420,
            status: 'active',
            completionRate: 60,
          },
          {
            id: '3',
            name: 'Spring Wellness Series',
            spend: 12000,
            reach: 650000,
            engagements: 38000,
            roi: 190,
            status: 'completed',
            completionRate: 100,
          },
        ],
        creatorPerformance: [
          {
            id: '1',
            name: 'Sarah Johnson',
            username: '@sarahjohnson',
            totalEarnings: 8500,
            averageEngagementRate: 4.2,
            completedDeals: 15,
            averageRating: 4.9,
          },
          {
            id: '2',
            name: 'Mike Chen',
            username: '@miketechtalk',
            totalEarnings: 12000,
            averageEngagementRate: 5.1,
            completedDeals: 12,
            averageRating: 4.8,
          },
          {
            id: '3',
            name: 'Emma Wilson',
            username: '@emmawellness',
            totalEarnings: 6800,
            averageEngagementRate: 6.8,
            completedDeals: 18,
            averageRating: 4.7,
          },
        ],
        contentMetrics: {
          totalPosts: 156,
          avgEngagementRate: 5.2,
          topPerformingPlatform: 'TikTok',
          contentTypes: [
            { type: 'Instagram Post', count: 45, avgEngagement: 3.8 },
            { type: 'Instagram Reel', count: 38, avgEngagement: 6.2 },
            { type: 'TikTok Video', count: 32, avgEngagement: 7.1 },
            { type: 'YouTube Video', count: 25, avgEngagement: 4.5 },
            { type: 'Instagram Story', count: 16, avgEngagement: 2.9 },
          ],
        },
      };

      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalyticsData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (!analyticsData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>No analytics data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Period Filter */}
      <View style={styles.periodContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.activePeriodButton
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.activePeriodButtonText
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                activeTab === tab.key && styles.activeTabButton
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[
                styles.tabButtonText,
                activeTab === tab.key && styles.activeTabButtonText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' && (
          <View style={styles.overviewContent}>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              <MetricCard
                title="Total Spend"
                value={formatCurrency(analyticsData.overview.totalSpend)}
                change={analyticsData.overview.totalSpendChange}
                icon="card"
                color="#FF9500"
              />
              <MetricCard
                title="Total Reach"
                value={formatNumber(analyticsData.overview.totalReach)}
                change={analyticsData.overview.totalReachChange}
                icon="eye"
                color="#007AFF"
              />
              <MetricCard
                title="Engagements"
                value={formatNumber(analyticsData.overview.totalEngagements)}
                change={analyticsData.overview.totalEngagementsChange}
                icon="heart"
                color="#FF3B30"
              />
              <MetricCard
                title="Average ROI"
                value={`${analyticsData.overview.averageROI}%`}
                change={analyticsData.overview.averageROIChange}
                icon="trending-up"
                color="#34C759"
              />
            </View>

            {/* Campaign Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Campaign Summary</Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{analyticsData.overview.activeCampaigns}</Text>
                  <Text style={styles.summaryLabel}>Active</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{analyticsData.overview.completedCampaigns}</Text>
                  <Text style={styles.summaryLabel}>Completed</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {Math.round((analyticsData.overview.completedCampaigns / 
                    (analyticsData.overview.activeCampaigns + analyticsData.overview.completedCampaigns)) * 100)}%
                  </Text>
                  <Text style={styles.summaryLabel}>Success Rate</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'campaigns' && (
          <View style={styles.campaignsContent}>
            <Text style={styles.sectionTitle}>Campaign Performance</Text>
            {analyticsData.campaignPerformance.map((campaign) => (
              <View key={campaign.id} style={styles.campaignCard}>
                <View style={styles.campaignHeader}>
                  <Text style={styles.campaignName}>{campaign.name}</Text>
                  <View style={[
                    styles.campaignStatus,
                    { backgroundColor: campaign.status === 'active' ? '#34C759' : '#8E8E93' }
                  ]}>
                    <Text style={styles.campaignStatusText}>{campaign.status}</Text>
                  </View>
                </View>
                
                <View style={styles.campaignMetrics}>
                  <View style={styles.campaignMetric}>
                    <Text style={styles.metricLabel}>Spend</Text>
                    <Text style={styles.metricValue}>{formatCurrency(campaign.spend)}</Text>
                  </View>
                  <View style={styles.campaignMetric}>
                    <Text style={styles.metricLabel}>Reach</Text>
                    <Text style={styles.metricValue}>{formatNumber(campaign.reach)}</Text>
                  </View>
                  <View style={styles.campaignMetric}>
                    <Text style={styles.metricLabel}>Engagements</Text>
                    <Text style={styles.metricValue}>{formatNumber(campaign.engagements)}</Text>
                  </View>
                  <View style={styles.campaignMetric}>
                    <Text style={styles.metricLabel}>ROI</Text>
                    <Text style={[styles.metricValue, { color: '#34C759' }]}>{campaign.roi}%</Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <Text style={styles.progressLabel}>Progress: {campaign.completionRate}%</Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${campaign.completionRate}%` }
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'creators' && (
          <View style={styles.creatorsContent}>
            <Text style={styles.sectionTitle}>Top Performing Creators</Text>
            {analyticsData.creatorPerformance.map((creator, index) => (
              <View key={creator.id} style={styles.creatorCard}>
                <View style={styles.creatorRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                
                <View style={styles.creatorInfo}>
                  <View style={styles.creatorAvatar}>
                    <Text style={styles.avatarText}>
                      {creator.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  </View>
                  <View style={styles.creatorDetails}>
                    <Text style={styles.creatorName}>{creator.name}</Text>
                    <Text style={styles.creatorUsername}>{creator.username}</Text>
                  </View>
                </View>

                <View style={styles.creatorStats}>
                  <View style={styles.creatorStat}>
                    <Text style={styles.statValue}>{formatCurrency(creator.totalEarnings)}</Text>
                    <Text style={styles.statLabel}>Earnings</Text>
                  </View>
                  <View style={styles.creatorStat}>
                    <Text style={styles.statValue}>{creator.averageEngagementRate}%</Text>
                    <Text style={styles.statLabel}>Avg. Engagement</Text>
                  </View>
                  <View style={styles.creatorStat}>
                    <Text style={styles.statValue}>{creator.completedDeals}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.creatorStat}>
                    <View style={styles.ratingContainer}>
                      <Text style={styles.statValue}>{creator.averageRating}</Text>
                      <Ionicons name="star" size={14} color="#FFD700" />
                    </View>
                    <Text style={styles.statLabel}>Rating</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'content' && (
          <View style={styles.contentContent}>
            {/* Content Overview */}
            <View style={styles.contentOverview}>
              <View style={styles.overviewMetric}>
                <Text style={styles.overviewValue}>{analyticsData.contentMetrics.totalPosts}</Text>
                <Text style={styles.overviewLabel}>Total Posts</Text>
              </View>
              <View style={styles.overviewMetric}>
                <Text style={styles.overviewValue}>{analyticsData.contentMetrics.avgEngagementRate}%</Text>
                <Text style={styles.overviewLabel}>Avg. Engagement</Text>
              </View>
              <View style={styles.overviewMetric}>
                <Text style={styles.overviewValue}>{analyticsData.contentMetrics.topPerformingPlatform}</Text>
                <Text style={styles.overviewLabel}>Top Platform</Text>
              </View>
            </View>

            {/* Content Performance Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Content Performance by Type</Text>
              <View style={styles.chartContainer}>
                {analyticsData.contentMetrics.contentTypes.map((type, index) => (
                  <ChartBar
                    key={type.type}
                    value={type.avgEngagement}
                    maxValue={Math.max(...analyticsData.contentMetrics.contentTypes.map(t => t.avgEngagement))}
                    label={type.type.replace(' ', '\n')}
                    color={['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#8B5CF6'][index]}
                  />
                ))}
              </View>
            </View>

            {/* Content Type Details */}
            <Text style={styles.sectionTitle}>Content Type Breakdown</Text>
            {analyticsData.contentMetrics.contentTypes.map((type, index) => (
              <View key={type.type} style={styles.contentTypeCard}>
                <View style={styles.contentTypeHeader}>
                  <Text style={styles.contentTypeName}>{type.type}</Text>
                  <Text style={styles.contentTypeEngagement}>{type.avgEngagement}%</Text>
                </View>
                <View style={styles.contentTypeStats}>
                  <Text style={styles.contentTypeCount}>{type.count} posts</Text>
                  <View style={styles.engagementBar}>
                    <View 
                      style={[
                        styles.engagementFill,
                        { 
                          width: `${(type.avgEngagement / 10) * 100}%`,
                          backgroundColor: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#8B5CF6'][index]
                        }
                      ]}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  errorText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  periodContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  activePeriodButton: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabButtonText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  overviewContent: {
    paddingBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 44) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  campaignsContent: {
    paddingBottom: 20,
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
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  campaignName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  campaignStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  campaignStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  campaignMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  campaignMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  creatorsContent: {
    paddingBottom: 20,
  },
  creatorCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  creatorRank: {
    marginRight: 16,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8E8E93',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  creatorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  creatorDetails: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  creatorUsername: {
    fontSize: 14,
    color: '#8E8E93',
  },
  creatorStats: {
    flexDirection: 'row',
    gap: 16,
  },
  creatorStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#8E8E93',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  contentContent: {
    paddingBottom: 20,
  },
  contentOverview: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  overviewMetric: {
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
  },
  chartBarWrapper: {
    height: 80,
    width: '80%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderRadius: 4,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  chartBarValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    marginTop: 2,
    textAlign: 'center',
  },
  contentTypeCard: {
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
  contentTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentTypeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  contentTypeEngagement: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  contentTypeStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentTypeCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  engagementBar: {
    width: 100,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  engagementFill: {
    height: '100%',
    borderRadius: 2,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../src/services/api';

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  bio: string;
  location: string;
  rating: number;
  reviewCount: number;
  completedDeals: number;
  responseRate: number;
  niche: string[];
  rateRange: {
    min: number;
    max: number;
  };
  followers: {
    instagram?: number;
    youtube?: number;
    tiktok?: number;
  };
  isAvailable: boolean;
  tags: string[];
}

const CreatorCard: React.FC<{ creator: Creator; onPress: () => void; onInvite: () => void }> = ({ 
  creator, 
  onPress, 
  onInvite 
}) => {
  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <TouchableOpacity style={styles.creatorCard} onPress={onPress}>
      <View style={styles.creatorHeader}>
        <View style={styles.creatorAvatar}>
          <Text style={styles.avatarText}>
            {creator.firstName[0]}{creator.lastName[0]}
          </Text>
          {creator.isAvailable && (
            <View style={styles.availableDot} />
          )}
        </View>
        
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorName}>
            {creator.firstName} {creator.lastName}
          </Text>
          <Text style={styles.creatorUsername}>{creator.username}</Text>
          <Text style={styles.creatorLocation}>{creator.location}</Text>
        </View>

        <TouchableOpacity style={styles.heartButton}>
          <Ionicons name="heart-outline" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <Text style={styles.creatorBio} numberOfLines={2}>
        {creator.bio}
      </Text>

      {/* Niches */}
      <View style={styles.nicheContainer}>
        {creator.niche.slice(0, 3).map((niche) => (
          <View key={niche} style={styles.nicheBadge}>
            <Text style={styles.nicheText}>{niche}</Text>
          </View>
        ))}
        {creator.niche.length > 3 && (
          <Text style={styles.moreNiches}>+{creator.niche.length - 3}</Text>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="star" size={14} color="#FFD700" />
          <Text style={styles.statText}>{creator.rating} ({creator.reviewCount})</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={14} color="#34C759" />
          <Text style={styles.statText}>{creator.completedDeals} deals</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time" size={14} color="#8E8E93" />
          <Text style={styles.statText}>{creator.responseRate}% response</Text>
        </View>
      </View>

      {/* Social Stats */}
      <View style={styles.socialStats}>
        {Object.entries(creator.followers).map(([platform, count]) => (
          <View key={platform} style={styles.socialStat}>
            <Ionicons 
              name={platform === 'instagram' ? 'logo-instagram' : 
                   platform === 'youtube' ? 'logo-youtube' : 'logo-tiktok'} 
              size={16} 
              color="#8E8E93" 
            />
            <Text style={styles.socialText}>{formatFollowerCount(count || 0)}</Text>
          </View>
        ))}
      </View>

      {/* Rate Range */}
      <View style={styles.rateContainer}>
        <Text style={styles.rateLabel}>Rate:</Text>
        <Text style={styles.rateText}>
          {formatCurrency(creator.rateRange.min)} - {formatCurrency(creator.rateRange.max)}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.viewButton}>
          <Ionicons name="eye" size={16} color="#007AFF" />
          <Text style={styles.viewButtonText}>View Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.inviteButton, !creator.isAvailable && styles.busyButton]}
          onPress={onInvite}
          disabled={!creator.isAvailable}
        >
          <Ionicons 
            name={creator.isAvailable ? "send" : "time"} 
            size={16} 
            color={creator.isAvailable ? "#FFFFFF" : "#8E8E93"} 
          />
          <Text style={[
            styles.inviteButtonText, 
            !creator.isAvailable && styles.busyButtonText
          ]}>
            {creator.isAvailable ? 'Invite' : 'Busy'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function CreatorsScreen() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  
  const router = useRouter();

  const niches = ['All', 'Fashion', 'Beauty', 'Lifestyle', 'Tech', 'Food', 'Travel', 'Fitness'];

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    filterCreators();
  }, [creators, searchTerm, selectedNiche]);

  const loadCreators = async () => {
    try {
      // Mock data - replace with actual API call
      const mockCreators: Creator[] = [
        {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          username: '@sarahjohnson',
          bio: 'Fashion & lifestyle creator passionate about sustainable fashion and authentic storytelling.',
          location: 'Los Angeles, CA',
          rating: 4.9,
          reviewCount: 47,
          completedDeals: 89,
          responseRate: 98,
          niche: ['Fashion', 'Lifestyle', 'Beauty'],
          rateRange: { min: 500, max: 2000 },
          followers: {
            instagram: 125000,
            youtube: 45000,
            tiktok: 89000,
          },
          isAvailable: true,
          tags: ['Authentic', 'Professional', 'Creative'],
        },
        {
          id: '2',
          firstName: 'Mike',
          lastName: 'Chen',
          username: '@miketechtalk',
          bio: 'Tech reviewer and gadget enthusiast helping people make informed technology decisions.',
          location: 'San Francisco, CA',
          rating: 4.8,
          reviewCount: 32,
          completedDeals: 56,
          responseRate: 95,
          niche: ['Tech', 'Gaming'],
          rateRange: { min: 1000, max: 3500 },
          followers: {
            youtube: 180000,
            instagram: 67000,
          },
          isAvailable: false,
          tags: ['Technical', 'Detailed', 'Experienced'],
        },
        {
          id: '3',
          firstName: 'Emma',
          lastName: 'Wilson',
          username: '@emmawellness',
          bio: 'Wellness coach focusing on mental health, fitness, and balanced living.',
          location: 'Austin, TX',
          rating: 4.7,
          reviewCount: 28,
          completedDeals: 41,
          responseRate: 92,
          niche: ['Fitness', 'Wellness', 'Lifestyle'],
          rateRange: { min: 300, max: 1200 },
          followers: {
            instagram: 89000,
            tiktok: 156000,
            youtube: 23000,
          },
          isAvailable: true,
          tags: ['Inspiring', 'Educational', 'Community-focused'],
        },
      ];

      setCreators(mockCreators);
    } catch (error) {
      console.error('Error loading creators:', error);
      Alert.alert('Error', 'Failed to load creators');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterCreators = () => {
    let filtered = [...creators];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(creator =>
        creator.firstName.toLowerCase().includes(searchLower) ||
        creator.lastName.toLowerCase().includes(searchLower) ||
        creator.username.toLowerCase().includes(searchLower) ||
        creator.bio.toLowerCase().includes(searchLower) ||
        creator.niche.some(n => n.toLowerCase().includes(searchLower))
      );
    }

    if (selectedNiche !== 'all') {
      filtered = filtered.filter(creator =>
        creator.niche.some(n => n.toLowerCase() === selectedNiche.toLowerCase())
      );
    }

    // Sort by availability first, then by rating
    filtered.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return b.rating - a.rating;
    });

    setFilteredCreators(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCreators();
  };

  const handleInviteCreator = (creator: Creator) => {
    setSelectedCreator(creator);
    setInviteModalVisible(true);
  };

  const sendInvitation = () => {
    if (selectedCreator) {
      Alert.alert(
        'Invitation Sent',
        `Invitation sent to ${selectedCreator.firstName} ${selectedCreator.lastName}`,
        [{ text: 'OK' }]
      );
      setInviteModalVisible(false);
      setSelectedCreator(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Finding creators...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#8E8E93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search creators..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      {/* Niche Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {niches.map((niche) => (
            <TouchableOpacity
              key={niche}
              style={[
                styles.nicheFilter,
                selectedNiche === niche.toLowerCase() && styles.activeNicheFilter
              ]}
              onPress={() => setSelectedNiche(niche === 'All' ? 'all' : niche.toLowerCase())}
            >
              <Text style={[
                styles.nicheFilterText,
                selectedNiche === niche.toLowerCase() && styles.activeNicheFilterText
              ]}>
                {niche}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          Found {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Creators List */}
      <ScrollView 
        style={styles.creatorsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredCreators.map((creator) => (
          <CreatorCard
            key={creator.id}
            creator={creator}
            onPress={() => {
              // Navigate to creator profile
              console.log('View creator profile:', creator.id);
            }}
            onInvite={() => handleInviteCreator(creator)}
          />
        ))}

        {filteredCreators.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#8E8E93" />
            <Text style={styles.emptyStateTitle}>No creators found</Text>
            <Text style={styles.emptyStateDescription}>
              Try adjusting your search or filters to find more creators
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Invite Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={inviteModalVisible}
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Creator</Text>
              <TouchableOpacity 
                onPress={() => setInviteModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            
            {selectedCreator && (
              <View style={styles.modalBody}>
                <Text style={styles.inviteText}>
                  Send an invitation to {selectedCreator.firstName} {selectedCreator.lastName}
                </Text>
                
                <View style={styles.campaignSelection}>
                  <Text style={styles.selectionLabel}>Select Campaign:</Text>
                  <TouchableOpacity style={styles.selectionButton}>
                    <Text style={styles.selectionButtonText}>Summer Fashion Collection</Text>
                    <Ionicons name="chevron-down" size={16} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                <View style={styles.messageSection}>
                  <Text style={styles.selectionLabel}>Personal Message:</Text>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="Add a personal message to your invitation..."
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setInviteModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.sendButton}
                    onPress={sendInvitation}
                  >
                    <Text style={styles.sendButtonText}>Send Invitation</Text>
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000000',
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  nicheFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  activeNicheFilter: {
    backgroundColor: '#007AFF',
  },
  nicheFilterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeNicheFilterText: {
    color: '#FFFFFF',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  resultsText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  creatorsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  creatorCard: {
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
  creatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  creatorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  availableDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  creatorInfo: {
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
    marginBottom: 2,
  },
  creatorLocation: {
    fontSize: 12,
    color: '#8E8E93',
  },
  heartButton: {
    padding: 4,
  },
  creatorBio: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 12,
  },
  nicheContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  nicheBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  nicheText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  moreNiches: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  socialStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  socialStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  rateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rateLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  rateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  inviteButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    gap: 4,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  busyButton: {
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  busyButtonText: {
    color: '#8E8E93',
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
  inviteText: {
    fontSize: 16,
    color: '#000000',
    marginBottom: 20,
  },
  campaignSelection: {
    marginBottom: 20,
  },
  selectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  selectionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  selectionButtonText: {
    fontSize: 16,
    color: '#000000',
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
    minHeight: 80,
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
  sendButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
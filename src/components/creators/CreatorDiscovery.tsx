import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { 
  Search, 
  Filter,
  Star,
  MapPin,
  Users,
  TrendingUp,
  MessageSquare,
  Heart,
  Send,
  Eye,
  Instagram,
  Youtube,
  Twitter,
  ExternalLink,
  DollarSign,
  Calendar,
  Award
} from 'lucide-react';

interface Creator {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  avatar?: string;
  bio: string;
  location: string;
  rating: number;
  reviewCount: number;
  completedDeals: number;
  responseRate: number;
  avgDeliveryTime: number;
  niche: string[];
  contentTypes: string[];
  rateRange: {
    min: number;
    max: number;
  };
  followers: {
    instagram?: number;
    youtube?: number;
    tiktok?: number;
    twitter?: number;
  };
  engagementRate: number;
  lastActive: string;
  isAvailable: boolean;
  portfolioItems: {
    id: string;
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
    title: string;
    platform: string;
  }[];
  tags: string[];
}

interface CreatorFilters {
  search: string;
  niche: string[];
  location: string;
  minRating: number;
  maxRate: number;
  minFollowers: number;
  contentTypes: string[];
  availability: 'all' | 'available' | 'busy';
  sortBy: 'rating' | 'followers' | 'rate' | 'recent';
}

export function CreatorDiscovery() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);
  const [savedCreators, setSavedCreators] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [filters, setFilters] = useState<CreatorFilters>({
    search: '',
    niche: [],
    location: '',
    minRating: 0,
    maxRate: 10000,
    minFollowers: 0,
    contentTypes: [],
    availability: 'all',
    sortBy: 'rating',
  });

  const { toast } = useToast();

  const niches = [
    'Fashion', 'Beauty', 'Lifestyle', 'Fitness', 'Food', 'Travel', 'Tech', 'Gaming', 
    'Home & Decor', 'Parenting', 'Business', 'Art & Design', 'Music', 'Sports'
  ];

  const contentTypes = [
    'Instagram Post', 'Instagram Story', 'Instagram Reel', 'YouTube Video', 
    'TikTok Video', 'Blog Post', 'Twitter Thread', 'Podcast Appearance'
  ];

  useEffect(() => {
    loadCreators();
    loadSavedCreators();
  }, []);

  useEffect(() => {
    filterAndSortCreators();
  }, [creators, filters]);

  const loadCreators = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API call
      const mockCreators: Creator[] = [
        {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          username: '@sarahjohnson',
          email: 'sarah@example.com',
          bio: 'Fashion & lifestyle creator passionate about sustainable fashion and authentic storytelling. 5 years of brand collaboration experience.',
          location: 'Los Angeles, CA',
          rating: 4.9,
          reviewCount: 47,
          completedDeals: 89,
          responseRate: 98,
          avgDeliveryTime: 2.1,
          niche: ['Fashion', 'Lifestyle', 'Beauty'],
          contentTypes: ['Instagram Post', 'Instagram Story', 'Instagram Reel'],
          rateRange: { min: 500, max: 2000 },
          followers: {
            instagram: 125000,
            youtube: 45000,
            tiktok: 89000,
          },
          engagementRate: 4.2,
          lastActive: '2024-01-15T10:30:00Z',
          isAvailable: true,
          portfolioItems: [
            {
              id: '1',
              type: 'image',
              url: '/portfolio/sarah1.jpg',
              title: 'Summer Fashion Lookbook',
              platform: 'Instagram',
            },
            {
              id: '2',
              type: 'video',
              url: '/portfolio/sarah2.mp4',
              thumbnail: '/portfolio/sarah2-thumb.jpg',
              title: 'Sustainable Fashion Haul',
              platform: 'YouTube',
            },
          ],
          tags: ['Authentic', 'Professional', 'Creative', 'Reliable'],
        },
        {
          id: '2',
          firstName: 'Mike',
          lastName: 'Chen',
          username: '@miketechtalk',
          email: 'mike@example.com',
          bio: 'Tech reviewer and gadget enthusiast. I help people make informed decisions about technology through honest reviews and tutorials.',
          location: 'San Francisco, CA',
          rating: 4.8,
          reviewCount: 32,
          completedDeals: 56,
          responseRate: 95,
          avgDeliveryTime: 1.8,
          niche: ['Tech', 'Gaming'],
          contentTypes: ['YouTube Video', 'Instagram Reel', 'Blog Post'],
          rateRange: { min: 1000, max: 3500 },
          followers: {
            youtube: 180000,
            instagram: 67000,
            twitter: 34000,
          },
          engagementRate: 5.1,
          lastActive: '2024-01-15T09:15:00Z',
          isAvailable: false,
          portfolioItems: [
            {
              id: '1',
              type: 'video',
              url: '/portfolio/mike1.mp4',
              thumbnail: '/portfolio/mike1-thumb.jpg',
              title: 'iPhone 15 Pro Review',
              platform: 'YouTube',
            },
          ],
          tags: ['Technical', 'Detail-oriented', 'Experienced'],
        },
        {
          id: '3',
          firstName: 'Emma',
          lastName: 'Wilson',
          username: '@emmawellness',
          email: 'emma@example.com',
          bio: 'Wellness coach and content creator focusing on mental health, fitness, and balanced living. Certified nutritionist and yoga instructor.',
          location: 'Austin, TX',
          rating: 4.7,
          reviewCount: 28,
          completedDeals: 41,
          responseRate: 92,
          avgDeliveryTime: 2.5,
          niche: ['Fitness', 'Wellness', 'Lifestyle'],
          contentTypes: ['Instagram Post', 'Instagram Story', 'TikTok Video', 'Blog Post'],
          rateRange: { min: 300, max: 1200 },
          followers: {
            instagram: 89000,
            tiktok: 156000,
            youtube: 23000,
          },
          engagementRate: 6.8,
          lastActive: '2024-01-15T11:45:00Z',
          isAvailable: true,
          portfolioItems: [],
          tags: ['Inspiring', 'Educational', 'Community-focused'],
        },
        {
          id: '4',
          firstName: 'Alex',
          lastName: 'Rivera',
          username: '@alexfoodie',
          email: 'alex@example.com',
          bio: 'Food content creator and recipe developer. I share delicious recipes and restaurant reviews with a focus on diverse cuisines.',
          location: 'New York, NY',
          rating: 4.6,
          reviewCount: 19,
          completedDeals: 23,
          responseRate: 88,
          avgDeliveryTime: 3.2,
          niche: ['Food', 'Travel'],
          contentTypes: ['Instagram Post', 'Instagram Reel', 'TikTok Video'],
          rateRange: { min: 400, max: 1500 },
          followers: {
            instagram: 76000,
            tiktok: 124000,
          },
          engagementRate: 7.2,
          lastActive: '2024-01-14T16:20:00Z',
          isAvailable: true,
          portfolioItems: [],
          tags: ['Creative', 'Foodie', 'Trendy'],
        },
      ];

      setCreators(mockCreators);
    } catch (error) {
      console.error('Error loading creators:', error);
      toast({
        title: 'Error',
        description: 'Failed to load creators',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCreators = async () => {
    // Mock saved creators - replace with actual API call
    setSavedCreators(['1', '3']);
  };

  const filterAndSortCreators = () => {
    let filtered = [...creators];

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(creator =>
        creator.firstName.toLowerCase().includes(searchLower) ||
        creator.lastName.toLowerCase().includes(searchLower) ||
        creator.username.toLowerCase().includes(searchLower) ||
        creator.bio.toLowerCase().includes(searchLower) ||
        creator.niche.some(n => n.toLowerCase().includes(searchLower))
      );
    }

    if (filters.niche.length > 0) {
      filtered = filtered.filter(creator =>
        creator.niche.some(n => filters.niche.includes(n))
      );
    }

    if (filters.location) {
      filtered = filtered.filter(creator =>
        creator.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.minRating > 0) {
      filtered = filtered.filter(creator => creator.rating >= filters.minRating);
    }

    if (filters.maxRate < 10000) {
      filtered = filtered.filter(creator => creator.rateRange.min <= filters.maxRate);
    }

    if (filters.minFollowers > 0) {
      filtered = filtered.filter(creator => {
        const maxFollowers = Math.max(
          creator.followers.instagram || 0,
          creator.followers.youtube || 0,
          creator.followers.tiktok || 0,
          creator.followers.twitter || 0
        );
        return maxFollowers >= filters.minFollowers;
      });
    }

    if (filters.contentTypes.length > 0) {
      filtered = filtered.filter(creator =>
        creator.contentTypes.some(ct => filters.contentTypes.includes(ct))
      );
    }

    if (filters.availability !== 'all') {
      filtered = filtered.filter(creator =>
        filters.availability === 'available' ? creator.isAvailable : !creator.isAvailable
      );
    }

    // Sort creators
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'followers':
          const aMaxFollowers = Math.max(...Object.values(a.followers).filter(Boolean));
          const bMaxFollowers = Math.max(...Object.values(b.followers).filter(Boolean));
          return bMaxFollowers - aMaxFollowers;
        case 'rate':
          return a.rateRange.min - b.rateRange.min;
        case 'recent':
          return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
        default:
          return 0;
      }
    });

    setFilteredCreators(filtered);
  };

  const handleSaveCreator = async (creatorId: string) => {
    try {
      const isSaved = savedCreators.includes(creatorId);
      if (isSaved) {
        setSavedCreators(savedCreators.filter(id => id !== creatorId));
        toast({
          title: 'Removed from saved',
          description: 'Creator removed from your saved list',
        });
      } else {
        setSavedCreators([...savedCreators, creatorId]);
        toast({
          title: 'Saved successfully',
          description: 'Creator added to your saved list',
        });
      }
    } catch (error) {
      console.error('Error saving creator:', error);
      toast({
        title: 'Error',
        description: 'Failed to save creator',
        variant: 'destructive',
      });
    }
  };

  const handleInviteCreator = async (creator: Creator) => {
    try {
      // Mock API call - replace with actual implementation
      toast({
        title: 'Invitation sent',
        description: `Invitation sent to ${creator.firstName} ${creator.lastName}`,
      });
      setInviteDialogOpen(false);
      setSelectedCreator(null);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to send invitation',
        variant: 'destructive',
      });
    }
  };

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

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      default: return <ExternalLink className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creator Discovery</h1>
        <p className="text-muted-foreground">
          Find and connect with talented creators for your campaigns.
        </p>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className="w-80 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search creators..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Niche */}
              <div>
                <Label>Niche</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {niches.map((niche) => (
                    <div key={niche} className="flex items-center space-x-2">
                      <Checkbox
                        id={niche}
                        checked={filters.niche.includes(niche)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters({ ...filters, niche: [...filters.niche, niche] });
                          } else {
                            setFilters({ ...filters, niche: filters.niche.filter(n => n !== niche) });
                          }
                        }}
                      />
                      <Label htmlFor={niche} className="text-sm">{niche}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="City, State"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                />
              </div>

              {/* Rating */}
              <div>
                <Label>Minimum Rating</Label>
                <div className="mt-2">
                  <Slider
                    value={[filters.minRating]}
                    onValueChange={([value]) => setFilters({ ...filters, minRating: value })}
                    max={5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>0</span>
                    <span className="font-medium">{filters.minRating}+</span>
                    <span>5</span>
                  </div>
                </div>
              </div>

              {/* Max Rate */}
              <div>
                <Label>Maximum Rate</Label>
                <div className="mt-2">
                  <Slider
                    value={[filters.maxRate]}
                    onValueChange={([value]) => setFilters({ ...filters, maxRate: value })}
                    max={10000}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>$0</span>
                    <span className="font-medium">${filters.maxRate}+</span>
                    <span>$10K+</span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <Label>Availability</Label>
                <Select value={filters.availability} onValueChange={(value: any) => setFilters({ ...filters, availability: value })}>
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Creators</SelectItem>
                    <SelectItem value="available">Available Now</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Sort and Results Count */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Found {filteredCreators.length} creator{filteredCreators.length !== 1 ? 's' : ''}
            </div>
            <Select value={filters.sortBy} onValueChange={(value: any) => setFilters({ ...filters, sortBy: value })}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="followers">Most Followers</SelectItem>
                <SelectItem value="rate">Lowest Rate</SelectItem>
                <SelectItem value="recent">Recently Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Creators Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {filteredCreators.map((creator) => (
              <Card key={creator.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className="relative">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={creator.avatar} />
                        <AvatarFallback className="text-lg">
                          {creator.firstName[0]}{creator.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {creator.isAvailable && (
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {creator.firstName} {creator.lastName}
                          </h3>
                          <p className="text-muted-foreground">{creator.username}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveCreator(creator.id)}
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              savedCreators.includes(creator.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        </Button>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{creator.rating}</span>
                          <span>({creator.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{creator.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {creator.bio}
                  </p>
                  
                  {/* Niches */}
                  <div className="flex flex-wrap gap-2">
                    {creator.niche.map((n) => (
                      <Badge key={n} variant="secondary" className="text-xs">
                        {n}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Social Stats */}
                  <div className="flex items-center gap-4 text-sm">
                    {Object.entries(creator.followers).map(([platform, count]) => (
                      <div key={platform} className="flex items-center gap-1">
                        {getSocialIcon(platform)}
                        <span>{formatFollowerCount(count || 0)}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{creator.completedDeals}</div>
                      <div className="text-muted-foreground text-xs">Deals</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{creator.responseRate}%</div>
                      <div className="text-muted-foreground text-xs">Response</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{creator.avgDeliveryTime}d</div>
                      <div className="text-muted-foreground text-xs">Delivery</div>
                    </div>
                  </div>
                  
                  {/* Rate Range */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Rate:</span>
                    <span className="font-semibold">
                      {formatCurrency(creator.rateRange.min)} - {formatCurrency(creator.rateRange.max)}
                    </span>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View Profile
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedCreator(creator);
                        setInviteDialogOpen(true);
                      }}
                      disabled={!creator.isAvailable}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {creator.isAvailable ? 'Invite' : 'Busy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCreators.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No creators found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your filters to see more creators.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Creator</DialogTitle>
            <DialogDescription>
              Send an invitation to {selectedCreator?.firstName} {selectedCreator?.lastName} for your campaign.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Select Campaign</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summer">Summer Fashion Collection</SelectItem>
                  <SelectItem value="tech">Tech Product Launch</SelectItem>
                  <SelectItem value="holiday">Holiday Promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Personal Message</Label>
              <textarea
                className="w-full p-3 border rounded-md resize-none"
                rows={4}
                placeholder="Add a personal message to your invitation..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedCreator && handleInviteCreator(selectedCreator)}>
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
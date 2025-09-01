import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Users, 
  TrendingUp, 
  Instagram, 
  Youtube, 
  Twitter,
  Eye,
  MessageSquare,
  Heart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Creator {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  role: string;
  created_at: string;
  // Portfolio data
  bio?: string;
  specialties?: string[];
  follower_count?: number;
  completion_rate?: number;
  rating?: number;
  total_projects?: number;
  profile_image?: string;
  portfolio_images?: string[];
  social_links?: {
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
}

const CREATOR_CATEGORIES = [
  'Gaming', 'Beauty & Fashion', 'Fitness & Health', 'Technology', 
  'Food & Cooking', 'Travel', 'Lifestyle', 'Music', 'Art & Design', 'Education'
];

const FOLLOWER_RANGES = [
  { label: 'Micro (1K-10K)', value: '1000-10000' },
  { label: 'Mid-tier (10K-100K)', value: '10000-100000' },
  { label: 'Macro (100K-1M)', value: '100000-1000000' },
  { label: 'Mega (1M+)', value: '1000000+' }
];

export default function Creators() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State management
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFollowerRange, setSelectedFollowerRange] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  
  // Modal state
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, []);

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'CREATOR')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching creators:', error);
        // If table query fails, show empty state
        setCreators([]);
        return;
      }

      // Enhance creators with mock portfolio data for demo purposes
      const enhancedCreators = (data || []).map((creator, index) => ({
        ...creator,
        bio: `Passionate content creator specializing in ${CREATOR_CATEGORIES[index % CREATOR_CATEGORIES.length].toLowerCase()}. Creating engaging content that drives results for brands.`,
        specialties: [CREATOR_CATEGORIES[index % CREATOR_CATEGORIES.length], CREATOR_CATEGORIES[(index + 1) % CREATOR_CATEGORIES.length]],
        follower_count: Math.floor(Math.random() * 500000) + 5000,
        completion_rate: Math.floor(Math.random() * 20) + 80,
        rating: Math.floor(Math.random() * 15) + 40, // 4.0 - 5.0 range (multiplied by 10)
        total_projects: Math.floor(Math.random() * 50) + 5,
        profile_image: `https://ui-avatars.com/api/?name=${creator.first_name}+${creator.last_name}&background=random&size=200`,
        social_links: {
          instagram: `https://instagram.com/${creator.first_name?.toLowerCase()}`,
          youtube: `https://youtube.com/c/${creator.first_name?.toLowerCase()}`,
          twitter: `https://twitter.com/${creator.first_name?.toLowerCase()}`
        }
      }));

      setCreators(enhancedCreators);

    } catch (error) {
      console.error('Error fetching creators:', error);
      toast({
        title: "Error",
        description: "Failed to load creators. Please try again.",
        variant: "destructive"
      });
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (creator: Creator) => {
    navigate(`/creators/${creator.id}`);
  };

  const handleContactCreator = async (creator: Creator) => {
    // For now, show a toast. Later this could open a messaging interface
    toast({
      title: "Contact Request Sent! 💌",
      description: `We'll connect you with ${creator.first_name} ${creator.last_name} shortly.`,
    });
  };

  const filterCreators = () => {
    let filtered = creators;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(creator =>
        `${creator.first_name} ${creator.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.specialties?.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(creator =>
        creator.specialties?.includes(selectedCategory)
      );
    }

    // Follower range filter
    if (selectedFollowerRange) {
      const [min, max] = selectedFollowerRange.split('-').map(Number);
      filtered = filtered.filter(creator => {
        const followers = creator.follower_count || 0;
        if (selectedFollowerRange === '1000000+') {
          return followers >= 1000000;
        }
        return followers >= min && followers <= (max || Infinity);
      });
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(creator =>
        creator.country?.toLowerCase().includes(selectedCountry.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'followers':
        filtered.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
        break;
      case 'projects':
        filtered.sort((a, b) => (b.total_projects || 0) - (a.total_projects || 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getRatingStars = (rating: number) => {
    const stars = Math.floor(rating / 10);
    return '⭐'.repeat(stars) + (rating % 10 >= 5 ? '⭐' : '');
  };

  if (!userProfile || userProfile.role !== 'BRAND') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is for brands only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-64"></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const filteredCreators = filterCreators();

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Discover Creators</h1>
          <p className="text-muted-foreground">Find the perfect content creators for your brand campaigns</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {filteredCreators.length} creators found
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search creators..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            {CREATOR_CATEGORIES.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedFollowerRange} onValueChange={setSelectedFollowerRange}>
          <SelectTrigger>
            <SelectValue placeholder="Followers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any Size</SelectItem>
            {FOLLOWER_RANGES.map(range => (
              <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Country"
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
        />

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="followers">Most Followers</SelectItem>
            <SelectItem value="projects">Most Projects</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Creator Grid */}
      {filteredCreators.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Creators Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory || selectedFollowerRange || selectedCountry 
                  ? "Try adjusting your search filters." 
                  : "No creators have joined the platform yet."
                }
              </p>
              {searchTerm || selectedCategory || selectedFollowerRange || selectedCountry ? (
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSelectedFollowerRange('');
                  setSelectedCountry('');
                }}>
                  Clear Filters
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCreators.map((creator) => (
            <Card key={creator.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start space-x-3">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                    <img 
                      src={creator.profile_image} 
                      alt={`${creator.first_name} ${creator.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {creator.first_name} {creator.last_name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{creator.country || 'Global'}</span>
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-sm font-medium">{(creator.rating! / 10).toFixed(1)}</span>
                      <div className="text-xs">{getRatingStars(creator.rating!)}</div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {creator.bio}
                </p>

                <div className="flex flex-wrap gap-1">
                  {creator.specialties?.slice(0, 2).map((specialty, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {creator.specialties && creator.specialties.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{creator.specialties.length - 2}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{formatFollowerCount(creator.follower_count!)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>{creator.completion_rate}% rate</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewProfile(creator)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleContactCreator(creator)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Creator Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Creator Profile</DialogTitle>
          </DialogHeader>
          {selectedCreator && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                  <img 
                    src={selectedCreator.profile_image} 
                    alt={`${selectedCreator.first_name} ${selectedCreator.last_name}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">
                    {selectedCreator.first_name} {selectedCreator.last_name}
                  </h2>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedCreator.country || 'Global'}</span>
                  </div>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{(selectedCreator.rating! / 10).toFixed(1)}</span>
                      <div className="text-sm">{getRatingStars(selectedCreator.rating!)}</div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {selectedCreator.total_projects} projects completed
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{selectedCreator.bio}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCreator.specialties?.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {formatFollowerCount(selectedCreator.follower_count!)}
                  </div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {selectedCreator.completion_rate}%
                  </div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {selectedCreator.total_projects}
                  </div>
                  <div className="text-sm text-muted-foreground">Projects</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Social Media</h3>
                <div className="flex space-x-4">
                  {selectedCreator.social_links?.instagram && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedCreator.social_links.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram className="h-4 w-4 mr-2" />
                        Instagram
                      </a>
                    </Button>
                  )}
                  {selectedCreator.social_links?.youtube && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedCreator.social_links.youtube} target="_blank" rel="noopener noreferrer">
                        <Youtube className="h-4 w-4 mr-2" />
                        YouTube
                      </a>
                    </Button>
                  )}
                  {selectedCreator.social_links?.twitter && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={selectedCreator.social_links.twitter} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-4 w-4 mr-2" />
                        Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button 
                  className="flex-1"
                  onClick={() => handleContactCreator(selectedCreator)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Creator
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/projects/new', { 
                    state: { selectedCreator: selectedCreator } 
                  })}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
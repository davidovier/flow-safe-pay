import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Star,
  MapPin,
  Users,
  TrendingUp,
  Instagram,
  Youtube,
  Twitter,
  Eye,
  MessageSquare,
  Heart,
  Calendar,
  Award,
  Briefcase,
  Image,
  ExternalLink,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
  Globe,
  Plus,
  UserPlus
} from 'lucide-react';
import { CreateDealForm } from '@/components/deals/CreateDealForm';

interface Creator {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  country: string;
  role: string;
  created_at: string;
  kyc_status: string;
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
    tiktok?: string;
    website?: string;
  };
}

interface Deal {
  id: string;
  title: string;
  amount_total: number;
  state: string;
  created_at: string;
  project: {
    title: string;
  } | null;
}

interface CreatorStats {
  totalDeals: number;
  completedDeals: number;
  totalEarnings: number;
  averageRating: number;
  completionRate: number;
}

export default function CreatorProfile() {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [creator, setCreator] = useState<Creator | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateDealModalOpen, setIsCreateDealModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCreatorProfile();
    }
  }, [id]);

  const fetchCreatorProfile = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Fetch creator profile
      const { data: creatorData, error: creatorError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('role', 'CREATOR')
        .single();

      if (creatorError) {
        if (creatorError.code === 'PGRST116') {
          toast({
            title: "Creator Not Found",
            description: "The requested creator profile could not be found.",
            variant: "destructive"
          });
          navigate('/creators');
          return;
        }
        throw creatorError;
      }

      setCreator(creatorData);

      // Fetch creator's deals with projects
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select(`
          id, amount_total, state, created_at,
          projects (
            title
          )
        `)
        .eq('creator_id', id)
        .order('created_at', { ascending: false });

      if (dealsError && dealsError.code !== '42P01') {
        console.error('Error fetching deals:', dealsError);
      } else if (dealsData) {
        setDeals(dealsData.map(deal => ({
          ...deal,
          title: deal.projects?.title || 'Untitled Project',
          project: deal.projects
        })));
      }

      // Calculate stats
      const totalDeals = dealsData?.length || 0;
      const completedDeals = dealsData?.filter(d => d.state === 'RELEASED').length || 0;
      const totalEarnings = dealsData?.filter(d => d.state === 'RELEASED')
        .reduce((sum, d) => sum + d.amount_total, 0) || 0;

      setStats({
        totalDeals,
        completedDeals,
        totalEarnings,
        averageRating: 4.8, // Mock rating since rating field doesn't exist
        completionRate: totalDeals > 0 ? (completedDeals / totalDeals) * 100 : 0
      });

    } catch (error) {
      console.error('Error fetching creator profile:', error);
      toast({
        title: "Error",
        description: "Failed to load creator profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return Instagram;
      case 'youtube': return Youtube;
      case 'twitter': return Twitter;
      case 'website': return Globe;
      default: return ExternalLink;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified': return <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800"><CheckCircle className="h-3 w-3" /> Verified</Badge>;
      case 'pending': return <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3" /> Pending</Badge>;
      default: return <Badge variant="secondary">Unverified</Badge>;
    }
  };

  const getDealStatusColor = (state: string) => {
    switch (state) {
      case 'DRAFT': return 'secondary';
      case 'FUNDED': return 'default';
      case 'RELEASED': return 'success';
      case 'DISPUTED': return 'warning';
      case 'REFUNDED': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-muted rounded w-48"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Creator profile not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/creators')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Creators
        </Button>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={creator.profile_image} alt={`${creator.first_name} ${creator.last_name}`} />
              <AvatarFallback className="text-lg">
                {getInitials(creator.first_name, creator.last_name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <h1 className="text-2xl font-bold">
                      {creator.first_name} {creator.last_name}
                    </h1>
                    {getStatusBadge(creator.kyc_status)}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{creator.country}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(creator.created_at)}</span>
                    </div>
                    {stats && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{stats.averageRating.toFixed(1)} rating</span>
                      </div>
                    )}
                  </div>

                  {creator.bio && (
                    <p className="text-muted-foreground max-w-2xl">
                      {creator.bio}
                    </p>
                  )}

                  {creator.specialties && creator.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {creator.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {userProfile?.role === 'BRAND' && (
                    <Dialog open={isCreateDealModalOpen} onOpenChange={setIsCreateDealModalOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Create Deal
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Create Deal with {creator.first_name}</DialogTitle>
                        </DialogHeader>
                        <CreateDealForm 
                          selectedCreatorId={creator.id}
                          onSuccess={() => {
                            setIsCreateDealModalOpen(false);
                            fetchCreatorProfile();
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  <Button variant="outline">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDeals}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedDeals} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                From completed projects
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                Project completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3 w-3 ${i < Math.floor(stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Tabs */}
      <Tabs defaultValue="portfolio" className="space-y-4">
        <TabsList>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              {creator.portfolio_images && creator.portfolio_images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {creator.portfolio_images.map((image, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={image}
                        alt={`Portfolio ${index + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Image className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Portfolio Items</h3>
                  <p className="text-muted-foreground">
                    This creator hasn't uploaded any portfolio items yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project History</CardTitle>
            </CardHeader>
            <CardContent>
              {deals.length > 0 ? (
                <div className="space-y-4">
                  {deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{deal.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span>{formatCurrency(deal.amount_total)}</span>
                          <span>•</span>
                          <span>Created {formatDate(deal.created_at)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getDealStatusColor(deal.state) as any}>
                          {deal.state}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => navigate(`/deals/${deal.id}`)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Projects Yet</h3>
                  <p className="text-muted-foreground">
                    This creator hasn't worked on any projects yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bio */}
              <div>
                <h3 className="font-medium mb-2">Bio</h3>
                <p className="text-muted-foreground">
                  {creator.bio || 'No bio provided.'}
                </p>
              </div>

              {/* Social Links */}
              {creator.social_links && Object.keys(creator.social_links).length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Social Media</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(creator.social_links).map(([platform, url]) => {
                      if (!url) return null;
                      const Icon = getSocialIcon(platform);
                      return (
                        <Button key={platform} variant="outline" size="sm" asChild>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Icon className="h-4 w-4 mr-2" />
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </a>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div>
                <h3 className="font-medium mb-2">Contact</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{creator.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{creator.country}</span>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              {creator.specialties && creator.specialties.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {creator.specialties.map((specialty, index) => (
                      <Badge key={index} variant="outline">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
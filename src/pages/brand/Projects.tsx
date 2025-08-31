import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Search, FolderOpen, Handshake } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  deals: { id: string; state: string }[];
}

export default function Projects() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (userProfile) {
      fetchProjects();
    }
  }, [userProfile]);

  const fetchProjects = async () => {
    if (!userProfile) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          deals(id, state)
        `)
        .eq('brand_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProjectStats = (project: Project) => {
    const totalDeals = project.deals?.length || 0;
    const activeDeals = project.deals?.filter(deal => deal.state === 'FUNDED').length || 0;
    return { totalDeals, activeDeals };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage your brand partnerships and campaigns
          </p>
        </div>
        <Button onClick={() => navigate('/projects/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first project to start partnering with creators'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/projects/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredProjects.map((project) => {
            const { totalDeals, activeDeals } = getProjectStats(project);
            return (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {project.title}
                        <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {project.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Handshake className="h-4 w-4" />
                        <span>{totalDeals} deals</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-success"></div>
                        <span>{activeDeals} active</span>
                      </div>
                      <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        View Details
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}/deals/new`)}
                      >
                        Create Deal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
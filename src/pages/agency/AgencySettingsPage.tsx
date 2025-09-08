import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Building2, Globe, MapPin, Users, Crown, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AgencyData {
  id: string;
  name: string;
  description?: string;
  website?: string;
  address?: string;
  tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  maxCreators: number;
  platformFeeRate: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    managedCreators: number;
  };
}

export function AgencySettingsPage() {
  const [agency, setAgency] = useState<AgencyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    address: '',
  });

  const { userProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadAgencyData();
  }, []);

  const loadAgencyData = async () => {
    try {
      setLoading(true);
      
      // Mock API call - replace with actual API call
      const response = await fetch('/api/agencies/me', {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgency(data);
        setFormData({
          name: data.name || '',
          description: data.description || '',
          website: data.website || '',
          address: data.address || '',
        });
      }
    } catch (error) {
      console.error('Error loading agency data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load agency information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/agencies/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update agency');

      toast({
        title: 'Success',
        description: 'Agency settings updated successfully',
      });

      loadAgencyData();
    } catch (error) {
      console.error('Error updating agency:', error);
      toast({
        title: 'Error',
        description: 'Failed to update agency settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAgency = async () => {
    try {
      const response = await fetch('/api/agencies/me', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete agency');

      toast({
        title: 'Success',
        description: 'Agency deleted successfully',
      });

      // Redirect to dashboard or onboarding
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error deleting agency:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete agency',
        variant: 'destructive',
      });
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'STARTER': return 'bg-blue-100 text-blue-800';
      case 'PROFESSIONAL': return 'bg-purple-100 text-purple-800';
      case 'ENTERPRISE': return 'bg-gold-100 text-gold-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">No Agency Found</h2>
          <p className="text-muted-foreground">
            You don't appear to have an agency set up yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agency Settings</h1>
        <p className="text-muted-foreground">
          Manage your agency information and configuration.
        </p>
      </div>

      {/* Agency Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Agency Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Agency Name</Label>
                <p className="text-lg font-semibold">{agency.name}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Current Plan</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getTierColor(agency.tier)}>
                    <Crown className="h-3 w-3 mr-1" />
                    {agency.tier}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {agency.platformFeeRate}% platform fee
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Creator Usage</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {agency._count.managedCreators} of {agency.maxCreators}
                  </span>
                  <span className="text-sm text-muted-foreground">creators</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                <Badge variant={agency.isActive ? 'default' : 'secondary'} className="mt-1">
                  {agency.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />
          
          <div className="text-sm text-muted-foreground">
            <p>Agency created on {new Date(agency.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        </CardContent>
      </Card>

      {/* Agency Information */}
      <Card>
        <CardHeader>
          <CardTitle>Agency Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="name">Agency Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your agency name"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your agency..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="website">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://yourwebsite.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Your business address"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Delete Agency</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your agency and all associated data. This action cannot be undone.
            </p>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Agency
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your agency "{agency.name}" and all associated data.
                    This action cannot be undone and will affect all your managed creators.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAgency}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Agency
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
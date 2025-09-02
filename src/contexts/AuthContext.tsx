import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'CREATOR' | 'BRAND' | 'ADMIN';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  stripe_account_id: string | null;
  kyc_status: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, userData?: { first_name?: string; last_name?: string; role?: UserRole }) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  deleteAccount: (confirmEmail: string, reason?: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile and handle deleted accounts
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // If user profile doesn't exist (deleted account), sign them out
        if (error.code === 'PGRST116') { // No rows returned
          console.log('User profile not found - account may have been deleted. Signing out...');
          toast({
            title: "Account Not Found",
            description: "This account has been deleted. You have been signed out.",
            variant: "destructive"
          });
          await supabase.auth.signOut();
        }
        return;
      }

      // Check if account is marked as deleted
      if (data?.email === 'DELETED_ACCOUNT' || data?.first_name === '[DELETED]') {
        console.log('Account marked as deleted. Signing out...');
        toast({
          title: "Account Deleted",
          description: "This account has been deleted. You have been signed out.",
          variant: "destructive"
        });
        await supabase.auth.signOut();
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing in",
        description: error.message,
      });
      return { error };
    }

    // Check if this is a deleted account immediately after successful auth
    if (data?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('email, first_name, kyc_status')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        // Account doesn't exist - was completely deleted
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Account Not Found",
          description: "This account has been deleted. Please create a new account if needed.",
        });
        return { error: new Error('Account has been deleted') };
      }

      if (profile.email === 'DELETED_ACCOUNT' || profile.first_name === '[DELETED]' || profile.kyc_status === 'DELETED') {
        // Account is marked as deleted
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Account Deleted", 
          description: "This account has been deleted. Please create a new account if needed.",
        });
        return { error: new Error('Account has been deleted') };
      }
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });

    return { error: null };
  };

  const signUp = async (email: string, password: string, userData?: { first_name?: string; last_name?: string; role?: UserRole }) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: userData?.first_name || '',
          last_name: userData?.last_name || '',
          role: userData?.role || 'CREATOR',
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error signing up",
        description: error.message,
      });
    } else {
      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: error.message,
      });
    } else {
      await fetchUserProfile(user.id);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    }

    return { error };
  };

  const deleteAccount = async (confirmEmail: string, reason?: string) => {
    if (!user || !userProfile) {
      return { error: new Error('No user logged in') };
    }

    // Verify email confirmation
    if (userProfile.email !== confirmEmail) {
      return { error: new Error('Email confirmation does not match your account email') };
    }

    try {
      // Check for active deals that would prevent deletion
      // Get deals where user is creator
      const { data: creatorDeals, error: creatorDealsError } = await supabase
        .from('deals')
        .select('id, state')
        .eq('creator_id', user.id)
        .in('state', ['FUNDED', 'DISPUTED']);

      if (creatorDealsError) {
        throw creatorDealsError;
      }

      // Get deals where user is brand (through projects)
      const { data: brandDeals, error: brandDealsError } = await supabase
        .from('deals')
        .select('id, state, projects!inner(brand_id)')
        .eq('projects.brand_id', user.id)
        .in('state', ['FUNDED', 'DISPUTED']);

      if (brandDealsError) {
        throw brandDealsError;
      }

      const activeDeals = [...(creatorDeals || []), ...(brandDeals || [])];

      if (activeDeals && activeDeals.length > 0) {
        return { error: new Error('Cannot delete account with active funded deals. Please complete or resolve all deals first.') };
      }

      // Start comprehensive deletion process
      console.log('Starting account deletion process...');

      // 1. Create audit log entry before deletion
      const { error: auditError } = await supabase.from('events').insert({
        actor_user_id: user.id,
        type: 'user.deletion_started',
        payload: {
          user_id: user.id,
          email: userProfile.email,
          reason: reason || 'User requested deletion',
          timestamp: new Date().toISOString(),
          account_type: userProfile.role,
          gdpr_compliant: true,
          deletion_method: 'client_side'
        }
      });

      if (auditError) {
        console.warn('Failed to create audit log:', auditError);
      }

      // 2. Delete data in correct order to handle foreign key constraints
      let deletionErrors = [];

      try {
        // Get all deals related to this user (as creator or brand)
        const { data: allUserDeals } = await supabase
          .from('deals')
          .select('id')
          .or(`creator_id.eq.${user.id},project_id.in.(select id from projects where brand_id = '${user.id}')`);

        const userDealIds = allUserDeals?.map(deal => deal.id) || [];

        if (userDealIds.length > 0) {
          // Delete deliverables
          const { error: deliverablesError } = await supabase
            .from('deliverables')
            .delete()
            .in('milestone_id', 
              supabase.from('milestones').select('id').in('deal_id', userDealIds)
            );
          
          if (deliverablesError) {
            console.warn('Error deleting deliverables:', deliverablesError);
            deletionErrors.push('deliverables');
          }

          // Delete payouts
          const { error: payoutsError } = await supabase
            .from('payouts')
            .delete()
            .in('deal_id', userDealIds);
          
          if (payoutsError) {
            console.warn('Error deleting payouts:', payoutsError);
            deletionErrors.push('payouts');
          }

          // Delete milestones
          const { error: milestonesError } = await supabase
            .from('milestones')
            .delete()
            .in('deal_id', userDealIds);
          
          if (milestonesError) {
            console.warn('Error deleting milestones:', milestonesError);
            deletionErrors.push('milestones');
          }

          // Delete contracts
          const { error: contractsError } = await supabase
            .from('contracts')
            .delete()
            .in('deal_id', userDealIds);
          
          if (contractsError) {
            console.warn('Error deleting contracts:', contractsError);
            deletionErrors.push('contracts');
          }

          // Delete disputes
          const { error: disputesError } = await supabase
            .from('disputes')
            .delete()
            .or(`raised_by_user_id.eq.${user.id},deal_id.in.(${userDealIds.join(',')})`);
          
          if (disputesError) {
            console.warn('Error deleting disputes:', disputesError);
            deletionErrors.push('disputes');
          }

          // Delete deals where user is creator
          const { error: creatorDealsDelError } = await supabase
            .from('deals')
            .delete()
            .eq('creator_id', user.id);
          
          if (creatorDealsDelError) {
            console.warn('Error deleting creator deals:', creatorDealsDelError);
            deletionErrors.push('creator_deals');
          }

          // Delete deals from user's projects
          const { error: brandDealsDelError } = await supabase
            .from('deals')
            .delete()
            .in('project_id', 
              supabase.from('projects').select('id').eq('brand_id', user.id)
            );
          
          if (brandDealsDelError) {
            console.warn('Error deleting brand deals:', brandDealsDelError);
            deletionErrors.push('brand_deals');
          }
        }

        // Delete projects where user is brand
        const { error: projectsError } = await supabase
          .from('projects')
          .delete()
          .eq('brand_id', user.id);
        
        if (projectsError) {
          console.warn('Error deleting projects:', projectsError);
          deletionErrors.push('projects');
        }

        // Anonymize events (keep for audit but remove personal connection)
        const { error: eventsError } = await supabase
          .from('events')
          .update({ actor_user_id: null })
          .eq('actor_user_id', user.id);
        
        if (eventsError) {
          console.warn('Error anonymizing events:', eventsError);
          deletionErrors.push('events_anonymization');
        }

        // Instead of deleting, mark user as deleted (GDPR compliant - removes all personal data)
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            email: 'DELETED_ACCOUNT',
            first_name: '[DELETED]',
            last_name: '[DELETED]',
            country: null,
            stripe_account_id: null,
            kyc_status: 'DELETED',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
        
        if (userUpdateError) {
          console.error('Error marking user as deleted:', userUpdateError);
          deletionErrors.push('user_profile');
          throw userUpdateError;
        }

      } catch (deletionError) {
        console.error('Error during data deletion:', deletionError);
        throw deletionError;
      }

      // Log successful deletion (even if some parts failed)
      await supabase.from('events').insert({
        actor_user_id: null, // Anonymized
        type: 'user.deletion_completed',
        payload: {
          deleted_user_id: user.id,
          deletion_timestamp: new Date().toISOString(),
          gdpr_compliant: true,
          client_side_deletion: true,
          auth_user_deleted: false, // Cannot delete auth user from client
          deletion_errors: deletionErrors,
          data_types_deleted: [
            'user_profile', 'projects', 'deals', 'milestones', 
            'deliverables', 'contracts', 'disputes', 'payouts'
          ]
        }
      });

      // Sign out immediately
      await supabase.auth.signOut();

      // Show appropriate message based on deletion completeness
      const hasErrors = deletionErrors.length > 0;
      toast({
        title: "Account Deleted Successfully",
        description: hasErrors
          ? "Your account has been deleted, but some related data may remain. If you try to log in again, you will be immediately signed out. You can create a new account with the same email."
          : "Your account has been permanently deleted and deactivated. All personal data has been removed. If you try to log in again, you will be immediately signed out. You can create a new account with the same email.",
        variant: hasErrors ? "destructive" : "default"
      });

      return { error: null };

    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      let errorMessage = 'Failed to delete account. Please try again or contact support.';
      
      if (error.message?.includes('Email confirmation')) {
        errorMessage = 'Email confirmation does not match your account email';
      } else if (error.message?.includes('active funded deals')) {
        errorMessage = 'Cannot delete account with active funded deals. Please complete or resolve all deals first.';
      }

      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: errorMessage,
      });

      return { error };
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
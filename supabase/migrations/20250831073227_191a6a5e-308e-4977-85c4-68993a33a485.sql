-- Create enums for various status fields
CREATE TYPE user_role AS ENUM ('CREATOR', 'BRAND', 'ADMIN');
CREATE TYPE deal_state AS ENUM ('DRAFT', 'FUNDED', 'RELEASED', 'DISPUTED', 'REFUNDED');
CREATE TYPE milestone_state AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'RELEASED', 'DISPUTED');
CREATE TYPE dispute_state AS ENUM ('OPEN', 'PARTIAL', 'RESOLVED', 'REJECTED');
CREATE TYPE payment_provider AS ENUM ('STRIPE', 'MANGOPAY', 'CRYPTO');
CREATE TYPE escrow_state AS ENUM ('unfunded', 'funded', 'released', 'refunded');

-- Users table (extends auth.users with business fields)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  country TEXT,
  stripe_account_id TEXT,
  kyc_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deals table
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  amount_total INTEGER NOT NULL,
  escrow_id TEXT,
  state deal_state NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Milestones table
CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount INTEGER NOT NULL,
  due_at TIMESTAMPTZ,
  state milestone_state NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deliverables table
CREATE TABLE public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id UUID NOT NULL REFERENCES public.milestones(id) ON DELETE CASCADE,
  url TEXT,
  file_hash TEXT,
  submitted_at TIMESTAMPTZ,
  checks JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  pdf_url TEXT,
  signature_brand TEXT,
  signature_creator TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Disputes table
CREATE TABLE public.disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  raised_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT,
  state dispute_state NOT NULL DEFAULT 'OPEN',
  resolution TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payouts table
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  provider payment_provider NOT NULL,
  provider_ref TEXT,
  status TEXT DEFAULT 'pending',
  amount INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Events table for audit log
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Brands can view their own projects" ON public.projects
  FOR SELECT USING (brand_id = auth.uid());

CREATE POLICY "Brands can manage their own projects" ON public.projects
  FOR ALL USING (brand_id = auth.uid());

-- RLS Policies for deals table
CREATE POLICY "Users can view deals they're involved in" ON public.deals
  FOR SELECT USING (
    creator_id = auth.uid() OR 
    project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
  );

CREATE POLICY "Brands can manage deals for their projects" ON public.deals
  FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
  );

CREATE POLICY "Creators can update deals they're assigned to" ON public.deals
  FOR UPDATE USING (creator_id = auth.uid());

-- RLS Policies for milestones table
CREATE POLICY "Users can view milestones for their deals" ON public.milestones
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM public.deals 
      WHERE creator_id = auth.uid() OR 
      project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
    )
  );

-- RLS Policies for deliverables table
CREATE POLICY "Users can view deliverables for their milestones" ON public.deliverables
  FOR SELECT USING (
    milestone_id IN (
      SELECT m.id FROM public.milestones m
      JOIN public.deals d ON m.deal_id = d.id
      WHERE d.creator_id = auth.uid() OR 
      d.project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
    )
  );

CREATE POLICY "Creators can manage deliverables for their deals" ON public.deliverables
  FOR ALL USING (
    milestone_id IN (
      SELECT m.id FROM public.milestones m
      JOIN public.deals d ON m.deal_id = d.id
      WHERE d.creator_id = auth.uid()
    )
  );

-- RLS Policies for events table (audit log)
CREATE POLICY "Users can view events they're involved in" ON public.events
  FOR SELECT USING (
    actor_user_id = auth.uid() OR
    -- Add more complex logic here for viewing events related to user's deals
    true -- For now, allow viewing all events (can be refined)
  );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    'CREATOR', -- Default role, can be changed later
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update timestamp triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_milestones_updated_at BEFORE UPDATE ON public.milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliverables_updated_at BEFORE UPDATE ON public.deliverables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON public.disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
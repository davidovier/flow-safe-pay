-- Fix missing RLS policies for remaining tables

-- RLS Policies for contracts table
CREATE POLICY "Users can view contracts for their deals" ON public.contracts
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM public.deals 
      WHERE creator_id = auth.uid() OR 
      project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
    )
  );

CREATE POLICY "Brands can manage contracts for their deals" ON public.contracts
  FOR ALL USING (
    deal_id IN (
      SELECT d.id FROM public.deals d
      JOIN public.projects p ON d.project_id = p.id
      WHERE p.brand_id = auth.uid()
    )
  );

-- RLS Policies for disputes table
CREATE POLICY "Users can view disputes for their deals" ON public.disputes
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM public.deals 
      WHERE creator_id = auth.uid() OR 
      project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
    )
  );

CREATE POLICY "Users can create disputes for their deals" ON public.disputes
  FOR INSERT WITH CHECK (
    raised_by_user_id = auth.uid() AND
    deal_id IN (
      SELECT id FROM public.deals 
      WHERE creator_id = auth.uid() OR 
      project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
    )
  );

CREATE POLICY "Users can update disputes they raised" ON public.disputes
  FOR UPDATE USING (raised_by_user_id = auth.uid());

-- RLS Policies for payouts table
CREATE POLICY "Users can view payouts for their deals" ON public.payouts
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM public.deals 
      WHERE creator_id = auth.uid() OR 
      project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
    )
  );

-- Fix function search_path security warnings
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
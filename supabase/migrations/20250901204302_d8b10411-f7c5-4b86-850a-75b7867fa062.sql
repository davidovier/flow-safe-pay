-- Fix critical security vulnerability in events table RLS policy
-- Remove the dangerous 'OR true' clause that exposes all events to any authenticated user

DROP POLICY IF EXISTS "Users can view events they're involved in" ON public.events;

CREATE POLICY "Users can view their own events" ON public.events
FOR SELECT 
USING (actor_user_id = auth.uid());
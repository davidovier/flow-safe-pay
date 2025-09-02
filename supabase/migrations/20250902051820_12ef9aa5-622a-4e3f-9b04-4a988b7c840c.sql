-- Critical Security Fix: Add comprehensive RLS policies for milestones and payouts tables

-- ============================================================================
-- MILESTONES TABLE RLS POLICIES
-- ============================================================================

-- Policy: Brands can create milestones for their deals
CREATE POLICY "Brands can create milestones for their deals" 
ON public.milestones 
FOR INSERT 
TO authenticated
WITH CHECK (
  deal_id IN (
    SELECT d.id 
    FROM deals d 
    JOIN projects p ON d.project_id = p.id 
    WHERE p.brand_id = auth.uid()
  )
);

-- Policy: Brands can update milestones for their deals
CREATE POLICY "Brands can update milestones for their deals" 
ON public.milestones 
FOR UPDATE 
TO authenticated
USING (
  deal_id IN (
    SELECT d.id 
    FROM deals d 
    JOIN projects p ON d.project_id = p.id 
    WHERE p.brand_id = auth.uid()
  )
);

-- Policy: Creators can update milestone states for their deals
CREATE POLICY "Creators can update milestone states for their deals" 
ON public.milestones 
FOR UPDATE 
TO authenticated
USING (
  deal_id IN (
    SELECT id FROM deals WHERE creator_id = auth.uid()
  )
);

-- Policy: Prevent unauthorized milestone deletion
CREATE POLICY "Only system can delete milestones" 
ON public.milestones 
FOR DELETE 
TO authenticated
USING (false); -- Only allow deletion through system processes

-- ============================================================================
-- PAYOUTS TABLE RLS POLICIES
-- ============================================================================

-- Policy: Only system can create payouts (no direct user inserts)
CREATE POLICY "System only payout creation" 
ON public.payouts 
FOR INSERT 
TO authenticated
WITH CHECK (false); -- All payout creation must go through system/edge functions

-- Policy: Only system can update payout status
CREATE POLICY "System only payout updates" 
ON public.payouts 
FOR UPDATE 
TO authenticated
USING (false); -- All payout updates must go through system/edge functions

-- Policy: Prevent unauthorized payout deletion
CREATE POLICY "System only payout deletion" 
ON public.payouts 
FOR DELETE 
TO authenticated
USING (false); -- Payouts should never be deleted, only status updated

-- ============================================================================
-- EVENTS TABLE SECURITY ENHANCEMENT
-- ============================================================================

-- Policy: Only system can create audit events
CREATE POLICY "System only event creation" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK (false); -- All events must be created through system processes

-- Policy: Users can only view events they're involved in
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
CREATE POLICY "Users can view events for their deals" 
ON public.events 
FOR SELECT 
TO authenticated
USING (
  -- Users can see events where they are the actor
  actor_user_id = auth.uid() OR
  -- Users can see events for deals they're involved in
  (payload->>'deal_id')::uuid IN (
    SELECT deals.id FROM deals 
    WHERE deals.creator_id = auth.uid() 
    OR deals.project_id IN (
      SELECT projects.id FROM projects WHERE projects.brand_id = auth.uid()
    )
  )
);

-- ============================================================================
-- DISPUTES TABLE SECURITY ENHANCEMENT
-- ============================================================================

-- Add policy for brands to update dispute resolution
CREATE POLICY "Brands can resolve disputes for their deals" 
ON public.disputes 
FOR UPDATE 
TO authenticated
USING (
  deal_id IN (
    SELECT d.id 
    FROM deals d 
    JOIN projects p ON d.project_id = p.id 
    WHERE p.brand_id = auth.uid()
  )
);

-- ============================================================================
-- CONTRACTS TABLE SECURITY ENHANCEMENT
-- ============================================================================

-- Policy: Creators can sign contracts for their deals
CREATE POLICY "Creators can sign contracts for their deals" 
ON public.contracts 
FOR UPDATE 
TO authenticated
USING (
  deal_id IN (
    SELECT id FROM deals WHERE creator_id = auth.uid()
  )
);

-- Add indexes for security policy performance
CREATE INDEX IF NOT EXISTS idx_deals_creator_project ON deals(creator_id, project_id);
CREATE INDEX IF NOT EXISTS idx_projects_brand ON projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_milestones_deal ON milestones(deal_id);
CREATE INDEX IF NOT EXISTS idx_payouts_deal ON payouts(deal_id);
CREATE INDEX IF NOT EXISTS idx_events_payload_deal ON events USING GIN ((payload->>'deal_id'));

-- Add security event logging trigger
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Log sensitive operations for audit trail
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'payouts' THEN
    INSERT INTO events (type, actor_user_id, payload) 
    VALUES (
      'security.payout_updated',
      auth.uid(),
      jsonb_build_object(
        'payout_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'timestamp', now()
      )
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND TG_TABLE_NAME = 'deals' AND OLD.state != NEW.state THEN
    INSERT INTO events (type, actor_user_id, payload) 
    VALUES (
      'security.deal_state_changed',
      auth.uid(),
      jsonb_build_object(
        'deal_id', NEW.id,
        'old_state', OLD.state,
        'new_state', NEW.state,
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply security logging triggers
DROP TRIGGER IF EXISTS security_audit_payouts ON payouts;
CREATE TRIGGER security_audit_payouts
  AFTER UPDATE ON payouts
  FOR EACH ROW
  EXECUTE FUNCTION log_security_event();

DROP TRIGGER IF EXISTS security_audit_deals ON deals;
CREATE TRIGGER security_audit_deals
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION log_security_event();
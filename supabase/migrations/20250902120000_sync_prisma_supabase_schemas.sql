-- ============================================================================
-- SCHEMA SYNCHRONIZATION: Align Supabase with Prisma Schema
-- This migration ensures both backends use consistent schema structure
-- ============================================================================

-- Add missing enums and update existing ones
DO $$ BEGIN
    -- Update KYC status enum to match Prisma
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_status_new') THEN
        CREATE TYPE kyc_status_new AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REQUIRED', 'DELETED');
    END IF;
END $$;

-- Add missing fields to users table to match Prisma
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS hashed_password TEXT,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update kyc_status column to use proper enum
ALTER TABLE users 
ALTER COLUMN kyc_status TYPE kyc_status_new USING kyc_status::kyc_status_new;

-- Add missing payout_status enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
        CREATE TYPE payout_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');
    END IF;
END $$;

-- Update payouts table to match Prisma schema
ALTER TABLE payouts 
ADD COLUMN IF NOT EXISTS provider payment_provider NOT NULL DEFAULT 'STRIPE',
ADD COLUMN IF NOT EXISTS provider_ref TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Update payouts status column to use proper enum
ALTER TABLE payouts 
ALTER COLUMN status TYPE payout_status USING 
  CASE status
    WHEN 'pending' THEN 'PENDING'::payout_status
    WHEN 'processing' THEN 'PROCESSING'::payout_status
    WHEN 'completed' THEN 'COMPLETED'::payout_status
    WHEN 'failed' THEN 'FAILED'::payout_status
    WHEN 'canceled' THEN 'CANCELED'::payout_status
    ELSE 'PENDING'::payout_status
  END;

-- Add missing deal fields to match Prisma
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS funded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Add missing milestone fields
ALTER TABLE milestones 
ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ;

-- Add missing deliverable fields to match Prisma
ALTER TABLE deliverables 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS checks JSONB;

-- Update contracts table to match Prisma
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- Add missing dispute fields
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS resolution TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Ensure all tables have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_deals_state ON deals(state);
CREATE INDEX IF NOT EXISTS idx_deals_creator_id ON deals(creator_id);
CREATE INDEX IF NOT EXISTS idx_deals_escrow_id ON deals(escrow_id);
CREATE INDEX IF NOT EXISTS idx_milestones_state ON milestones(state);
CREATE INDEX IF NOT EXISTS idx_milestones_due_at ON milestones(due_at);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_provider_ref ON payouts(provider_ref);
CREATE INDEX IF NOT EXISTS idx_deliverables_file_hash ON deliverables(file_hash);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_actor_user_id ON events(actor_user_id);

-- ============================================================================
-- UPDATE RLS POLICIES TO HANDLE NEW FIELDS
-- ============================================================================

-- Update users table policies to handle deleted accounts
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" 
ON users 
FOR SELECT 
TO authenticated
USING (
  id = auth.uid() AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" 
ON users 
FOR UPDATE 
TO authenticated
USING (
  id = auth.uid() AND deleted_at IS NULL
);

-- Add policy to prevent access to deleted accounts
CREATE POLICY "Deleted accounts are hidden" 
ON users 
FOR ALL
TO authenticated
USING (deleted_at IS NULL);

-- ============================================================================
-- CREATE FUNCTIONS FOR SCHEMA CONSISTENCY
-- ============================================================================

-- Function to generate CUID-like IDs (to match Prisma)
CREATE OR REPLACE FUNCTION generate_cuid() 
RETURNS TEXT AS $$
DECLARE
  timestamp_part TEXT;
  random_part TEXT;
BEGIN
  -- Generate timestamp part (base36 of current timestamp)
  timestamp_part := encode(int8send(extract(epoch from now())::bigint), 'hex');
  
  -- Generate random part
  random_part := encode(gen_random_bytes(12), 'hex');
  
  -- Combine with 'c' prefix (similar to CUID format)
  RETURN 'c' || substring(timestamp_part from 1 for 8) || substring(random_part from 1 for 16);
END;
$$ LANGUAGE plpgsql;

-- Function to sync deal state changes with proper timestamps
CREATE OR REPLACE FUNCTION update_deal_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update timestamps based on state changes
  IF NEW.state != OLD.state THEN
    CASE NEW.state
      WHEN 'FUNDED' THEN
        NEW.funded_at = NOW();
      WHEN 'RELEASED' THEN
        NEW.completed_at = NOW();
      WHEN 'REFUNDED' THEN
        NEW.completed_at = NOW();
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to deals
DROP TRIGGER IF EXISTS deal_state_timestamps ON deals;
CREATE TRIGGER deal_state_timestamps
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_deal_timestamps();

-- Function to sync milestone state changes with proper timestamps
CREATE OR REPLACE FUNCTION update_milestone_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-update timestamps based on state changes
  IF NEW.state != OLD.state THEN
    CASE NEW.state
      WHEN 'SUBMITTED' THEN
        NEW.submitted_at = NOW();
      WHEN 'APPROVED' THEN
        NEW.approved_at = NOW();
      WHEN 'RELEASED' THEN
        NEW.released_at = NOW();
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to milestones
DROP TRIGGER IF EXISTS milestone_state_timestamps ON milestones;
CREATE TRIGGER milestone_state_timestamps
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_milestone_timestamps();

-- ============================================================================
-- DATA MIGRATION FOR EXISTING RECORDS
-- ============================================================================

-- Update existing users that might have inconsistent data
UPDATE users 
SET 
  kyc_status = 'PENDING'::kyc_status_new
WHERE kyc_status IS NULL;

-- Update existing payouts that might be missing provider information
UPDATE payouts 
SET 
  provider = 'STRIPE'::payment_provider,
  provider_ref = COALESCE(provider_ref, 'legacy_' || id)
WHERE provider IS NULL;

-- ============================================================================
-- VALIDATION CONSTRAINTS
-- ============================================================================

-- Add constraints to ensure data consistency
ALTER TABLE users 
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE payouts 
ADD CONSTRAINT check_amount_positive 
CHECK (amount > 0);

ALTER TABLE deals 
ADD CONSTRAINT check_amount_positive 
CHECK (amount_total > 0);

ALTER TABLE milestones 
ADD CONSTRAINT check_amount_positive 
CHECK (amount > 0);

-- ============================================================================
-- REFRESH MATERIALIZED VIEWS AND STATISTICS
-- ============================================================================

-- Update table statistics for query optimization
ANALYZE users;
ANALYZE projects;
ANALYZE deals;
ANALYZE milestones;
ANALYZE deliverables;
ANALYZE contracts;
ANALYZE disputes;
ANALYZE payouts;
ANALYZE events;

-- Log the migration completion
INSERT INTO events (type, payload) 
VALUES (
  'system.schema_migration_completed',
  jsonb_build_object(
    'migration', 'sync_prisma_supabase_schemas',
    'timestamp', NOW(),
    'changes', jsonb_build_array(
      'Added missing user fields (hashed_password, deleted_at)',
      'Updated KYC status enum',
      'Enhanced payout table with provider info',
      'Added timestamp fields to deals and milestones',
      'Enhanced deliverables with file metadata',
      'Added performance indexes',
      'Created schema consistency functions',
      'Updated RLS policies for deleted accounts'
    )
  )
);
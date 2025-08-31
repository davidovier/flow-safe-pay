-- Create payment_methods table for user payment information
CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('bank_transfer', 'paypal', 'stripe')),
    name TEXT NOT NULL,
    details JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_balances table to track available funds
CREATE TABLE IF NOT EXISTS user_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    available_amount INTEGER DEFAULT 0, -- Amount in cents
    pending_amount INTEGER DEFAULT 0,   -- Amount pending in payouts
    total_earned INTEGER DEFAULT 0,     -- All-time earnings
    currency TEXT DEFAULT 'usd',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, currency)
);

-- Update payouts table to be more comprehensive
ALTER TABLE public.payouts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS amount_requested INTEGER,
ADD COLUMN IF NOT EXISTS amount_received INTEGER,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS failed_reason TEXT;

-- Update status field to use enum
DO $$ BEGIN
    CREATE TYPE payout_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Alter the status column if it's not already the enum type
DO $$ BEGIN
    ALTER TABLE public.payouts ALTER COLUMN status TYPE payout_status USING status::payout_status;
EXCEPTION
    WHEN OTHERS THEN 
        -- Column might not exist or might be different type, add it
        ALTER TABLE public.payouts ADD COLUMN IF NOT EXISTS status payout_status DEFAULT 'pending';
END $$;

-- Enable RLS on new tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Users can view their own payment methods" ON payment_methods
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own payment methods" ON payment_methods
    FOR ALL USING (user_id = auth.uid());

-- RLS Policies for user_balances  
CREATE POLICY "Users can view their own balance" ON user_balances
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can update user balances" ON user_balances
    FOR ALL USING (true); -- This will be restricted to service role

-- Update existing payouts RLS policy
DROP POLICY IF EXISTS "Users can view payouts for their deals" ON public.payouts;
CREATE POLICY "Users can view their own payouts" ON public.payouts
    FOR SELECT USING (
        user_id = auth.uid() OR
        deal_id IN (
            SELECT id FROM public.deals 
            WHERE creator_id = auth.uid() OR 
            project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
        )
    );

CREATE POLICY "Users can create their own payout requests" ON public.payouts
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Add update trigger for new tables
CREATE TRIGGER update_payment_methods_updated_at 
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at 
    BEFORE UPDATE ON user_balances
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate user balance from completed deals
CREATE OR REPLACE FUNCTION calculate_user_balance(user_uuid UUID)
RETURNS TABLE(
    available_amount INTEGER,
    pending_amount INTEGER,
    total_earned INTEGER
) AS $$
DECLARE
    total_from_deals INTEGER := 0;
    pending_payouts INTEGER := 0;
    available INTEGER := 0;
BEGIN
    -- Calculate total earnings from completed milestones
    SELECT COALESCE(SUM(m.amount), 0) INTO total_from_deals
    FROM milestones m
    JOIN deals d ON m.deal_id = d.id
    WHERE d.creator_id = user_uuid 
    AND m.state = 'RELEASED';

    -- Calculate pending payout amounts
    SELECT COALESCE(SUM(p.amount), 0) INTO pending_payouts
    FROM payouts p
    WHERE p.user_id = user_uuid 
    AND p.status IN ('pending', 'processing');

    -- Available = Total earned - pending payouts
    available := total_from_deals - pending_payouts;

    RETURN QUERY SELECT available, pending_payouts, total_from_deals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update user balance
CREATE OR REPLACE FUNCTION update_user_balance(user_uuid UUID)
RETURNS void AS $$
DECLARE
    balance_data RECORD;
BEGIN
    SELECT * INTO balance_data FROM calculate_user_balance(user_uuid);
    
    INSERT INTO user_balances (user_id, available_amount, pending_amount, total_earned)
    VALUES (user_uuid, balance_data.available_amount, balance_data.pending_amount, balance_data.total_earned)
    ON CONFLICT (user_id, currency) DO UPDATE SET
        available_amount = EXCLUDED.available_amount,
        pending_amount = EXCLUDED.pending_amount,
        total_earned = EXCLUDED.total_earned,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to request payout
CREATE OR REPLACE FUNCTION request_payout(
    user_uuid UUID,
    amount_cents INTEGER,
    payment_method_uuid UUID,
    description_text TEXT DEFAULT 'Balance withdrawal'
)
RETURNS UUID AS $$
DECLARE
    balance_data RECORD;
    payout_id UUID;
BEGIN
    -- Check user balance
    SELECT * INTO balance_data FROM calculate_user_balance(user_uuid);
    
    IF balance_data.available_amount < amount_cents THEN
        RAISE EXCEPTION 'Insufficient balance. Available: %, Requested: %', 
            balance_data.available_amount, amount_cents;
    END IF;
    
    -- Create payout request
    INSERT INTO payouts (
        user_id, 
        payment_method_id, 
        amount, 
        amount_requested,
        currency,
        status,
        description,
        requested_at
    ) VALUES (
        user_uuid,
        payment_method_uuid,
        amount_cents,
        amount_cents,
        'usd',
        'pending',
        description_text,
        now()
    ) RETURNING id INTO payout_id;
    
    -- Update user balance
    PERFORM update_user_balance(user_uuid);
    
    RETURN payout_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Insert some sample payment methods and balances for development
DO $$ 
DECLARE 
    sample_user_id UUID;
BEGIN
    -- Get a sample user ID (first creator)
    SELECT id INTO sample_user_id 
    FROM public.users 
    WHERE role = 'CREATOR' 
    LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- Insert sample payment methods
        INSERT INTO payment_methods (user_id, type, name, details, is_default, is_verified) VALUES
        (sample_user_id, 'bank_transfer', 'Chase Bank', '{"account_number": "****1234", "routing_number": "****5678", "account_type": "checking"}', true, true),
        (sample_user_id, 'paypal', 'PayPal', '{"email": "creator@example.com"}', false, true),
        (sample_user_id, 'stripe', 'Debit Card', '{"last4": "5678", "brand": "visa"}', false, false)
        ON CONFLICT DO NOTHING;
        
        -- Initialize user balance
        PERFORM update_user_balance(sample_user_id);
    END IF;
END $$;
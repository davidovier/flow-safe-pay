-- Create enum for deliverable status
DO $$ BEGIN
    CREATE TYPE deliverable_status AS ENUM ('pending', 'submitted', 'approved', 'rejected', 'revision_requested');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enhanced deliverables table with all necessary fields
ALTER TABLE public.deliverables 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status deliverable_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS submission_title TEXT,
ADD COLUMN IF NOT EXISTS submission_description TEXT,
ADD COLUMN IF NOT EXISTS submission_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS mime_type TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES public.users(id);

-- Create deliverable_revisions table for revision history
CREATE TABLE IF NOT EXISTS deliverable_revisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    title TEXT,
    description TEXT,
    submission_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create deliverable_files table for multiple file support
CREATE TABLE IF NOT EXISTS deliverable_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deliverable_id UUID NOT NULL REFERENCES public.deliverables(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE deliverable_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverable_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deliverable_revisions
CREATE POLICY "Users can view revisions for their deliverables" ON deliverable_revisions
    FOR SELECT USING (
        deliverable_id IN (
            SELECT d.id FROM public.deliverables d
            JOIN public.milestones m ON d.milestone_id = m.id
            JOIN public.deals deal ON m.deal_id = deal.id
            WHERE deal.creator_id = auth.uid() OR 
            deal.project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
        )
    );

CREATE POLICY "Creators can create revisions for their deliverables" ON deliverable_revisions
    FOR INSERT WITH CHECK (
        deliverable_id IN (
            SELECT d.id FROM public.deliverables d
            JOIN public.milestones m ON d.milestone_id = m.id
            JOIN public.deals deal ON m.deal_id = deal.id
            WHERE deal.creator_id = auth.uid()
        )
    );

-- RLS Policies for deliverable_files
CREATE POLICY "Users can view files for their deliverables" ON deliverable_files
    FOR SELECT USING (
        deliverable_id IN (
            SELECT d.id FROM public.deliverables d
            JOIN public.milestones m ON d.milestone_id = m.id
            JOIN public.deals deal ON m.deal_id = deal.id
            WHERE deal.creator_id = auth.uid() OR 
            deal.project_id IN (SELECT id FROM public.projects WHERE brand_id = auth.uid())
        )
    );

CREATE POLICY "Creators can manage files for their deliverables" ON deliverable_files
    FOR ALL USING (
        deliverable_id IN (
            SELECT d.id FROM public.deliverables d
            JOIN public.milestones m ON d.milestone_id = m.id
            JOIN public.deals deal ON m.deal_id = deal.id
            WHERE deal.creator_id = auth.uid()
        )
    );

-- Add triggers for new tables
CREATE TRIGGER update_deliverable_revisions_updated_at 
    BEFORE UPDATE ON deliverable_revisions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliverable_files_updated_at 
    BEFORE UPDATE ON deliverable_files
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get deliverables for a creator with full context
CREATE OR REPLACE FUNCTION get_creator_deliverables(creator_uuid UUID)
RETURNS TABLE(
    deliverable_id UUID,
    deliverable_title TEXT,
    deliverable_description TEXT,
    deliverable_due_at TIMESTAMPTZ,
    deliverable_status deliverable_status,
    deliverable_submitted_at TIMESTAMPTZ,
    deliverable_feedback TEXT,
    milestone_id UUID,
    milestone_title TEXT,
    milestone_amount INTEGER,
    milestone_due_at TIMESTAMPTZ,
    deal_id UUID,
    deal_amount_total INTEGER,
    project_id UUID,
    project_title TEXT,
    brand_id UUID,
    brand_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id as deliverable_id,
        d.title as deliverable_title,
        d.description as deliverable_description,
        d.due_at as deliverable_due_at,
        d.status as deliverable_status,
        d.submitted_at as deliverable_submitted_at,
        d.feedback as deliverable_feedback,
        m.id as milestone_id,
        m.title as milestone_title,
        m.amount as milestone_amount,
        m.due_at as milestone_due_at,
        deal.id as deal_id,
        deal.amount_total as deal_amount_total,
        p.id as project_id,
        p.title as project_title,
        u.id as brand_id,
        CONCAT(u.first_name, ' ', u.last_name) as brand_name
    FROM public.deliverables d
    JOIN public.milestones m ON d.milestone_id = m.id
    JOIN public.deals deal ON m.deal_id = deal.id
    JOIN public.projects p ON deal.project_id = p.id
    JOIN public.users u ON p.brand_id = u.id
    WHERE deal.creator_id = creator_uuid
    ORDER BY d.due_at ASC NULLS LAST, d.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to submit a deliverable
CREATE OR REPLACE FUNCTION submit_deliverable(
    deliverable_uuid UUID,
    submission_title_text TEXT,
    submission_description_text TEXT,
    submission_url_text TEXT DEFAULT NULL,
    file_name_text TEXT DEFAULT NULL,
    file_size_int INTEGER DEFAULT NULL,
    mime_type_text TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    revision_id UUID;
BEGIN
    -- Check if deliverable belongs to the current user
    IF NOT EXISTS (
        SELECT 1 FROM public.deliverables d
        JOIN public.milestones m ON d.milestone_id = m.id
        JOIN public.deals deal ON m.deal_id = deal.id
        WHERE d.id = deliverable_uuid AND deal.creator_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Deliverable not found or access denied';
    END IF;
    
    -- Update deliverable status and submission info
    UPDATE public.deliverables SET
        status = 'submitted',
        submission_title = submission_title_text,
        submission_description = submission_description_text,
        submission_url = submission_url_text,
        file_name = file_name_text,
        file_size = file_size_int,
        mime_type = mime_type_text,
        submitted_at = now(),
        updated_at = now()
    WHERE id = deliverable_uuid;
    
    -- Create revision record
    INSERT INTO deliverable_revisions (
        deliverable_id,
        title,
        description,
        submission_url,
        file_name,
        file_size,
        mime_type,
        submitted_at
    ) VALUES (
        deliverable_uuid,
        submission_title_text,
        submission_description_text,
        submission_url_text,
        file_name_text,
        file_size_int,
        mime_type_text,
        now()
    ) RETURNING id INTO revision_id;
    
    RETURN revision_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to approve/reject deliverable (for brands)
CREATE OR REPLACE FUNCTION review_deliverable(
    deliverable_uuid UUID,
    action TEXT, -- 'approve', 'reject', 'request_revision'
    feedback_text TEXT DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    new_status deliverable_status;
BEGIN
    -- Validate action
    IF action NOT IN ('approve', 'reject', 'request_revision') THEN
        RAISE EXCEPTION 'Invalid action. Must be approve, reject, or request_revision';
    END IF;
    
    -- Check if deliverable belongs to a project owned by current user (brand)
    IF NOT EXISTS (
        SELECT 1 FROM public.deliverables d
        JOIN public.milestones m ON d.milestone_id = m.id
        JOIN public.deals deal ON m.deal_id = deal.id
        JOIN public.projects p ON deal.project_id = p.id
        WHERE d.id = deliverable_uuid AND p.brand_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Deliverable not found or access denied';
    END IF;
    
    -- Set new status based on action
    new_status := CASE action
        WHEN 'approve' THEN 'approved'::deliverable_status
        WHEN 'reject' THEN 'rejected'::deliverable_status
        WHEN 'request_revision' THEN 'revision_requested'::deliverable_status
    END;
    
    -- Update deliverable
    UPDATE public.deliverables SET
        status = new_status,
        feedback = feedback_text,
        approved_by = CASE WHEN action = 'approve' THEN auth.uid() ELSE NULL END,
        approved_at = CASE WHEN action = 'approve' THEN now() ELSE NULL END,
        rejected_at = CASE WHEN action = 'reject' THEN now() ELSE NULL END,
        updated_at = now()
    WHERE id = deliverable_uuid;
    
    -- If approved, update milestone state
    IF action = 'approve' THEN
        UPDATE public.milestones SET
            state = 'APPROVED'
        WHERE id = (
            SELECT milestone_id FROM public.deliverables WHERE id = deliverable_uuid
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create some sample deliverables for development
DO $$ 
DECLARE 
    sample_creator_id UUID;
    sample_deal_id UUID;
    sample_milestone_id UUID;
BEGIN
    -- Get a sample creator and deal
    SELECT deal.creator_id, deal.id INTO sample_creator_id, sample_deal_id
    FROM public.deals deal
    WHERE deal.creator_id IS NOT NULL 
    LIMIT 1;
    
    IF sample_creator_id IS NOT NULL THEN
        -- Create a milestone for the deal
        INSERT INTO public.milestones (deal_id, title, amount, due_at, state)
        VALUES (
            sample_deal_id,
            'Instagram Reel Creation',
            50000, -- $500 in cents
            now() + interval '7 days',
            'PENDING'
        )
        RETURNING id INTO sample_milestone_id;
        
        -- Create sample deliverables
        INSERT INTO public.deliverables (
            milestone_id, 
            title, 
            description, 
            due_at, 
            status,
            creator_id
        ) VALUES 
        (
            sample_milestone_id,
            'Instagram Reel - Product Demo',
            'Create a 30-second Instagram reel showcasing the product features with engaging transitions and clear call-to-action',
            now() + interval '5 days',
            'pending',
            sample_creator_id
        ),
        (
            sample_milestone_id,
            'Thumbnail Images',
            'Design 3 different thumbnail options for the Instagram reel with product focus',
            now() + interval '3 days',
            'pending',
            sample_creator_id
        )
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
-- Migration: Add scheduling to campaigns
ALTER TABLE public.campaigns
ADD COLUMN scheduled_for TIMESTAMP WITH TIME ZONE,
ADD COLUMN status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Update existing records to ensure they have the new status column properly set
UPDATE public.campaigns SET status = 'completed' WHERE status IS NULL;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'new_customer', 'stamp_earned', 'reward_redeemed'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    customer_id UUID REFERENCES public.customers(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their organization's notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() IN (
    SELECT id FROM public.users WHERE organization_id = notifications.organization_id
));

CREATE POLICY "Users can update their organization's notifications (to mark as read)" 
ON public.notifications FOR UPDATE
USING (auth.uid() IN (
    SELECT id FROM public.users WHERE organization_id = notifications.organization_id
));

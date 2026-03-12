-- Create web push subscriptions table
CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_used_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for push_subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public to insert (since customers on POS might subscribe without auth)
-- Alternatively, if only linked customers subscribe, we can restrict it.
-- We'll allow insert with anon/service key or authenticated user
CREATE POLICY "Enable insert for authenticated users and anon" ON push_subscriptions
    FOR INSERT WITH CHECK (true);

-- Allow admins to read their organization's subscriptions
CREATE POLICY "Admins can view org subscriptions" ON push_subscriptions
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
    ));

CREATE INDEX idx_push_sub_org ON push_subscriptions(organization_id);
CREATE INDEX idx_push_sub_customer ON push_subscriptions(customer_id);

-- Add date_of_birth to customers
ALTER TABLE customers ADD COLUMN date_of_birth DATE;

-- Create campaigns table for marketing push notifications
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    target_audience TEXT NOT NULL DEFAULT 'all', -- 'all', 'active', 'inactive', 'birthday'
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    sent_at TIMESTAMPTZ DEFAULT now(),
    success_count INT DEFAULT 0,
    failure_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaigns for their organization" ON campaigns
    FOR SELECT USING (organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can create campaigns for their organization" ON campaigns
    FOR INSERT WITH CHECK (organization_id IN (
        SELECT organization_id FROM users WHERE users.id = auth.uid()
    ));

CREATE INDEX idx_campaigns_organization_id ON campaigns(organization_id);

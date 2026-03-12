-- Wallet Module Tables

-- 1. Wallet Providers Config (Generic foundation for Google and Apple)
CREATE TABLE wallet_providers_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'apple')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, provider)
);

-- 2. Google Wallet Classes (LoyaltyClass)
CREATE TABLE wallet_google_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL UNIQUE, -- The ID in Google's system: [IssuerId].[ProgramId]
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    brand_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Google Wallet Objects (LoyaltyObject)
CREATE TABLE wallet_google_objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    program_id UUID REFERENCES loyalty_programs(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    object_id TEXT NOT NULL UNIQUE, -- The ID in Google's system: [IssuerId].[CustomerAutoId]
    state TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active', 'inactive')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(customer_id, program_id)
);

-- Enable RLS
ALTER TABLE wallet_providers_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_google_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_google_objects ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_wallet_providers_org ON wallet_providers_config(org_id);
CREATE INDEX idx_wallet_google_classes_org ON wallet_google_classes(org_id);
CREATE INDEX idx_wallet_google_objects_customer ON wallet_google_objects(customer_id);
CREATE INDEX idx_wallet_google_objects_org ON wallet_google_objects(org_id);

-- RLS Policies

-- wallet_providers_config: Only org admins (owners/managers)
CREATE POLICY "Org admins can manage wallet configs" ON wallet_providers_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.organization_id = wallet_providers_config.org_id
            AND users.role IN ('owner', 'manager')
        )
    );

-- wallet_google_classes: Org admins manage, others read?
CREATE POLICY "Org admins can manage google classes" ON wallet_google_classes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.organization_id = wallet_google_classes.org_id
            AND users.role IN ('owner', 'manager')
        )
    );

CREATE POLICY "Everyone within org can read google classes" ON wallet_google_classes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.organization_id = wallet_google_classes.org_id
        )
    );

-- wallet_google_objects: Org admins manage, customers read their own
CREATE POLICY "Employees can manage google objects" ON wallet_google_objects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.organization_id = wallet_google_objects.org_id
        )
    );

CREATE POLICY "Customers can read their own google objects" ON wallet_google_objects
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM customers WHERE id = wallet_google_objects.customer_id)
    );

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallet_providers_config_updated_at BEFORE UPDATE ON wallet_providers_config FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_wallet_google_classes_updated_at BEFORE UPDATE ON wallet_google_classes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_wallet_google_objects_updated_at BEFORE UPDATE ON wallet_google_objects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

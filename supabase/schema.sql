-- ============================================================
-- GOYALTY - Multi-Tenant SaaS Digital Loyalty Platform
-- Full Database Schema with RLS Policies
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SUBSCRIPTIONS (SaaS Plans)
-- ============================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- 'free', 'pro', 'enterprise'
  display_name TEXT NOT NULL,
  max_customers INTEGER,                 -- NULL = unlimited
  max_branches INTEGER DEFAULT 1,
  max_employees INTEGER DEFAULT 5,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default subscription plans
INSERT INTO subscriptions (name, display_name, max_customers, max_branches, max_employees, price_monthly, price_yearly, features) VALUES
  ('free',       'Free',       100,  1,   3,     0,     0,     '["1 branch", "Up to 100 customers", "Basic analytics"]'),
  ('pro',        'Pro',        NULL, 5,   25,    49,    490,   '["5 branches", "Unlimited customers", "Advanced analytics", "Custom card design", "Push notifications"]'),
  ('enterprise', 'Enterprise', NULL, NULL, NULL, 199,   1990,  '["Unlimited branches", "Unlimited customers", "Full analytics", "Priority support", "API access", "White-label"]');

-- ============================================================
-- ORGANIZATIONS (Tenants)
-- ============================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  subscription_id UUID REFERENCES subscriptions(id),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'cancelled', 'trial')),
  subscription_expires_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  owner_id UUID,                         -- references auth.users
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_subscription_id ON organizations(subscription_id);

-- ============================================================
-- BRANCHES
-- ============================================================
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  qr_code TEXT UNIQUE,                    -- Branch-level QR code identifier
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_branches_organization_id ON branches(organization_id);
CREATE INDEX idx_branches_qr_code ON branches(qr_code);

-- ============================================================
-- USERS (Staff – linked to Supabase auth.users)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'owner', 'manager', 'employee')),
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- LOYALTY PROGRAMS
-- ============================================================
CREATE TABLE loyalty_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Loyalty Program',
  type TEXT NOT NULL DEFAULT 'stamps' CHECK (type IN ('stamps', 'points')),
  
  -- Stamps config
  stamps_required INTEGER DEFAULT 10,
  
  -- Points config
  points_per_currency_unit DECIMAL(10,4) DEFAULT 1.0,
  currency_unit TEXT DEFAULT 'USD',
  
  -- Expiration
  points_expiry_days INTEGER,            -- NULL = never expire
  stamps_expiry_days INTEGER,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_programs_organization_id ON loyalty_programs(organization_id);

-- ============================================================
-- REWARDS
-- ============================================================
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  loyalty_program_id UUID NOT NULL REFERENCES loyalty_programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('free_item', 'percentage_discount', 'fixed_discount', 'custom')),
  value DECIMAL(10,2),                    -- percentage or fixed amount
  
  -- Redemption cost
  stamps_required INTEGER,               -- for stamp-based
  points_required INTEGER,               -- for points-based
  
  image_url TEXT,
  terms TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rewards_organization_id ON rewards(organization_id);
CREATE INDEX idx_rewards_loyalty_program_id ON rewards(loyalty_program_id);

-- ============================================================
-- BONUS REWARDS
-- ============================================================
CREATE TABLE bonus_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('google_review', 'enable_notifications', 'social_follow', 'other')),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('stamps', 'points')),
  reward_value INTEGER NOT NULL DEFAULT 1,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, type)
);

CREATE INDEX idx_bonus_rewards_organization_id ON bonus_rewards(organization_id);

CREATE TABLE customer_bonus_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
  bonus_reward_id UUID NOT NULL REFERENCES bonus_rewards(id) ON DELETE CASCADE,
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, branch_id, bonus_reward_id)
);

CREATE INDEX idx_customer_bonus_claims_customer_id ON customer_bonus_claims(customer_id);


-- ============================================================
-- CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id),  -- if customer has app account
  
  -- Identity
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  
  -- Public token for QR code (customer wallet URL)
  public_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  
  -- Loyalty balance
  total_stamps INTEGER DEFAULT 0,
  available_stamps INTEGER DEFAULT 0,
  total_points DECIMAL(12,2) DEFAULT 0,
  available_points DECIMAL(12,2) DEFAULT 0,
  
  -- Stats
  total_visits INTEGER DEFAULT 0,
  total_redeemed INTEGER DEFAULT 0,
  last_visit_at TIMESTAMPTZ,
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_organization_id ON customers(organization_id);
CREATE INDEX idx_customers_public_token ON customers(public_token);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_auth_user_id ON customers(auth_user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  loyalty_program_id UUID REFERENCES loyalty_programs(id),
  
  -- Staff who processed
  processed_by UUID REFERENCES users(id),
  
  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('earn_stamp', 'earn_points', 'redeem_reward', 'manual_adjust', 'expire')),
  
  -- Stamp transaction
  stamps_earned INTEGER DEFAULT 0,
  stamps_redeemed INTEGER DEFAULT 0,
  stamps_balance_after INTEGER,
  
  -- Points transaction
  points_earned DECIMAL(12,2) DEFAULT 0,
  points_redeemed DECIMAL(12,2) DEFAULT 0,
  points_balance_after DECIMAL(12,2),
  
  -- Reward redemption
  reward_id UUID REFERENCES rewards(id),
  reward_snapshot JSONB,                  -- snapshot of reward at time of redemption
  
  -- Purchase details (optional)
  purchase_amount DECIMAL(10,2),
  reference_number TEXT,
  
  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Push notification sent
  push_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_organization_id ON transactions(organization_id);
CREATE INDEX idx_transactions_branch_id ON transactions(branch_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ============================================================
-- CARD DESIGNS
-- ============================================================
CREATE TABLE card_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Visual config stored as JSON
  config JSONB NOT NULL DEFAULT '{
    "backgroundType": "gradient",
    "backgroundColor": "#1a1a2e",
    "gradientFrom": "#16213e",
    "gradientTo": "#0f3460",
    "gradientAngle": 135,
    "accentColor": "#e94560",
    "textColor": "#ffffff",
    "brandName": "My Loyalty",
    "logoUrl": null,
    "fontFamily": "Inter",
    "progressBarStyle": "rounded",
    "progressBarColor": "#e94560",
    "cardBorderRadius": 16,
    "showBranchName": true
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STAMP DESIGNS
-- ============================================================
CREATE TABLE stamp_designs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  
  config JSONB NOT NULL DEFAULT '{
    "iconType": "star",
    "iconUrl": null,
    "filledColor": "#e94560",
    "emptyColor": "#ffffff30",
    "filledAnimation": "bounce",
    "emptyStyle": "outline",
    "size": "medium",
    "labelText": "Stamps"
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PUSH TOKENS (FCM)
-- ============================================================
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT DEFAULT 'web',
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, organization_id, token)
);

CREATE INDEX idx_push_tokens_customer_id ON push_tokens(customer_id);
CREATE INDEX idx_push_tokens_organization_id ON push_tokens(organization_id);
CREATE INDEX idx_push_tokens_token ON push_tokens(token);

-- ============================================================
-- ANALYTICS SNAPSHOTS (Pre-computed for performance)
-- ============================================================
CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id),
  snapshot_date DATE NOT NULL,
  
  -- Metrics
  new_customers INTEGER DEFAULT 0,
  active_customers INTEGER DEFAULT 0,
  total_stamps_earned INTEGER DEFAULT 0,
  total_points_earned DECIMAL(12,2) DEFAULT 0,
  total_rewards_redeemed INTEGER DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, branch_id, snapshot_date)
);

CREATE INDEX idx_analytics_snapshots_organization_id ON analytics_snapshots(organization_id);
CREATE INDEX idx_analytics_snapshots_snapshot_date ON analytics_snapshots(snapshot_date DESC);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_card_designs_updated_at BEFORE UPDATE ON card_designs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stamp_designs_updated_at BEFORE UPDATE ON stamp_designs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's organization
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id FROM public.users WHERE id = auth.uid();
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM public.users WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stamp_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- ---- SUBSCRIPTIONS ----
CREATE POLICY "Anyone can read subscriptions" ON subscriptions FOR SELECT USING (TRUE);
CREATE POLICY "Super admin manages subscriptions" ON subscriptions FOR ALL USING (public.is_super_admin());

-- ---- ORGANIZATIONS ----
CREATE POLICY "Super admin sees all orgs" ON organizations FOR ALL USING (public.is_super_admin());
CREATE POLICY "Org members see own org" ON organizations FOR SELECT
  USING (id = public.get_user_org_id());
CREATE POLICY "Org owner updates own org" ON organizations FOR UPDATE
  USING (id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));

-- ---- BRANCHES ----
CREATE POLICY "Super admin manages all branches" ON branches FOR ALL USING (public.is_super_admin());
CREATE POLICY "Org members see own branches" ON branches FOR SELECT
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "Owner/manager manages branches" ON branches FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));

-- ---- USERS ----
CREATE POLICY "Super admin sees all users" ON users FOR ALL USING (public.is_super_admin());
CREATE POLICY "Users see own record" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Org members see org users" ON users FOR SELECT
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "Owner/manager manages users" ON users FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));
CREATE POLICY "User updates own record" ON users FOR UPDATE USING (id = auth.uid());

-- ---- LOYALTY PROGRAMS ----
CREATE POLICY "Super admin sees all programs" ON loyalty_programs FOR ALL USING (public.is_super_admin());
CREATE POLICY "Org members see own programs" ON loyalty_programs FOR SELECT
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "Owner/manager manages programs" ON loyalty_programs FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));

-- ---- REWARDS ----
CREATE POLICY "Super admin manages all rewards" ON rewards FOR ALL USING (public.is_super_admin());
CREATE POLICY "Org members see rewards" ON rewards FOR SELECT
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "Owner/manager manages rewards" ON rewards FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));

-- ---- CUSTOMERS ----
CREATE POLICY "Super admin sees all customers" ON customers FOR ALL USING (public.is_super_admin());
CREATE POLICY "Org staff see org customers" ON customers FOR SELECT
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "Employees can create customers" ON customers FOR INSERT
  WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Owner/manager manages customers" ON customers FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));
CREATE POLICY "Customer sees own record via token" ON customers FOR SELECT
  USING (auth_user_id = auth.uid());

-- ---- TRANSACTIONS ----
CREATE POLICY "Super admin sees all transactions" ON transactions FOR ALL USING (public.is_super_admin());
CREATE POLICY "Org staff see org transactions" ON transactions FOR SELECT
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "Employees create transactions" ON transactions FOR INSERT
  WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Customer sees own transactions" ON transactions FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));

-- ---- CARD DESIGNS ----
CREATE POLICY "Public can read card designs" ON card_designs FOR SELECT USING (TRUE);
CREATE POLICY "Owner/manager manages card design" ON card_designs FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));
CREATE POLICY "Super admin manages all card designs" ON card_designs FOR ALL USING (public.is_super_admin());

-- ---- STAMP DESIGNS ----
CREATE POLICY "Public can read stamp designs" ON stamp_designs FOR SELECT USING (TRUE);
CREATE POLICY "Owner/manager manages stamp design" ON stamp_designs FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));
CREATE POLICY "Super admin manages all stamp designs" ON stamp_designs FOR ALL USING (public.is_super_admin());

-- ---- PUSH TOKENS ----
CREATE POLICY "Org staff see push tokens" ON push_tokens FOR SELECT
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "Customer manages own push tokens" ON push_tokens FOR ALL
  USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));
CREATE POLICY "Super admin manages push tokens" ON push_tokens FOR ALL USING (public.is_super_admin());

-- ---- ANALYTICS SNAPSHOTS ----
CREATE POLICY "Super admin sees all analytics" ON analytics_snapshots FOR ALL USING (public.is_super_admin());
CREATE POLICY "Org staff see own analytics" ON analytics_snapshots FOR SELECT
  USING (organization_id = public.get_user_org_id());
CREATE POLICY "System inserts analytics" ON analytics_snapshots FOR INSERT
  WITH CHECK (organization_id = public.get_user_org_id());

-- ---- BONUS REWARDS ----
ALTER TABLE bonus_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages all bonus rewards" ON bonus_rewards FOR ALL USING (public.is_super_admin());
CREATE POLICY "Public sees bonus rewards" ON bonus_rewards FOR SELECT USING (TRUE);
CREATE POLICY "Owner/manager manages bonus rewards" ON bonus_rewards FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));

-- ---- BONUS CLAIMS ----
ALTER TABLE customer_bonus_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages all claims" ON customer_bonus_claims FOR ALL USING (public.is_super_admin());
CREATE POLICY "Customer sees own claims" ON customer_bonus_claims FOR SELECT
  USING (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));
CREATE POLICY "Customer inserts own claims" ON customer_bonus_claims FOR INSERT
  WITH CHECK (customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid()));
CREATE POLICY "Org staff see claims" ON customer_bonus_claims FOR SELECT
  USING (bonus_reward_id IN (SELECT id FROM bonus_rewards WHERE organization_id = public.get_user_org_id()));

-- ============================================================
-- NFC CARDS (Physical NFC card ↔ customer mapping)
-- ============================================================
CREATE TABLE nfc_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  nfc_uid TEXT NOT NULL,                   -- NFC chip UID (e.g. "04AABB9923")
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  linked_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, nfc_uid)
);

CREATE INDEX idx_nfc_cards_organization_id ON nfc_cards(organization_id);
CREATE INDEX idx_nfc_cards_customer_id ON nfc_cards(customer_id);
CREATE INDEX idx_nfc_cards_nfc_uid ON nfc_cards(nfc_uid);
CREATE INDEX idx_nfc_cards_status ON nfc_cards(status);

CREATE TRIGGER update_nfc_cards_updated_at BEFORE UPDATE ON nfc_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE nfc_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admin manages all nfc cards" ON nfc_cards FOR ALL USING (public.is_super_admin());
CREATE POLICY "Org staff see own nfc cards" ON nfc_cards FOR SELECT USING (organization_id = public.get_user_org_id());
CREATE POLICY "Org staff create nfc cards" ON nfc_cards FOR INSERT WITH CHECK (organization_id = public.get_user_org_id());
CREATE POLICY "Owner/manager manages nfc cards" ON nfc_cards FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));
CREATE POLICY "Employees can update nfc cards" ON nfc_cards FOR UPDATE USING (organization_id = public.get_user_org_id());

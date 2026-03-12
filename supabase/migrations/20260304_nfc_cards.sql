-- ============================================================
-- NFC CARDS TABLE
-- Maps physical NFC card UIDs to customers
-- ============================================================

CREATE TABLE nfc_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  nfc_uid TEXT NOT NULL,
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

-- updated_at trigger
CREATE TRIGGER update_nfc_cards_updated_at
  BEFORE UPDATE ON nfc_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE nfc_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admin manages all nfc cards"
  ON nfc_cards FOR ALL USING (public.is_super_admin());

CREATE POLICY "Org staff see own nfc cards"
  ON nfc_cards FOR SELECT
  USING (organization_id = public.get_user_org_id());

CREATE POLICY "Org staff create nfc cards"
  ON nfc_cards FOR INSERT
  WITH CHECK (organization_id = public.get_user_org_id());

CREATE POLICY "Owner/manager manages nfc cards"
  ON nfc_cards FOR ALL
  USING (organization_id = public.get_user_org_id() AND get_user_role() IN ('owner', 'manager'));

CREATE POLICY "Employees can update nfc cards"
  ON nfc_cards FOR UPDATE
  USING (organization_id = public.get_user_org_id());

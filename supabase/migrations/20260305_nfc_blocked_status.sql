-- ============================================================
-- Add 'blocked' status to NFC cards
-- ============================================================

ALTER TABLE nfc_cards DROP CONSTRAINT nfc_cards_status_check;
ALTER TABLE nfc_cards ADD CONSTRAINT nfc_cards_status_check
  CHECK (status IN ('active', 'inactive', 'blocked'));

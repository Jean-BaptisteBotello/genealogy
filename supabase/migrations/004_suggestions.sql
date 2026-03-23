-- supabase/migrations/004_suggestions.sql

CREATE TYPE suggestion_type AS ENUM (
  'EDIT_PERSON', 'ADD_PERSON', 'DELETE_PERSON',
  'ADD_RELATIONSHIP', 'DELETE_RELATIONSHIP'
);

CREATE TYPE suggestion_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE suggestion (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type             suggestion_type NOT NULL,
  target_id        UUID,
  payload          JSONB NOT NULL DEFAULT '{}',
  status           suggestion_status NOT NULL DEFAULT 'PENDING',
  suggested_by     UUID NOT NULL REFERENCES auth.users(id),
  reviewed_by      UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ
);

CREATE INDEX suggestion_status_idx ON suggestion(status);
CREATE INDEX suggestion_suggested_by_idx ON suggestion(suggested_by);

-- Anti-doublon pour EDIT/DELETE (target_id non null)
CREATE UNIQUE INDEX suggestion_no_duplicate_pending
  ON suggestion (suggested_by, type, target_id)
  WHERE status = 'PENDING' AND target_id IS NOT NULL;

ALTER TABLE suggestion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "suggestion_insert" ON suggestion
  FOR INSERT WITH CHECK (auth.uid() = suggested_by);

CREATE POLICY "suggestion_select_own" ON suggestion
  FOR SELECT USING (auth.uid() = suggested_by);

CREATE POLICY "suggestion_select_reviewers" ON suggestion
  FOR SELECT USING (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY "suggestion_update_reviewers" ON suggestion
  FOR UPDATE USING (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY "suggestion_delete_own_pending" ON suggestion
  FOR DELETE USING (
    auth.uid() = suggested_by AND status = 'PENDING'
  );

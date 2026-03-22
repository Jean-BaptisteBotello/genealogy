-- supabase/migrations/002_rls_policies.sql

-- Enable RLS on all tables
ALTER TABLE person ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_branch ENABLE ROW LEVEL SECURITY;
ALTER TABLE document ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_member ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS member_role AS $$
  SELECT role FROM tree_member WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PERSON policies
CREATE POLICY person_select ON person FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

CREATE POLICY person_insert ON person FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY person_update ON person FOR UPDATE
  USING (current_user_role() IN ('ADMIN', 'EDITOR'))
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY person_delete ON person FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- RELATIONSHIP policies
CREATE POLICY relationship_select ON relationship FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

CREATE POLICY relationship_insert ON relationship FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY relationship_update ON relationship FOR UPDATE
  USING (current_user_role() IN ('ADMIN', 'EDITOR'))
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY relationship_delete ON relationship FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- BRANCH policies
CREATE POLICY branch_select ON branch FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

CREATE POLICY branch_insert ON branch FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY branch_update ON branch FOR UPDATE
  USING (current_user_role() IN ('ADMIN', 'EDITOR'))
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY branch_delete ON branch FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- PERSON_BRANCH policies
CREATE POLICY person_branch_select ON person_branch FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

CREATE POLICY person_branch_insert ON person_branch FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY person_branch_delete ON person_branch FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- DOCUMENT policies
CREATE POLICY document_select ON document FOR SELECT
  USING (EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid()));

CREATE POLICY document_insert ON document FOR INSERT
  WITH CHECK (current_user_role() IN ('ADMIN', 'EDITOR'));

CREATE POLICY document_delete ON document FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- TREE_MEMBER policies
CREATE POLICY tree_member_select ON tree_member FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY tree_member_insert ON tree_member FOR INSERT
  WITH CHECK (current_user_role() = 'ADMIN');

CREATE POLICY tree_member_update ON tree_member FOR UPDATE
  USING (current_user_role() = 'ADMIN')
  WITH CHECK (current_user_role() = 'ADMIN');

CREATE POLICY tree_member_delete ON tree_member FOR DELETE
  USING (current_user_role() = 'ADMIN');

-- supabase/migrations/003_storage_bucket.sql

-- DEPENDS ON: 002_rls_policies.sql must be applied first (uses current_user_role() function)
-- NOTE: PDF MIME type validation (PDF only) must be enforced in application code.
-- DB constraint on document.taille_bytes enforces max 20 Mo.
-- Signed URL expiry (7 days) is configured in application code, not at DB layer.

-- Create the documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Storage RLS: tree members can read
CREATE POLICY documents_read ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (SELECT 1 FROM tree_member WHERE user_id = auth.uid())
  );

-- Storage RLS: EDITOR and ADMIN can upload
CREATE POLICY documents_insert ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND current_user_role() IN ('ADMIN', 'EDITOR')
  );

-- Storage RLS: ADMIN can delete
CREATE POLICY documents_delete ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND current_user_role() = 'ADMIN'
  );

-- supabase/migrations/003_storage_bucket.sql

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

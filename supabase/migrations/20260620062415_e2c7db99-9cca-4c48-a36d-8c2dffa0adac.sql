CREATE POLICY "Authenticated users can upload issue images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'issue-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can view issue images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'issue-images');

CREATE POLICY "Users can delete their own issue images"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'issue-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
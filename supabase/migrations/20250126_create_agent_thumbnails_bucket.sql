-- Create storage bucket for agent thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-thumbnails',
  'agent-thumbnails',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload agent thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public can view agent thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete agent thumbnails" ON storage.objects;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload agent thumbnails"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-thumbnails');

-- Allow public read access
CREATE POLICY "Public can view agent thumbnails"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'agent-thumbnails');

-- Allow admins to delete
CREATE POLICY "Admins can delete agent thumbnails"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'agent-thumbnails' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Créer le bucket avatars (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  3145728, -- 3 Mo
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Policy : chaque utilisateur peut uploader/modifier seulement son propre fichier
CREATE POLICY "Avatar upload own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    name = 'avatars/' || auth.uid() || '.' || (storage.extension(name))
  );

CREATE POLICY "Avatar update own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    owner = auth.uid()
  );

-- Policy : lecture publique des avatars
CREATE POLICY "Avatar public read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

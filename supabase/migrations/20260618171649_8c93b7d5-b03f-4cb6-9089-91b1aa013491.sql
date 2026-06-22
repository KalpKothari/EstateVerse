
-- Tighten search_path on touch_updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Lock down SECURITY DEFINER functions: only triggers / internal use
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- has_role still needs to be callable by authenticated users (used in policies + UI checks)
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Storage policies: property-images (private, owners write, signed URLs for read)
CREATE POLICY "Anyone authenticated can read property images"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'property-images');
CREATE POLICY "Owners upload property images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners update own property images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owners delete own property images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Avatars
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'avatars');
CREATE POLICY "Users manage own avatar"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Verification docs (private, owner-only read)
CREATE POLICY "Users read own verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users upload own verification docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own verification docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

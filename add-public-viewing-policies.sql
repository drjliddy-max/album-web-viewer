-- Add Public Viewing Policies for Album Web Viewer
-- This adds public read-only access for shared albums WITHOUT affecting existing authenticated policies
-- Run this in Supabase SQL Editor

-- 1. Add public read policy for active shared albums (for unauthenticated web viewers)
CREATE POLICY IF NOT EXISTS "Public can view active shared albums"
ON public.shared_albums FOR SELECT
TO anon  -- anonymous (unauthenticated) users
USING (is_active = true);

-- 2. Add public read policy for babies (so album viewer can show baby name)
CREATE POLICY IF NOT EXISTS "Public can view babies for shared albums"
ON public.babies FOR SELECT
TO anon
USING (
  -- Only allow if baby is in an active shared album
  id IN (
    SELECT DISTINCT baby_id 
    FROM public.shared_albums 
    WHERE is_active = true
  )
);

-- 3. Add public read policy for photos in shared albums
CREATE POLICY IF NOT EXISTS "Public can view photos in shared albums"
ON public.photos FOR SELECT
TO anon
USING (
  -- Only allow if photo is in an active shared album
  id IN (
    SELECT DISTINCT jsonb_array_elements_text(asset_ids)
    FROM public.shared_albums
    WHERE is_active = true
  )
);

-- 4. Add public read policy for PDFs in shared albums
CREATE POLICY IF NOT EXISTS "Public can view pdfs in shared albums"
ON public.pdfs FOR SELECT
TO anon
USING (
  -- Only allow if PDF is in an active shared album
  id IN (
    SELECT DISTINCT jsonb_array_elements_text(asset_ids)
    FROM public.shared_albums
    WHERE is_active = true
  )
);

-- 5. Create the view count increment function (if not exists)
CREATE OR REPLACE FUNCTION increment_album_view_count(album_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE shared_albums
  SET view_count = view_count + 1
  WHERE id = album_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION increment_album_view_count(UUID) TO anon;

-- 6. Create indexes for better performance on public queries
CREATE INDEX IF NOT EXISTS idx_shared_albums_active_token 
ON public.shared_albums(share_token, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_shared_albums_asset_ids
ON public.shared_albums USING GIN (asset_ids);

-- 7. Verify the policies were created
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('shared_albums', 'babies', 'photos', 'pdfs')
  AND policyname LIKE 'Public can%';
  
  IF policy_count >= 4 THEN
    RAISE NOTICE '✅ Public viewing policies created successfully (% policies)', policy_count;
  ELSE
    RAISE WARNING '⚠️  Only % public policies found, expected 4', policy_count;
  END IF;
  
  RAISE NOTICE '✅ Album web viewer database setup complete!';
END $$;

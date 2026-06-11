-- Beta readiness: keep the live database aligned with the app.

-- Some live projects were created before audio sync was added to campaign_state.
ALTER TABLE public.campaign_state
  ADD COLUMN IF NOT EXISTS audio JSONB DEFAULT '{"url": "", "isPlaying": false, "volume": 50}';

UPDATE public.campaign_state
SET audio = '{"url": "", "isPlaying": false, "volume": 50}'
WHERE audio IS NULL;

-- The old single-row campaign table is no longer part of the main beta flow.
-- If it still exists, keep it locked down so it is not publicly readable.
DO $$
BEGIN
  IF to_regclass('public.campaign') IS NOT NULL THEN
    ALTER TABLE public.campaign ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE public.campaign FROM anon;
    REVOKE ALL ON TABLE public.campaign FROM authenticated;
  END IF;
END $$;

-- Signup trigger hardening: keep a stable search_path and prevent direct API calls.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), NEW.id::text),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), NEW.id::text)
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

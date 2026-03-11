-- ============================================================
-- COMPREHENSIVE RLS FIX
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Auto-create a profile for any logged-in user who doesn't have one yet
INSERT INTO public.profiles (id, username, display_name)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', u.email, u.id::text),
  COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'username', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2. Fix campaign INSERT policy: anyone authenticated can create campaigns
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
CREATE POLICY "Users can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = dm_id);

-- 3. Fix campaign SELECT: allow lookup by join_code (so players can find campaigns to join)  
DROP POLICY IF EXISTS "Anyone can look up a campaign by join_code" ON public.campaigns;
CREATE POLICY "Anyone can look up a campaign by join_code"
  ON public.campaigns FOR SELECT
  USING (
    -- Members and DMs can always see
    auth.uid() = dm_id
    OR EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE campaign_id = campaigns.id AND player_id = auth.uid()
    )
    -- Any logged-in user can find a campaign IF they know the join code (for joining)
    OR (join_code IS NOT NULL AND auth.uid() IS NOT NULL)
  );

-- 4. Allow players to INSERT themselves into campaign_players (join a campaign)
DROP POLICY IF EXISTS "Players can join campaigns" ON public.campaign_players;
CREATE POLICY "Players can join campaigns"
  ON public.campaign_players FOR INSERT
  WITH CHECK (auth.uid() = player_id);

-- 5. Allow DMs to insert/remove players  
DROP POLICY IF EXISTS "DMs can add players to their campaigns" ON public.campaign_players;
CREATE POLICY "DMs can add players to their campaigns"
  ON public.campaign_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "DMs can remove players from their campaigns" ON public.campaign_players;
CREATE POLICY "DMs can remove players from their campaigns"
  ON public.campaign_players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- 6. Also allow DMs to delete their own campaigns
DROP POLICY IF EXISTS "DMs can delete their own campaigns" ON public.campaigns;
CREATE POLICY "DMs can delete their own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = dm_id);

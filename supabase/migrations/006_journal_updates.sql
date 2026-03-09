-- Migration to support image URLs in player journals and update DM access policies
-- Run this in Supabase SQL Editor

-- 1. Add image_url column to player_journals
ALTER TABLE public.player_journals
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Drop existing restrictive policies on player_journals
DROP POLICY IF EXISTS "Players can view their own private journals" ON public.player_journals;
DROP POLICY IF EXISTS "Campaign members can view public journals" ON public.player_journals;
DROP POLICY IF EXISTS "Players can insert their own journals" ON public.player_journals;
DROP POLICY IF EXISTS "Players can update their own journals" ON public.player_journals;
DROP POLICY IF EXISTS "Players can delete their own journals" ON public.player_journals;

-- 3. Create new comprehensive policies supporting DM access

-- SELECT Policy
CREATE POLICY "Journals are viewable by owner, DM, or if public"
  ON public.player_journals FOR SELECT
  USING (
    player_id = auth.uid() OR -- Creator
    is_public = true OR -- Publicly shared
    EXISTS ( -- DM of the campaign
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- INSERT Policy
CREATE POLICY "Users and DMs can insert journals"
  ON public.player_journals FOR INSERT
  WITH CHECK (
    player_id = auth.uid() OR -- User inserting for themselves
    EXISTS ( -- DM inserting for a player
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- UPDATE Policy
CREATE POLICY "Users and DMs can update journals"
  ON public.player_journals FOR UPDATE
  USING (
    player_id = auth.uid() OR -- User updating their own
    EXISTS ( -- DM updating any journal in their campaign
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- DELETE Policy
CREATE POLICY "Users and DMs can delete journals"
  ON public.player_journals FOR DELETE
  USING (
    player_id = auth.uid() OR -- User deleting their own
    EXISTS ( -- DM deleting any journal in their campaign
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

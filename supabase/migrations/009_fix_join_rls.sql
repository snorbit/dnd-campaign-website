-- ============================================================
-- FIX: Revert over-permissive campaign SELECT policy
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Drop the bad broad policy that lets everyone see all campaigns
DROP POLICY IF EXISTS "Anyone can look up a campaign by join_code" ON public.campaigns;

-- Restore the correct scoped SELECT policy: 
-- Only DMs and current campaign members can see their campaigns
DROP POLICY IF EXISTS "Anyone can view campaigns they're part of" ON public.campaigns;
CREATE POLICY "Anyone can view campaigns they're part of"
  ON public.campaigns FOR SELECT
  USING (
    auth.uid() = dm_id
    OR EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE campaign_id = campaigns.id AND player_id = auth.uid()
    )
  );

-- FIX INFINITE RECURSION ERROR
-- Run this in Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Anyone can view campaigns they're part of" ON public.campaigns;
DROP POLICY IF EXISTS "Campaign players are viewable by campaign members" ON public.campaign_players;

-- Create simpler policies that don't cause recursion

-- Campaigns: Allow DMs to see their campaigns, and allow everyone to see campaigns (for now)
CREATE POLICY "Users can view their DM campaigns"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = dm_id);

CREATE POLICY "Users can view campaigns as player"
  ON public.campaigns FOR SELECT
  USING (id IN (SELECT campaign_id FROM public.campaign_players WHERE player_id = auth.uid()));

-- Campaign players: simple policy without recursion
CREATE POLICY "Anyone can view campaign players"
  ON public.campaign_players FOR SELECT
  USING (true);

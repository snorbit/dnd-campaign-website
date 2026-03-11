-- Fix 1: Allow authenticated users to SELECT campaigns by join_code
-- (so players can find a campaign before they're a member)
CREATE POLICY IF NOT EXISTS "Anyone can look up a campaign by join_code"
  ON public.campaigns FOR SELECT
  USING (
    join_code IS NOT NULL AND auth.uid() IS NOT NULL
  );

-- Fix 2: Allow authenticated users to INSERT themselves into campaign_players
-- (so they can actually join after finding the campaign)
CREATE POLICY IF NOT EXISTS "Players can join campaigns"
  ON public.campaign_players FOR INSERT
  WITH CHECK (
    auth.uid() = player_id
  );

-- Fix 3: Allow DMs to insert players into their own campaigns (for DM-side management)
CREATE POLICY IF NOT EXISTS "DMs can add players to their campaigns"
  ON public.campaign_players FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- Fix 4: Allow DMs to delete players from their campaigns
CREATE POLICY IF NOT EXISTS "DMs can remove players from their campaigns"
  ON public.campaign_players FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- Beta friend-test fixes: level rewards, starting inventory saves, and player map tokens.

ALTER TABLE public.campaign_players
  ADD COLUMN IF NOT EXISTS level_choices JSONB DEFAULT '[]';

UPDATE public.campaign_players
SET level_choices = '[]'::jsonb
WHERE level_choices IS NULL;

-- Character creation now inserts starting equipment into player_inventory.
DROP POLICY IF EXISTS "Players can insert their own inventory" ON public.player_inventory;
CREATE POLICY "Players can insert their own inventory"
  ON public.player_inventory FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = player_inventory.campaign_player_id
        AND player_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Players can update their own inventory" ON public.player_inventory;
CREATE POLICY "Players can update their own inventory"
  ON public.player_inventory FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = player_inventory.campaign_player_id
        AND player_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = player_inventory.campaign_player_id
        AND player_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Players can delete their own inventory" ON public.player_inventory;
CREATE POLICY "Players can delete their own inventory"
  ON public.player_inventory FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = player_inventory.campaign_player_id
        AND player_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "DMs can manage campaign player inventories" ON public.player_inventory;
CREATE POLICY "DMs can manage campaign player inventories"
  ON public.player_inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players cp
      JOIN public.campaigns c ON c.id = cp.campaign_id
      WHERE cp.id = player_inventory.campaign_player_id
        AND c.dm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_players cp
      JOIN public.campaigns c ON c.id = cp.campaign_id
      WHERE cp.id = player_inventory.campaign_player_id
        AND c.dm_id = auth.uid()
    )
  );

-- Players need to save pings/token movement in the shared map state.
-- The UI only writes the map JSON, while RLS still keeps this inside campaigns they belong to.
DROP POLICY IF EXISTS "Campaign players can update campaign state" ON public.campaign_state;
CREATE POLICY "Campaign players can update campaign state"
  ON public.campaign_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE campaign_id = campaign_state.campaign_id
        AND player_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE campaign_id = campaign_state.campaign_id
        AND player_id = auth.uid()
    )
  );

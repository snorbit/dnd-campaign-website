-- Migration to add player spellbook tracking
-- Run this in Supabase SQL Editor

-- 1. Create player_spells table
CREATE TABLE public.player_spells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_player_id UUID REFERENCES public.campaign_players(id) ON DELETE CASCADE,
  spell_name TEXT NOT NULL,
  spell_level TEXT NOT NULL,
  slug TEXT NOT NULL, -- Used to fetch full data from Open5e API later
  school TEXT,
  components TEXT,
  prepared BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_player_id, slug) -- A player can only have a spell entered once
);

-- 2. Enable RLS
ALTER TABLE public.player_spells ENABLE ROW LEVEL SECURITY;

-- 3. Add Policies

-- Players can view their own spells and DMs can view any spell in their campaign
CREATE POLICY "Player spells viewable by owner or DM"
  ON public.player_spells FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players cp
      JOIN public.campaigns c ON cp.campaign_id = c.id
      WHERE cp.id = campaign_player_id AND (
        c.dm_id = auth.uid() OR
        cp.player_id = auth.uid()
      )
    )
  );

-- Players can add their own spells
CREATE POLICY "Players can insert their own spells"
  ON public.player_spells FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  );

-- Players can update their own spells (e.g. prepared status)
CREATE POLICY "Players can update their own spells"
  ON public.player_spells FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  );

-- Players can delete their own spells
CREATE POLICY "Players can delete their own spells"
  ON public.player_spells FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  );

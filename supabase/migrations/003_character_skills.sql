-- Character Skills and Spells Migration
-- Run this in Supabase SQL Editor

-- Add skills and proficiencies to character_stats
ALTER TABLE public.character_stats
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '{
  "acrobatics": {"proficient": false, "expertise": false},
  "animal_handling": {"proficient": false, "expertise": false},
  "arcana": {"proficient": false, "expertise": false},
  "athletics": {"proficient": false, "expertise": false},
  "deception": {"proficient": false, "expertise": false},
  "history": {"proficient": false, "expertise": false},
  "insight": {"proficient": false, "expertise": false},
  "intimidation": {"proficient": false, "expertise": false},
  "investigation": {"proficient": false, "expertise": false},
  "medicine": {"proficient": false, "expertise": false},
  "nature": {"proficient": false, "expertise": false},
  "perception": {"proficient": false, "expertise": false},
  "performance": {"proficient": false, "expertise": false},
  "persuasion": {"proficient": false, "expertise": false},
  "religion": {"proficient": false, "expertise": false},
  "sleight_of_hand": {"proficient": false, "expertise": false},
  "stealth": {"proficient": false, "expertise": false},
  "survival": {"proficient": false, "expertise": false}
}',
ADD COLUMN IF NOT EXISTS saving_throws JSONB DEFAULT '{
  "str": false,
  "dex": false,
  "con": false,
  "int": false,
  "wis": false,
  "cha": false
}',
ADD COLUMN IF NOT EXISTS speed INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS initiative_bonus INTEGER DEFAULT 0;

-- Create spells table
CREATE TABLE IF NOT EXISTS public.player_spells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_player_id UUID REFERENCES public.campaign_players(id) ON DELETE CASCADE,
  spell_name TEXT NOT NULL,
  spell_level INTEGER NOT NULL CHECK (spell_level >= 0 AND spell_level <= 9),
  school TEXT,
  casting_time TEXT,
  range TEXT,
  components TEXT,
  duration TEXT,
  description TEXT,
  is_prepared BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.player_spells ENABLE ROW LEVEL SECURITY;

-- RLS Policies for player_spells
CREATE POLICY "Players can view their own spells"
  ON public.player_spells FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  );

CREATE POLICY "DMs can view campaign player spells"
  ON public.player_spells FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players cp
      JOIN public.campaigns c ON cp.campaign_id = c.id
      WHERE cp.id = campaign_player_id AND c.dm_id = auth.uid()
    )
  );

CREATE POLICY "Players can manage their own spells"
  ON public.player_spells FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  );

CREATE POLICY "DMs can manage campaign player spells"
  ON public.player_spells FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players cp
      JOIN public.campaigns c ON cp.campaign_id = c.id
      WHERE cp.id = campaign_player_id AND c.dm_id = auth.uid()
    )
  );

-- Beta readiness: repair character creation, journals, and level grants.

-- Keep old and new character class field names available while the app is cleaned up.
ALTER TABLE public.campaign_players
  ADD COLUMN IF NOT EXISTS character_class TEXT,
  ADD COLUMN IF NOT EXISTS class TEXT,
  ADD COLUMN IF NOT EXISTS race TEXT,
  ADD COLUMN IF NOT EXISTS character_created BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS ability_scores JSONB DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  ADD COLUMN IF NOT EXISTS chosen_cantrips JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS chosen_spells JSONB DEFAULT '[]';

UPDATE public.campaign_players
SET character_class = COALESCE(character_class, class)
WHERE character_class IS NULL AND class IS NOT NULL;

-- Character sheets need a stats row. Players can manage their own row; DMs can manage rows in their campaign.
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
  ADD COLUMN IF NOT EXISTS saving_throws JSONB DEFAULT '{"str":false,"dex":false,"con":false,"int":false,"wis":false,"cha":false}',
  ADD COLUMN IF NOT EXISTS speed INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS initiative_bonus INTEGER DEFAULT 0;

DROP POLICY IF EXISTS "Players can insert their own character stats" ON public.character_stats;
CREATE POLICY "Players can insert their own character stats"
  ON public.character_stats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Players can update their own character stats" ON public.character_stats;
CREATE POLICY "Players can update their own character stats"
  ON public.character_stats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "DMs can manage campaign character stats" ON public.character_stats;
CREATE POLICY "DMs can manage campaign character stats"
  ON public.character_stats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players cp
      JOIN public.campaigns c ON c.id = cp.campaign_id
      WHERE cp.id = campaign_player_id AND c.dm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_players cp
      JOIN public.campaigns c ON c.id = cp.campaign_id
      WHERE cp.id = campaign_player_id AND c.dm_id = auth.uid()
    )
  );

-- Let the DM grant levels from the Players tab.
DROP POLICY IF EXISTS "DMs can update campaign players" ON public.campaign_players;
CREATE POLICY "DMs can update campaign players"
  ON public.campaign_players FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_players.campaign_id AND dm_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_players.campaign_id AND dm_id = auth.uid()
    )
  );

-- Level-up feat choice needs to insert into player_feats.
DROP POLICY IF EXISTS "Players can insert their own feats" ON public.player_feats;
CREATE POLICY "Players can insert their own feats"
  ON public.player_feats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  );

-- Spellbook migrations have existed in two shapes. Add compatibility columns when the table exists.
DO $$
BEGIN
  IF to_regclass('public.player_spells') IS NOT NULL THEN
    ALTER TABLE public.player_spells ADD COLUMN IF NOT EXISTS slug TEXT;
    ALTER TABLE public.player_spells ADD COLUMN IF NOT EXISTS prepared BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.player_spells ADD COLUMN IF NOT EXISTS is_prepared BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.player_spells ADD COLUMN IF NOT EXISTS casting_time TEXT;
    ALTER TABLE public.player_spells ADD COLUMN IF NOT EXISTS range TEXT;
    ALTER TABLE public.player_spells ADD COLUMN IF NOT EXISTS duration TEXT;
    ALTER TABLE public.player_spells ADD COLUMN IF NOT EXISTS description TEXT;
  END IF;
END $$;

-- Journals need a table, image URLs, and reliable save policies.
CREATE TABLE IF NOT EXISTS public.player_journals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.player_journals ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.player_journals
  ADD COLUMN IF NOT EXISTS image_url TEXT;

DROP POLICY IF EXISTS "Players can view their own private journals" ON public.player_journals;
DROP POLICY IF EXISTS "Campaign members can view public journals" ON public.player_journals;
DROP POLICY IF EXISTS "Players can insert their own journals" ON public.player_journals;
DROP POLICY IF EXISTS "Players can update their own journals" ON public.player_journals;
DROP POLICY IF EXISTS "Players can delete their own journals" ON public.player_journals;
DROP POLICY IF EXISTS "Journals are viewable by owner, DM, or if public" ON public.player_journals;
DROP POLICY IF EXISTS "Users and DMs can insert journals" ON public.player_journals;
DROP POLICY IF EXISTS "Users and DMs can update journals" ON public.player_journals;
DROP POLICY IF EXISTS "Users and DMs can delete journals" ON public.player_journals;

CREATE POLICY "Journals are viewable by owner, DM, or if public"
  ON public.player_journals FOR SELECT
  USING (
    player_id = auth.uid()
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = player_journals.campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "Users and DMs can insert journals"
  ON public.player_journals FOR INSERT
  WITH CHECK (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = player_journals.campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "Users and DMs can update journals"
  ON public.player_journals FOR UPDATE
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = player_journals.campaign_id AND dm_id = auth.uid()
    )
  )
  WITH CHECK (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = player_journals.campaign_id AND dm_id = auth.uid()
    )
  );

CREATE POLICY "Users and DMs can delete journals"
  ON public.player_journals FOR DELETE
  USING (
    player_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = player_journals.campaign_id AND dm_id = auth.uid()
    )
  );

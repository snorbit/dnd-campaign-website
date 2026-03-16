-- ============================================================
-- COMBINED MIGRATION — Run ONCE in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ── MIGRATION 010: Character Creator Columns & Tables ────────

ALTER TABLE public.campaign_players
  ADD COLUMN IF NOT EXISTS character_created BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS race TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS class TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS subclass TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS backstory TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS appearance JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS guardian_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS guardian_deity TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS guardian_oath TEXT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS public.homebrew_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  hit_die TEXT DEFAULT 'd8',
  primary_ability TEXT,
  role TEXT DEFAULT 'Versatile',
  features JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homebrew_races (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  speed INTEGER DEFAULT 30,
  size TEXT DEFAULT 'Medium',
  ability_bonuses TEXT,
  traits JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homebrew_subclasses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  parent_class TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.homebrew_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homebrew_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homebrew_subclasses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Campaign members can view homebrew classes"
  ON public.homebrew_classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.campaign_players WHERE campaign_id = homebrew_classes.campaign_id AND player_id = auth.uid())
      )
    )
  );

CREATE POLICY IF NOT EXISTS "DMs can manage homebrew classes"
  ON public.homebrew_classes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Campaign members can view homebrew races"
  ON public.homebrew_races FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.campaign_players WHERE campaign_id = homebrew_races.campaign_id AND player_id = auth.uid())
      )
    )
  );

CREATE POLICY IF NOT EXISTS "DMs can manage homebrew races"
  ON public.homebrew_races FOR ALL
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Campaign members can view homebrew subclasses"
  ON public.homebrew_subclasses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.campaign_players WHERE campaign_id = homebrew_subclasses.campaign_id AND player_id = auth.uid())
      )
    )
  );

CREATE POLICY IF NOT EXISTS "DMs can manage homebrew subclasses"
  ON public.homebrew_subclasses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid()));

-- Allow players to save their character
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'campaign_players'
    AND policyname = 'Players can update their own character data'
  ) THEN
    CREATE POLICY "Players can update their own character data"
      ON public.campaign_players FOR UPDATE
      USING (player_id = auth.uid())
      WITH CHECK (player_id = auth.uid());
  END IF;
END $$;

-- ── MIGRATION 011: Stats & Spells Columns ────────────────────

ALTER TABLE public.campaign_players
  ADD COLUMN IF NOT EXISTS ability_scores JSONB DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  ADD COLUMN IF NOT EXISTS chosen_cantrips JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS chosen_spells JSONB DEFAULT '[]';

ALTER TABLE public.campaign_state
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"statMin":8,"statMax":15,"pointBuyPoints":27,"startingLevel":1}';

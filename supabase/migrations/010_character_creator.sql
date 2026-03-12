-- ============================================================
-- CHARACTER CREATOR MIGRATION
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add character creation fields to campaign_players
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

-- 2. Homebrew Classes table
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

-- 3. Homebrew Races table
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

-- 4. Homebrew Subclasses table
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

-- 5. Enable RLS
ALTER TABLE public.homebrew_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homebrew_races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homebrew_subclasses ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Campaign members can read homebrew content
CREATE POLICY "Campaign members can view homebrew classes"
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

CREATE POLICY "DMs can manage homebrew classes"
  ON public.homebrew_classes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid())
  );

CREATE POLICY "Campaign members can view homebrew races"
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

CREATE POLICY "DMs can manage homebrew races"
  ON public.homebrew_races FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid())
  );

CREATE POLICY "Campaign members can view homebrew subclasses"
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

CREATE POLICY "DMs can manage homebrew subclasses"
  ON public.homebrew_subclasses FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid())
  );

-- 7. Allow players to update their own character fields
CREATE POLICY "Players can update their own character data"
  ON public.campaign_players FOR UPDATE
  USING (player_id = auth.uid())
  WITH CHECK (player_id = auth.uid());

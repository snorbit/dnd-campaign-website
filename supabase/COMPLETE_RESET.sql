-- COMPLETE DATABASE RESET
-- This drops ALL tables and recreates everything fresh
-- Copy entire file into Supabase SQL Editor

-----------------------------------------------
-- STEP 1: DROP EVERYTHING
-----------------------------------------------

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP POLICY IF EXISTS "Players can view their own inventory" ON public.player_inventory;
DROP POLICY IF EXISTS "DMs can view campaign player inventories" ON public.player_inventory;
DROP POLICY IF EXISTS "Player feats viewable by campaign members" ON public.player_feats;
DROP POLICY IF EXISTS "DMs can manage homebrew feats in their campaigns" ON public.homebrew_feats;
DROP POLICY IF EXISTS "Homebrew feats viewable by campaign members" ON public.homebrew_feats;
DROP POLICY IF EXISTS "Everyone can view standard feats" ON public.standard_feats;
DROP POLICY IF EXISTS "DMs can update campaign state" ON public.campaign_state;
DROP POLICY IF EXISTS "Campaign state viewable by members" ON public.campaign_state;
DROP POLICY IF EXISTS "Character stats viewable by campaign members" ON public.character_stats;
DROP POLICY IF EXISTS "Campaign players are viewable by campaign members" ON public.campaign_players;
DROP POLICY IF EXISTS "Users can create campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "DMs can delete their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "DMs can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Anyone can view campaigns they're part of" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

DROP TABLE IF EXISTS public.player_inventory CASCADE;
DROP TABLE IF EXISTS public.player_feats CASCADE;
DROP TABLE IF EXISTS public.homebrew_feats CASCADE;
DROP TABLE IF EXISTS public.standard_feats CASCADE;
DROP TABLE IF EXISTS public.campaign_state CASCADE;
DROP TABLE IF EXISTS public.character_stats CASCADE;
DROP TABLE IF EXISTS public.campaign_players CASCADE;
DROP TABLE IF EXISTS public.campaigns CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-----------------------------------------------
-- STEP 2: CREATE ALL TABLES
-----------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  dm_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_played_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.campaign_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  character_class TEXT,
  level INTEGER DEFAULT 1,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, player_id)
);

CREATE TABLE public.character_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_player_id UUID REFERENCES public.campaign_players(id) ON DELETE CASCADE,
  hp_current INTEGER DEFAULT 10,
  hp_max INTEGER DEFAULT 10,
  ac INTEGER DEFAULT 10,
  str INTEGER DEFAULT 10,
  dex INTEGER DEFAULT 10,
  con INTEGER DEFAULT 10,
  int INTEGER DEFAULT 10,
  wis INTEGER DEFAULT 10,
  cha INTEGER DEFAULT 10,
  proficiency_bonus INTEGER DEFAULT 2,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_player_id)
);

CREATE TABLE public.campaign_state (
  campaign_id UUID PRIMARY KEY REFERENCES public.campaigns(id) ON DELETE CASCADE,
  world JSONB DEFAULT '{}',
  map JSONB DEFAULT '{"url":"","queue":[],"currentIndex":0}',
  encounters JSONB DEFAULT '[]',
  quests JSONB DEFAULT '[]',
  npcs JSONB DEFAULT '[]',
  items JSONB DEFAULT '[]',
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.standard_feats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  prerequisites TEXT,
  benefits JSONB DEFAULT '[]'
);

CREATE TABLE public.homebrew_feats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  prerequisites TEXT,
  benefits JSONB DEFAULT '[]',
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.player_feats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_player_id UUID REFERENCES public.campaign_players(id) ON DELETE CASCADE,
  feat_id UUID,
  feat_type TEXT CHECK (feat_type IN ('standard', 'homebrew')),
  level_acquired INTEGER NOT NULL,
  acquired_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE public.player_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_player_id UUID REFERENCES public.campaign_players(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  weight DECIMAL DEFAULT 0,
  category TEXT CHECK (category IN ('weapon', 'armor', 'consumable', 'misc')),
  created_at TIMESTAMP DEFAULT NOW()
);

-----------------------------------------------
-- STEP 3: ENABLE ROW LEVEL SECURITY
-----------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standard_feats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homebrew_feats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_feats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;

-----------------------------------------------
-- STEP 4: CREATE ALL POLICIES
-----------------------------------------------

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view campaigns they're part of"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = dm_id OR EXISTS (
    SELECT 1 FROM public.campaign_players WHERE campaign_id = id AND player_id = auth.uid()
  ));

CREATE POLICY "DMs can update their own campaigns"
  ON public.campaigns FOR UPDATE USING (auth.uid() = dm_id);

CREATE POLICY "DMs can delete their own campaigns"
  ON public.campaigns FOR DELETE USING (auth.uid() = dm_id);

CREATE POLICY "Users can create campaigns"
  ON public.campaigns FOR INSERT WITH CHECK (auth.uid() = dm_id);

CREATE POLICY "Campaign players are viewable by campaign members"
  ON public.campaign_players FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns WHERE id = campaign_id AND (
      dm_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.campaign_players cp2 WHERE cp2.campaign_id = campaign_id AND cp2.player_id = auth.uid()
      )
    )
  ));

CREATE POLICY "Character stats viewable by campaign members"
  ON public.character_stats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaign_players cp
    JOIN public.campaigns c ON cp.campaign_id = c.id
    WHERE cp.id = campaign_player_id AND (c.dm_id = auth.uid() OR cp.player_id = auth.uid())
  ));

CREATE POLICY "Campaign state viewable by members"
  ON public.campaign_state FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns WHERE id = campaign_id AND (
      dm_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.campaign_players WHERE campaign_id = campaign_state.campaign_id AND player_id = auth.uid()
      )
    )
  ));

CREATE POLICY "DMs can update campaign state"
  ON public.campaign_state FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid()));

CREATE POLICY "Everyone can view standard feats"
  ON public.standard_feats FOR SELECT USING (true);

CREATE POLICY "Homebrew feats viewable by campaign members"
  ON public.homebrew_feats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaigns WHERE id = campaign_id AND (
      dm_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.campaign_players WHERE campaign_id = homebrew_feats.campaign_id AND player_id = auth.uid()
      )
    )
  ));

CREATE POLICY "DMs can manage homebrew feats in their campaigns"
  ON public.homebrew_feats FOR ALL
  USING (EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid()));

CREATE POLICY "Player feats viewable by campaign members"
  ON public.player_feats FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaign_players cp
    JOIN public.campaigns c ON cp.campaign_id = c.id
    WHERE cp.id = campaign_player_id AND (c.dm_id = auth.uid() OR cp.player_id = auth.uid())
  ));

CREATE POLICY "Players can view their own inventory"
  ON public.player_inventory FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.campaign_players WHERE id = campaign_player_id AND player_id = auth.uid()));

CREATE POLICY "DMs can view campaign player inventories"
  ON public.player_inventory FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.campaign_players cp
    JOIN public.campaigns c ON cp.campaign_id = c.id
    WHERE cp.id = campaign_player_id AND c.dm_id = auth.uid()
  ));

-----------------------------------------------
-- STEP 5: AUTO-CREATE PROFILE ON SIGNUP
-----------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

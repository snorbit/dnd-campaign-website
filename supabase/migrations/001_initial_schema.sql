-- D&D Campaign Platform Database Schema
-- Run this in Supabase SQL Editor
-- IMPORTANT: This creates ALL TABLES FIRST, then adds RLS policies

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------
-- PART 1: CREATE ALL TABLES
-----------------------------------------------

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  dm_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_played_at TIMESTAMP DEFAULT NOW()
);

-- Campaign players (many-to-many)
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

-- Character stats
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

-- Campaign state
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

-- Standard D&D 5e feats
CREATE TABLE public.standard_feats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  prerequisites TEXT,
  benefits JSONB DEFAULT '[]'
);

-- Campaign-specific homebrew feats
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

-- Player acquired feats
CREATE TABLE public.player_feats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_player_id UUID REFERENCES public.campaign_players(id) ON DELETE CASCADE,
  feat_id UUID,
  feat_type TEXT CHECK (feat_type IN ('standard', 'homebrew')),
  level_acquired INTEGER NOT NULL,
  acquired_at TIMESTAMP DEFAULT NOW()
);

-- Player inventory
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
-- PART 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
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
-- PART 3: CREATE ALL RLS POLICIES
-----------------------------------------------

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Campaign policies
CREATE POLICY "Anyone can view campaigns they're part of"
  ON public.campaigns FOR SELECT
  USING (
    auth.uid() = dm_id OR
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE campaign_id = id AND player_id = auth.uid()
    )
  );

CREATE POLICY "DMs can update their own campaigns"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = dm_id);

CREATE POLICY "DMs can delete their own campaigns"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = dm_id);

CREATE POLICY "Users can create campaigns"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = dm_id);

-- Campaign players policies
CREATE POLICY "Campaign players are viewable by campaign members"
  ON public.campaign_players FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.campaign_players cp2
          WHERE cp2.campaign_id = campaign_id AND cp2.player_id = auth.uid()
        )
      )
    )
  );

-- Character stats policies
CREATE POLICY "Character stats viewable by campaign members"
  ON public.character_stats FOR SELECT
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

-- Campaign state policies
CREATE POLICY "Campaign state viewable by members"
  ON public.campaign_state FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.campaign_players
          WHERE campaign_id = campaign_state.campaign_id AND player_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "DMs can update campaign state"
  ON public.campaign_state FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- Standard feats policies
CREATE POLICY "Everyone can view standard feats"
  ON public.standard_feats FOR SELECT
  USING (true);

-- Homebrew feats policies
CREATE POLICY "Homebrew feats viewable by campaign members"
  ON public.homebrew_feats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND (
        dm_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.campaign_players
          WHERE campaign_id = homebrew_feats.campaign_id AND player_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "DMs can manage homebrew feats in their campaigns"
  ON public.homebrew_feats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND dm_id = auth.uid()
    )
  );

-- Player feats policies
CREATE POLICY "Player feats viewable by campaign members"
  ON public.player_feats FOR SELECT
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

-- Player inventory policies
CREATE POLICY "Players can view their own inventory"
  ON public.player_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players
      WHERE id = campaign_player_id AND player_id = auth.uid()
    )
  );

CREATE POLICY "DMs can view campaign player inventories"
  ON public.player_inventory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaign_players cp
      JOIN public.campaigns c ON cp.campaign_id = c.id
      WHERE cp.id = campaign_player_id AND c.dm_id = auth.uid()
    )
  );

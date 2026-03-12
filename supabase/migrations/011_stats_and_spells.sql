-- ============================================================
-- STATS & SPELLS CHARACTER CREATOR ADDITIONS
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add ability scores + chosen spells to campaign_players
ALTER TABLE public.campaign_players
  ADD COLUMN IF NOT EXISTS ability_scores JSONB DEFAULT '{"str":10,"dex":10,"con":10,"int":10,"wis":10,"cha":10}',
  ADD COLUMN IF NOT EXISTS chosen_cantrips JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS chosen_spells JSONB DEFAULT '[]';

-- 2. Add campaign settings to campaign_state for DM-controlled rules
ALTER TABLE public.campaign_state
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
    "statMin": 8,
    "statMax": 15,
    "pointBuyPoints": 27,
    "startingLevel": 1,
    "allowCustomStats": false
  }';

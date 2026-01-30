-- Add initiative column to campaign_state
ALTER TABLE public.campaign_state ADD COLUMN IF NOT EXISTS initiative JSONB DEFAULT '{}';

-- The RLS policies already cover the campaign_state table, so no new policies needed.

-- RUN THIS IN SUPABASE SQL EDITOR TO FIX CAMPAIGN CREATION

-- Add INSERT policy for campaign_state (DMs can create)
CREATE POLICY "DMs can create campaign state"
  ON public.campaign_state FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns WHERE id = campaign_id AND dm_id = auth.uid()));

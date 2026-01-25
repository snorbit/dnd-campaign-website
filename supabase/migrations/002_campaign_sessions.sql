-- Create sessions table to store imported session data
CREATE TABLE IF NOT EXISTS public.campaign_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    session_text TEXT NOT NULL,
    session_order INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Metadata about what was generated
    maps_generated INTEGER DEFAULT 0,
    quests_created INTEGER DEFAULT 0,
    items_added INTEGER DEFAULT 0,
    encounters_created INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.campaign_sessions ENABLE ROW LEVEL SECURITY;

-- DMs can view and manage sessions for their campaigns
CREATE POLICY "DMs can manage their campaign sessions"
  ON public.campaign_sessions
  FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE dm_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_sessions_campaign_id 
  ON public.campaign_sessions(campaign_id);

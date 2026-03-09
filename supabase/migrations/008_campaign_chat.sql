-- Migration: Campaign Chat Table
-- Creates a table to store realtime chat and dice rolls for history

CREATE TABLE IF NOT EXISTS public.campaign_chat (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id BIGINT REFERENCES public.campaigns(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Can be null for system messages
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    is_whisper BOOLEAN DEFAULT false,
    target_player_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Null if not a whisper
    message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'roll', 'system'
    roll_data JSONB, -- Optional data for 3D dice result
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.campaign_chat ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Anyone in the campaign can view non-whisper messages, or whispers directed at them, or if they are the DM
CREATE POLICY "View campaign chat"
    ON public.campaign_chat
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.campaign_players cp
            WHERE cp.campaign_id = campaign_chat.campaign_id
            AND cp.player_id = auth.uid()
        )
        AND (
            is_whisper = false
            OR sender_id = auth.uid()
            OR target_player_id = auth.uid()
            -- DM can see all
            OR EXISTS (
                SELECT 1 FROM public.campaigns c
                WHERE c.id = campaign_chat.campaign_id
                AND c.dm_id = auth.uid()
            )
        )
    );

-- 2. Anyone in the campaign can insert messages
CREATE POLICY "Insert campaign chat"
    ON public.campaign_chat
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.campaign_players cp
            WHERE cp.campaign_id = campaign_chat.campaign_id
            AND cp.player_id = auth.uid()
        )
        -- Can also be the DM directly
        OR EXISTS (
            SELECT 1 FROM public.campaigns c
            WHERE c.id = campaign_chat.campaign_id
            AND c.dm_id = auth.uid()
        )
    );

'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { Volume2, VolumeX } from 'lucide-react';

// Dynamic import avoids SSR issues and resolves react-player typing conflicts
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactPlayer = dynamic(() => import('react-player').then(mod => mod.default), { ssr: false }) as any;

interface AudioPlayerProps {
    campaignId: string;
}

interface AudioState {
    url: string;
    isPlaying: boolean;
    volume: number;
}

const DEFAULT_AUDIO: AudioState = { url: '', isPlaying: false, volume: 50 };

export function AudioPlayer({ campaignId }: AudioPlayerProps) {
    const [audioState, setAudioState] = useState<AudioState>(DEFAULT_AUDIO);
    const [localMuted, setLocalMuted] = useState(false);
    const [mounted, setMounted] = useState(false);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        setMounted(true);

        // Load initial state
        supabase
            .from('campaign_state')
            .select('audio')
            .eq('campaign_id', campaignId)
            .single()
            .then(({ data }) => {
                if (data?.audio) setAudioState(data.audio);
            });

        // Subscribe to realtime updates
        const channel = supabase
            .channel(`audio_player_${campaignId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'campaign_state',
                filter: `campaign_id=eq.${campaignId}`
            }, (payload: any) => {
                if (payload.new?.audio) {
                    setAudioState(payload.new.audio);
                }
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    }, [campaignId]);

    if (!mounted || !audioState.url) {
        return null;
    }

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {/* Hidden Player */}
            <ReactPlayer
                url={audioState.url}
                playing={audioState.isPlaying && !localMuted}
                volume={audioState.volume / 100}
                width="0"
                height="0"
                config={{
                    youtube: {
                        playerVars: { showinfo: 0, controls: 0 }
                    } as any
                }}
            />

            {/* Quick Mute Toggle UI */}
            <div className="bg-gray-800 border border-gray-700 rounded-full shadow-lg overflow-hidden flex items-center p-1 transition-all">
                <button
                    onClick={() => setLocalMuted(!localMuted)}
                    className={`p-2 rounded-full transition-colors ${localMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'hover:bg-gray-700 text-gray-300'}`}
                    title={localMuted ? "Unmute local audio" : "Mute local audio"}
                >
                    {localMuted || !audioState.isPlaying ? <VolumeX size={18} /> : <Volume2 size={18} className="animate-pulse" />}
                </button>
            </div>
        </div>
    );
}

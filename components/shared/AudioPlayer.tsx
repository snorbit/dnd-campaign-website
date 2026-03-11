'use client';

import { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { supabase } from '@/lib/supabase';
import { useCampaign } from '@/context/CampaignContext';
import { Volume2, VolumeX } from 'lucide-react';

export function AudioPlayer() {
    const { id: campaignId, audio } = useCampaign();
    const [localMuted, setLocalMuted] = useState(false);
    const audioState = audio || { url: '', isPlaying: false, volume: 50 };

    // Hydration check
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

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
                    }
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

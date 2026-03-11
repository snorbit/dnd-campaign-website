'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Pause, Volume2, Save, Music, Link } from 'lucide-react';
import { toast } from 'sonner';

interface AudioTabProps {
    campaignId: string;
}

interface AudioState {
    url: string;
    isPlaying: boolean;
    volume: number;
}

const DEFAULT_AUDIO: AudioState = { url: '', isPlaying: false, volume: 50 };

export default function AudioTab({ campaignId }: AudioTabProps) {
    const [audioState, setAudioState] = useState<AudioState>(DEFAULT_AUDIO);
    const [url, setUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const channelRef = useRef<any>(null);

    // Load from campaign_state on mount
    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('campaign_state')
                .select('audio')
                .eq('campaign_id', campaignId)
                .single();
            if (data?.audio) {
                setAudioState(data.audio);
                setUrl(data.audio.url || '');
            }
        };
        load();

        // Subscribe to realtime changes so the tab stays in sync
        const channel = supabase
            .channel(`audio_tab_${campaignId}`)
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

    const pushAudio = async (newState: AudioState) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('campaign_state')
                .update({ audio: newState })
                .eq('campaign_id', campaignId);
            if (error) throw error;
            setAudioState(newState);
        } catch (err) {
            console.error('Error updating audio:', err);
            toast.error('Failed to sync audio');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUrl = () => {
        if (!url.trim()) return;
        pushAudio({ ...audioState, url: url.trim(), isPlaying: true });
        toast.success('Audio track synced to players');
    };

    const handleTogglePlay = () => {
        pushAudio({ ...audioState, isPlaying: !audioState.isPlaying });
    };

    const handleVolumeChange = (newVol: number) => {
        setAudioState(prev => ({ ...prev, volume: newVol }));
    };

    const handleVolumeCommit = () => {
        pushAudio({ ...audioState });
    };

    return (
        <div className="space-y-6 max-w-2xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Music className="text-purple-400" />
                        Campaign Audio
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Control music &amp; ambiance for all connected players.
                    </p>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
                {/* Track URL Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                        <Link size={14} /> YouTube / SoundCloud URL
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        />
                        <button
                            onClick={handleSaveUrl}
                            disabled={saving || !url.trim()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Save size={18} />
                            Sync Track
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-6 p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <button
                        onClick={handleTogglePlay}
                        disabled={!audioState.url || saving}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${audioState.isPlaying
                            ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {audioState.isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
                    </button>

                    <div className="flex-1 max-w-xs space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                            <Volume2 size={16} />
                            <span>{audioState.volume}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={audioState.volume}
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            onMouseUp={handleVolumeCommit}
                            onTouchEnd={handleVolumeCommit}
                            disabled={!audioState.url || saving}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>
                </div>

                {audioState.url && (
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${audioState.isPlaying ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {audioState.isPlaying ? 'Currently playing for all players' : 'Audio is paused'}
                    </div>
                )}
            </div>
        </div>
    );
}

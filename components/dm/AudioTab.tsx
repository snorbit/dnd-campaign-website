'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCampaign } from '@/context/CampaignContext';
import { Play, Pause, Volume2, Save, Music } from 'lucide-react';
import { toast } from 'sonner';

interface AudioTabProps {
    campaignId: string;
}

export default function AudioTab({ campaignId }: AudioTabProps) {
    const { audio, updateAudio } = useCampaign();
    const audioState = audio || { url: '', isPlaying: false, volume: 50 };

    const [url, setUrl] = useState(audioState.url);
    const [isPlaying, setIsPlaying] = useState(audioState.isPlaying);
    const [volume, setVolume] = useState(audioState.volume);
    const [saving, setSaving] = useState(false);

    const updateAudioState = async (updates: Partial<typeof audioState>) => {
        setSaving(true);
        const newState = { ...audioState, ...updates };

        try {
            updateAudio(updates); // Optimistic UI local push

            const { error } = await supabase
                .from('campaign_state')
                .update({
                    audio: newState
                })
                .eq('campaign_id', campaignId);

            if (error) throw error;

            // Local state updates for immediate feedback
            if (updates.url !== undefined) setUrl(updates.url);
            if (updates.isPlaying !== undefined) setIsPlaying(updates.isPlaying);
            if (updates.volume !== undefined) setVolume(updates.volume);

        } catch (error) {
            console.error('Error updating audio:', error);
            toast.error('Failed to sync audio');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUrl = () => {
        updateAudioState({ url, isPlaying: true }); // Auto-play when setting a new URL usually
        toast.success('Audio track synced to players');
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
                        Control music & ambiance for all connected players.
                    </p>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">

                {/* Track URL Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">YouTube URL</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="flex-1 px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        />
                        <button
                            onClick={handleSaveUrl}
                            disabled={saving || !url}
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
                        onClick={() => updateAudioState({ isPlaying: !isPlaying })}
                        disabled={!audioState.url || saving}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${isPlaying
                            ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isPlaying ? <Pause size={24} className="fill-current" /> : <Play size={24} className="fill-current ml-1" />}
                    </button>

                    <div className="flex-1 max-w-xs space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-400">
                            <Volume2 size={16} />
                            <span>{volume}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            onMouseUp={() => updateAudioState({ volume })}
                            onTouchEnd={() => updateAudioState({ volume })}
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

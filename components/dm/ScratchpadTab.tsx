'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ScratchpadTabProps {
    campaignId: string;
}

export default function ScratchpadTab({ campaignId }: ScratchpadTabProps) {
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Load initial notes
    useEffect(() => {
        const loadNotes = async () => {
            try {
                const { data, error } = await supabase
                    .from('campaign_state')
                    .select('world')
                    .eq('campaign_id', campaignId)
                    .single();

                if (error) throw error;

                if (data?.world?.notes) {
                    setNotes(data.world.notes);
                }
            } catch (error) {
                console.error('Error loading notes:', error);
            } finally {
                setLoading(false);
            }
        };

        loadNotes();
    }, [campaignId]);

    // Save function
    const saveNotes = useCallback(async (currentNotes: string, showToast = false) => {
        setSaving(true);
        try {
            // First get current world state
            const { data: currentState, error: fetchError } = await supabase
                .from('campaign_state')
                .select('world')
                .eq('campaign_id', campaignId)
                .single();

            if (fetchError) throw fetchError;

            // Update world with new notes
            const updatedWorld = { ...currentState?.world, notes: currentNotes };

            const { error: updateError } = await supabase
                .from('campaign_state')
                .update({ world: updatedWorld })
                .eq('campaign_id', campaignId);

            if (updateError) throw updateError;

            setLastSaved(new Date());
            if (showToast) toast.success('Notes saved successfully');
        } catch (error) {
            console.error('Error saving notes:', error);
            if (showToast) toast.error('Failed to save notes');
        } finally {
            setSaving(false);
        }
    }, [campaignId]);

    // Auto-save debounce effect
    useEffect(() => {
        if (loading) return; // Don't auto-save while initially loading

        const timeoutId = setTimeout(() => {
            if (notes !== undefined) {
                saveNotes(notes);
            }
        }, 3000); // Auto save after 3 seconds of typing

        return () => clearTimeout(timeoutId);
    }, [notes, saveNotes, loading]);


    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-yellow-500 w-8 h-8" />
            </div>
        );
    }

    return (
        <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <h2 className="text-2xl font-bold text-white">DM Scratchpad</h2>

                <div className="flex items-center gap-4">
                    {lastSaved && (
                        <span className="text-xs text-gray-500 hidden sm:inline-block">
                            Last saved: {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={() => saveNotes(notes, true)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
                    >
                        {saving ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            lastSaved ? <Check size={18} /> : <Save size={18} />
                        )}
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write your session notes here... (Markdown supported visually by you)"
                    className="w-full flex-1 p-6 bg-transparent text-gray-200 resize-none focus:outline-none font-mono leading-relaxed"
                    spellCheck="false"
                />
            </div>
        </div>
    );
}

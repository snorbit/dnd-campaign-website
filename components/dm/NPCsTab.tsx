'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Dices, List, Users } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';
import { NPCGenerator } from './NPCGenerator';
import { toast } from 'sonner';

interface NPC {
    id: string;
    name: string;
    race: string;
    role: string;
    notes: string;
    inParty: boolean;
}

interface NPCsTabProps {
    campaignId: string;
}

export default function NPCsTab({ campaignId }: NPCsTabProps) {
    const [npcs, setNpcs] = useState<NPC[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newNPC, setNewNPC] = useState({ name: '', race: '', role: '', notes: '' });
    const [mode, setMode] = useState<'list' | 'generate'>('list');

    useEffect(() => {
        loadNPCs();
    }, [campaignId]);

    const loadNPCs = async () => {
        try {
            setLoading(true);
            const { data } = await supabase.from('campaign_state').select('npcs').eq('campaign_id', campaignId).single();
            setNpcs(data?.npcs || []);
        } catch (error) {
            console.error('Error loading NPCs:', error);
        } finally {
            setLoading(false);
        }
    };

    const createNPC = async () => {
        const npc: NPC = { id: crypto.randomUUID(), ...newNPC, inParty: false };
        const updated = [...npcs, npc];
        await supabase.from('campaign_state').update({ npcs: updated }).eq('campaign_id', campaignId);
        setNpcs(updated);
        setShowCreateModal(false);
        setNewNPC({ name: '', race: '', role: '', notes: '' });
    };

    const saveGeneratedNPC = useCallback(async (npcData: { name: string; race: string; role: string; notes: string }) => {
        try {
            const npc: NPC = {
                id: crypto.randomUUID(),
                ...npcData,
                inParty: false,
            };
            const updated = [...npcs, npc];
            await supabase.from('campaign_state').update({ npcs: updated }).eq('campaign_id', campaignId);
            setNpcs(updated);
            toast.success('NPC saved to campaign!', {
                description: `${npc.name} has been added to your NPCs.`,
            });
        } catch (error) {
            console.error('Error saving NPC:', error);
            toast.error('Failed to save NPC');
        }
    }, [npcs, campaignId]);

    const deleteNPC = async (id: string) => {
        const updated = npcs.filter(n => n.id !== id);
        await supabase.from('campaign_state').update({ npcs: updated }).eq('campaign_id', campaignId);
        setNpcs(updated);
        toast.success('NPC deleted');
    };

    return (
        <div className="space-y-4">
            {/* Header with Mode Toggle */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-white">NPCs</h2>

                <div className="flex items-center gap-3">
                    {/* Mode Toggle */}
                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                        <button
                            onClick={() => setMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'list'
                                    ? 'bg-yellow-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            <List size={16} />
                            <span className="hidden sm:inline">View</span>
                        </button>
                        <button
                            onClick={() => setMode('generate')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'generate'
                                    ? 'bg-yellow-600 text-white shadow-md'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                        >
                            <Dices size={16} />
                            <span className="hidden sm:inline">Generate</span>
                        </button>
                    </div>

                    {/* New NPC Button (only in list mode) */}
                    {mode === 'list' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">New NPC</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content based on mode */}
            {mode === 'generate' ? (
                <NPCGenerator campaignId={campaignId} onSaveNPC={saveGeneratedNPC} />
            ) : (
                <>
                    {loading ? (
                        <SkeletonList count={3} />
                    ) : npcs.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-800 border border-gray-700 mb-4">
                                <Users className="w-10 h-10 text-gray-600" />
                            </div>
                            <p className="text-gray-400 text-lg">No NPCs yet</p>
                            <p className="text-gray-500 text-sm mt-1">
                                Create a new NPC or switch to Generate mode
                            </p>
                            <div className="flex justify-center gap-3 mt-6">
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Create Manually
                                </button>
                                <button
                                    onClick={() => setMode('generate')}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                                >
                                    <Dices size={18} />
                                    Generate Random
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {npcs.map(npc => (
                                <div key={npc.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-white font-bold text-lg">{npc.name}</h3>
                                            <p className="text-gray-400 text-sm">{npc.race} - {npc.role}</p>
                                            {npc.notes && (
                                                <p className="text-gray-500 text-sm mt-2 whitespace-pre-line">{npc.notes}</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deleteNPC(npc.id)}
                                            className="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Create NPC Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Create NPC</h3>
                        <input
                            type="text"
                            placeholder="NPC Name"
                            value={newNPC.name}
                            onChange={e => setNewNPC({ ...newNPC, name: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all"
                        />
                        <input
                            type="text"
                            placeholder="Race"
                            value={newNPC.race}
                            onChange={e => setNewNPC({ ...newNPC, race: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all"
                        />
                        <input
                            type="text"
                            placeholder="Role"
                            value={newNPC.role}
                            onChange={e => setNewNPC({ ...newNPC, role: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all"
                        />
                        <textarea
                            placeholder="Notes"
                            value={newNPC.notes}
                            onChange={e => setNewNPC({ ...newNPC, notes: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/30 transition-all resize-none"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={createNPC}
                                disabled={!newNPC.name}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

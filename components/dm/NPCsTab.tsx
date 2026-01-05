'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Plus, Trash2 } from 'lucide-react';

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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newNPC, setNewNPC] = useState({ name: '', race: '', role: '', notes: '' });
    const supabase = createClientComponentClient();

    useEffect(() => {
        loadNPCs();
    }, [campaignId]);

    const loadNPCs = async () => {
        const { data } = await supabase.from('campaign_state').select('npcs').eq('campaign_id', campaignId).single();
        setNpcs(data?.npcs || []);
    };

    const createNPC = async () => {
        const npc: NPC = { id: crypto.randomUUID(), ...newNPC, inParty: false };
        const updated = [...npcs, npc];
        await supabase.from('campaign_state').update({ npcs: updated }).eq('campaign_id', campaignId);
        setNpcs(updated);
        setShowCreateModal(false);
        setNewNPC({ name: '', race: '', role: '', notes: '' });
    };

    const deleteNPC = async (id: string) => {
        const updated = npcs.filter(n => n.id !== id);
        await supabase.from('campaign_state').update({ npcs: updated }).eq('campaign_id', campaignId);
        setNpcs(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <h2 className="text-2xl font-bold text-white">NPCs</h2>
                <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">
                    <Plus size={18} className="inline mr-2" />
                    New NPC
                </button>
            </div>

            <div className="grid gap-3">
                {npcs.map(npc => (
                    <div key={npc.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-white font-bold text-lg">{npc.name}</h3>
                                <p className="text-gray-400 text-sm">{npc.race} - {npc.role}</p>
                                {npc.notes && <p className="text-gray-500 text-sm mt-2">{npc.notes}</p>}
                            </div>
                            <button onClick={() => deleteNPC(npc.id)} className="p-2 bg-red-600 hover:bg-red-700 text-white rounded">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Create NPC</h3>
                        <input type="text" placeholder="NPC Name" value={newNPC.name} onChange={e => setNewNPC({ ...newNPC, name: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <input type="text" placeholder="Race" value={newNPC.race} onChange={e => setNewNPC({ ...newNPC, race: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <input type="text" placeholder="Role" value={newNPC.role} onChange={e => setNewNPC({ ...newNPC, role: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <textarea placeholder="Notes" value={newNPC.notes} onChange={e => setNewNPC({ ...newNPC, notes: e.target.value })} rows={3} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <div className="flex gap-3">
                            <button onClick={createNPC} disabled={!newNPC.name} className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Create</button>
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

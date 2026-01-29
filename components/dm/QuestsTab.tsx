'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';
import { useRealtimeSubscription } from '@/components/shared/hooks/useRealtimeSubscription';
import { RealtimeStatus } from '@/components/shared/ui/RealtimeStatus';

interface Quest {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'failed';
    objectives: { id: string; text: string; completed: boolean; }[];
    reward?: string;
}

interface QuestsTabProps {
    campaignId: string;
}

export default function DMQuestsTab({ campaignId }: QuestsTabProps) {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasInitialLoaded, setHasInitialLoaded] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newQuest, setNewQuest] = useState({ title: '', description: '', reward: '', objectives: [''] });
    // Using imported supabase client

    const handleQuestsUpdate = useCallback((updatedQuests: Quest[]) => {
        setQuests(updatedQuests);
    }, []);

    const loadQuests = async () => {
        try {
            if (!hasInitialLoaded) setLoading(true);
            const { data } = await supabase
                .from('campaign_state')
                .select('quests')
                .eq('campaign_id', campaignId)
                .single();

            setQuests(data?.quests || []);
        } catch (error) {
            console.error('Error loading quests:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuests();
        setHasInitialLoaded(true);
    }, [campaignId]);

    const { status: realtimeStatus } = useRealtimeSubscription<Quest[]>(
        campaignId,
        'quests',
        handleQuestsUpdate
    );

    // Safety re-sync on reconnection
    useEffect(() => {
        if (realtimeStatus === 'connected' && hasInitialLoaded) {
            console.log('[Quests] Connection restored, re-syncing data...');
            loadQuests();
        }
    }, [realtimeStatus, hasInitialLoaded]);

    const createQuest = async () => {
        const quest: Quest = {
            id: crypto.randomUUID(),
            title: newQuest.title,
            description: newQuest.description,
            reward: newQuest.reward,
            status: 'active',
            objectives: newQuest.objectives.filter(o => o.trim()).map(obj => ({
                id: crypto.randomUUID(),
                text: obj,
                completed: false
            }))
        };

        const updatedQuests = [...quests, quest];
        await supabase.from('campaign_state').update({ quests: updatedQuests }).eq('campaign_id', campaignId);
        setQuests(updatedQuests);
        setShowCreateModal(false);
        setNewQuest({ title: '', description: '', reward: '', objectives: [''] });
    };

    const completeQuest = async (questId: string) => {
        const updated = quests.map(q => q.id === questId ? { ...q, status: 'completed' as const } : q);
        await supabase.from('campaign_state').update({ quests: updated }).eq('campaign_id', campaignId);
        setQuests(updated);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <h2 className="text-2xl font-bold text-white">Quests</h2>
                <div className="flex items-center gap-3">
                    <RealtimeStatus status={realtimeStatus} />
                    <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors">
                        <Plus size={18} className="inline mr-2" />
                        New Quest
                    </button>
                </div>
            </div>

            {loading ? (
                <SkeletonList count={3} />
            ) : (
                <div className="space-y-3">
                    {quests.map(quest => (
                        <div key={quest.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-white font-bold text-lg">{quest.title}</h3>
                                {quest.status === 'active' && (
                                    <button onClick={() => completeQuest(quest.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
                                        Complete
                                    </button>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm mb-3">{quest.description}</p>
                            {quest.reward && (
                                <div className="bg-yellow-900/20 border border-yellow-700 rounded p-2 mb-3">
                                    <div className="text-yellow-400 text-sm">Reward: {quest.reward}</div>
                                </div>
                            )}
                            {quest.objectives.length > 0 && (
                                <div className="space-y-1">
                                    {quest.objectives.map(obj => (
                                        <div key={obj.id} className="flex items-center gap-2 text-sm">
                                            {obj.completed ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-gray-500" />}
                                            <span className={obj.completed ? 'text-gray-500 line-through' : 'text-gray-300'}>{obj.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Create Quest</h3>
                        <input type="text" placeholder="Quest Title" value={newQuest.title} onChange={e => setNewQuest({ ...newQuest, title: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <textarea placeholder="Description" value={newQuest.description} onChange={e => setNewQuest({ ...newQuest, description: e.target.value })} rows={3} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <input type="text" placeholder="Reward (optional)" value={newQuest.reward} onChange={e => setNewQuest({ ...newQuest, reward: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <div className="flex gap-3">
                            <button onClick={createQuest} disabled={!newQuest.title} className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">
                                Create
                            </button>
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

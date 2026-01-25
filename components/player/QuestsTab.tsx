'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';

interface Quest {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'failed';
    objectives: {
        id: string;
        text: string;
        completed: boolean;
    }[];
    reward?: string;
}

interface QuestsTabProps {
    campaignId: string;
}

export default function QuestsTab({ campaignId }: QuestsTabProps) {
    const [quests, setQuests] = useState<Quest[]>([]);
    const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadQuests();
    }, [campaignId]);

    const loadQuests = async () => {
        try {
            setLoading(true);
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

    const toggleQuest = (questId: string) => {
        const newExpanded = new Set(expandedQuests);
        if (newExpanded.has(questId)) {
            newExpanded.delete(questId);
        } else {
            newExpanded.add(questId);
        }
        setExpandedQuests(newExpanded);
    };

    const getStatusColor = (status: string) => {
        const colors = {
            active: 'bg-blue-900/30 text-blue-400 border-blue-500',
            completed: 'bg-green-900/30 text-green-400 border-green-500',
            failed: 'bg-red-900/30 text-red-400 border-red-500',
        };
        return colors[status as keyof typeof colors] || colors.active;
    };

    if (loading) {
        return <SkeletonList count={3} />;
    }

    const activeQuests = quests.filter(q => q.status === 'active');
    const completedQuests = quests.filter(q => q.status === 'completed');

    return (
        <div className="space-y-6">
            {/* Active Quests */}
            <div>
                <h2 className="text-2xl font-bold text-white mb-4">Active Quests</h2>
                {activeQuests.length === 0 ? (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                        <p className="text-gray-400">No active quests</p>
                        <p className="text-gray-500 text-sm mt-2">Complete objectives to progress your adventure</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activeQuests.map((quest) => {
                            const isExpanded = expandedQuests.has(quest.id);
                            const completedObjectives = quest.objectives?.filter(o => o.completed).length || 0;
                            const totalObjectives = quest.objectives?.length || 0;

                            return (
                                <div
                                    key={quest.id}
                                    className={`bg-gray-800 rounded-lg border p-4 ${getStatusColor(quest.status)}`}
                                >
                                    <div
                                        className="flex items-start justify-between cursor-pointer"
                                        onClick={() => toggleQuest(quest.id)}
                                    >
                                        <div className="flex-1">
                                            <h3 className="text-white font-bold text-lg mb-1">{quest.title}</h3>
                                            {totalObjectives > 0 && (
                                                <div className="text-sm text-gray-400">
                                                    {completedObjectives} / {totalObjectives} objectives completed
                                                </div>
                                            )}
                                        </div>
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>

                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-gray-700">
                                            <p className="text-gray-300 text-sm mb-4">{quest.description}</p>

                                            {quest.objectives && quest.objectives.length > 0 && (
                                                <div className="space-y-2 mb-4">
                                                    <div className="text-sm font-semibold text-gray-400">Objectives:</div>
                                                    {quest.objectives.map((obj) => (
                                                        <div key={obj.id} className="flex items-center gap-2">
                                                            {obj.completed ? (
                                                                <CheckCircle size={16} className="text-green-400" />
                                                            ) : (
                                                                <Circle size={16} className="text-gray-500" />
                                                            )}
                                                            <span className={obj.completed ? 'text-gray-500 line-through' : 'text-gray-300'}>
                                                                {obj.text}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {quest.reward && (
                                                <div className="bg-yellow-900/20 border border-yellow-700 rounded p-3">
                                                    <div className="text-xs text-yellow-500 uppercase mb-1">Reward</div>
                                                    <div className="text-yellow-400 text-sm">{quest.reward}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Completed Quests */}
            {completedQuests.length > 0 && (
                <div>
                    <h3 className="text-xl font-bold text-white mb-4">Completed Quests</h3>
                    <div className="space-y-2">
                        {completedQuests.map((quest) => (
                            <div
                                key={quest.id}
                                className="bg-gray-800/50 rounded-lg border border-green-900/30 p-3 flex items-center gap-3"
                            >
                                <CheckCircle size={20} className="text-green-400" />
                                <div className="flex-1">
                                    <div className="text-white font-semibold">{quest.title}</div>
                                    {quest.reward && <div className="text-yellow-400 text-sm">{quest.reward}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

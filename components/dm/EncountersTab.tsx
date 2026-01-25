'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, RotateCcw, Play, Trash2 } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';

interface Enemy {
    id: string;
    name: string;
    hp_current: number;
    hp_max: number;
    ac: number;
    initiative?: number;
}

interface Encounter {
    id: string;
    name: string;
    enemies: Enemy[];
    status: 'planned' | 'active' | 'completed';
}

interface EncountersTabProps {
    campaignId: string;
}

export default function EncountersTab({ campaignId }: EncountersTabProps) {
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [activeEncounterId, setActiveEncounterId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newEncounterName, setNewEncounterName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEncounters();
    }, [campaignId]);

    const loadEncounters = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('campaign_state')
                .select('encounters')
                .eq('campaign_id', campaignId)
                .single();

            setEncounters(data?.encounters || []);
            const active = (data?.encounters || []).find((e: Encounter) => e.status === 'active');
            setActiveEncounterId(active?.id || null);
        } catch (error) {
            console.error('Error loading encounters:', error);
        } finally {
            setLoading(false);
        }
    };

    const createEncounter = async () => {
        if (!newEncounterName) return;

        const newEncounter: Encounter = {
            id: crypto.randomUUID(),
            name: newEncounterName,
            enemies: [],
            status: 'planned',
        };

        const updatedEncounters = [...encounters, newEncounter];

        try {
            await supabase
                .from('campaign_state')
                .update({ encounters: updatedEncounters })
                .eq('campaign_id', campaignId);

            setEncounters(updatedEncounters);
            setNewEncounterName('');
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating encounter:', error);
        }
    };

    const startEncounter = async (encounterId: string) => {
        const updatedEncounters = encounters.map(e => ({
            ...e,
            status: e.id === encounterId ? 'active' as const : 'planned' as const
        }));

        try {
            await supabase
                .from('campaign_state')
                .update({ encounters: updatedEncounters })
                .eq('campaign_id', campaignId);

            setEncounters(updatedEncounters);
            setActiveEncounterId(encounterId);
        } catch (error) {
            console.error('Error starting encounter:', error);
        }
    };

    const resetEncounter = async (encounterId: string) => {
        const updatedEncounters = encounters.map(encounter => {
            if (encounter.id === encounterId) {
                return {
                    ...encounter,
                    enemies: encounter.enemies.map(enemy => ({
                        ...enemy,
                        hp_current: enemy.hp_max,
                        initiative: undefined,
                    })),
                    status: 'planned' as const,
                };
            }
            return encounter;
        });

        try {
            await supabase
                .from('campaign_state')
                .update({ encounters: updatedEncounters })
                .eq('campaign_id', campaignId);

            setEncounters(updatedEncounters);
            if (activeEncounterId === encounterId) {
                setActiveEncounterId(null);
            }

            alert('Encounter reset! All enemy HP restored and status cleared.');
        } catch (error) {
            console.error('Error resetting encounter:', error);
        }
    };

    const deleteEncounter = async (encounterId: string) => {
        if (!confirm('Delete this encounter?')) return;

        const updatedEncounters = encounters.filter(e => e.id !== encounterId);

        try {
            await supabase
                .from('campaign_state')
                .update({ encounters: updatedEncounters })
                .eq('campaign_id', campaignId);

            setEncounters(updatedEncounters);
            if (activeEncounterId === encounterId) {
                setActiveEncounterId(null);
            }
        } catch (error) {
            console.error('Error deleting encounter:', error);
        }
    };

    const addEnemyToEncounter = async (encounterId: string) => {
        const enemyName = prompt('Enemy name:');
        const enemyHP = prompt('Max HP:');
        const enemyAC = prompt('AC:');

        if (!enemyName || !enemyHP || !enemyAC) return;

        const newEnemy: Enemy = {
            id: crypto.randomUUID(),
            name: enemyName,
            hp_current: parseInt(enemyHP),
            hp_max: parseInt(enemyHP),
            ac: parseInt(enemyAC),
        };

        const updatedEncounters = encounters.map(e => {
            if (e.id === encounterId) {
                return { ...e, enemies: [...e.enemies, newEnemy] };
            }
            return e;
        });

        try {
            await supabase
                .from('campaign_state')
                .update({ encounters: updatedEncounters })
                .eq('campaign_id', campaignId);

            setEncounters(updatedEncounters);
        } catch (error) {
            console.error('Error adding enemy:', error);
        }
    };

    if (loading) {
        return <SkeletonList count={3} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Encounters</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    New Encounter
                </button>
            </div>

            {encounters.length === 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                    <p className="text-gray-400 mb-2">No encounters created</p>
                    <p className="text-gray-500 text-sm">Create encounters to manage combat</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {encounters.map((encounter) => (
                        <div
                            key={encounter.id}
                            className={`bg-gray-800 rounded-lg border p-6 ${encounter.status === 'active' ? 'border-yellow-500' : 'border-gray-700'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1">{encounter.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded ${encounter.status === 'active' ? 'bg-yellow-900/30 text-yellow-400' :
                                        encounter.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                                            'bg-gray-700 text-gray-400'
                                        }`}>
                                        {encounter.status}
                                    </span>
                                </div>

                                <div className="flex gap-2">
                                    {encounter.status !== 'active' && (
                                        <button
                                            onClick={() => startEncounter(encounter.id)}
                                            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                                        >
                                            <Play size={16} />
                                            Start
                                        </button>
                                    )}
                                    <button
                                        onClick={() => resetEncounter(encounter.id)}
                                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                                    >
                                        <RotateCcw size={16} />
                                        Reset
                                    </button>
                                    <button
                                        onClick={() => deleteEncounter(encounter.id)}
                                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Enemies */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-semibold text-gray-400">
                                        Enemies ({encounter.enemies.length})
                                    </div>
                                    <button
                                        onClick={() => addEnemyToEncounter(encounter.id)}
                                        className="text-sm text-yellow-500 hover:text-yellow-400"
                                    >
                                        + Add Enemy
                                    </button>
                                </div>

                                {encounter.enemies.map((enemy) => (
                                    <div
                                        key={enemy.id}
                                        className="bg-gray-900/50 rounded p-3 flex items-center justify-between"
                                    >
                                        <div className="flex-1">
                                            <div className="text-white font-semibold">{enemy.name}</div>
                                            <div className="text-sm text-gray-400">
                                                HP: {enemy.hp_current}/{enemy.hp_max} | AC: {enemy.ac}
                                            </div>
                                        </div>
                                        <div className="w-32 bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-red-500 h-2 rounded-full transition-all"
                                                style={{ width: `${(enemy.hp_current / enemy.hp_max) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {encounter.enemies.length === 0 && (
                                    <div className="text-center text-gray-500 text-sm py-4">
                                        No enemies added yet
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Encounter Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">New Encounter</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Encounter Name</label>
                                <input
                                    type="text"
                                    value={newEncounterName}
                                    onChange={(e) => setNewEncounterName(e.target.value)}
                                    placeholder="Goblin Ambush"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={createEncounter}
                                disabled={!newEncounterName}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Create
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewEncounterName('');
                                }}
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

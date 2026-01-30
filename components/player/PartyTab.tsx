'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Users as UsersIcon, Heart, Shield } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';
import { useRealtimeSubscription } from '@/components/shared/hooks/useRealtimeSubscription';

interface PartyMember {
    id: string;
    character_name: string;
    character_class: string;
    level: number;
    hp_current?: number;
    hp_max?: number;
    ac?: number;
    isNPC: boolean;
}

interface PartyTabProps {
    campaignId: string;
}

export default function PartyTab({ campaignId }: PartyTabProps) {
    const [playerMembers, setPlayerMembers] = useState<PartyMember[]>([]);
    const [npcMembers, setNpcMembers] = useState<PartyMember[]>([]);
    const [loading, setLoading] = useState(true);

    const handleNPCsUpdate = useCallback((npcs: any[]) => {
        const members = (npcs || [])
            .filter((npc: any) => npc.inParty)
            .map((npc: any) => ({
                ...npc,
                isNPC: true,
            }));
        setNpcMembers(members);
    }, []);

    const handlePlayersUpdate = useCallback((payload: any) => {
        const { eventType, new: newRecord } = payload;
        if (eventType === 'UPDATE' || eventType === 'INSERT') {
            setPlayerMembers(prev => {
                const exists = prev.find(p => p.id === newRecord.id);
                if (exists) {
                    return prev.map(p => p.id === newRecord.id ? { ...p, ...newRecord } : p);
                }
                return [...prev, {
                    id: newRecord.id,
                    character_name: newRecord.character_name,
                    character_class: newRecord.character_class || 'Adventurer',
                    level: newRecord.level || 1,
                    isNPC: false
                }];
            });
        }
    }, []);

    const handleStatsUpdate = useCallback((payload: any) => {
        const { eventType, new: newStats } = payload;
        if (eventType === 'UPDATE' || eventType === 'INSERT') {
            setPlayerMembers(prev => prev.map(member =>
                member.id === newStats.campaign_player_id
                    ? { ...member, hp_current: newStats.hp_current, hp_max: newStats.hp_max, ac: newStats.ac }
                    : member
            ));
        }
    }, []);

    useRealtimeSubscription<any[]>(
        campaignId,
        'npcs',
        handleNPCsUpdate
    );

    useRealtimeSubscription(
        campaignId,
        '*',
        handlePlayersUpdate,
        {
            table: 'campaign_players',
            filterColumn: 'campaign_id',
            event: '*'
        }
    );

    useRealtimeSubscription(
        null,
        '*',
        handleStatsUpdate,
        {
            table: 'character_stats',
            filterColumn: '',
            event: '*'
        }
    );

    useEffect(() => {
        loadParty();
    }, [campaignId]);

    const loadParty = async () => {
        try {
            setLoading(true);
            // Load player characters
            const { data: players } = await supabase
                .from('campaign_players')
                .select(`
          id,
          character_name,
          character_class,
          level,
          character_stats (
            hp_current,
            hp_max,
            ac
          )
        `)
                .eq('campaign_id', campaignId);

            const playersList = (players || []).map(p => ({
                id: p.id,
                character_name: p.character_name,
                character_class: p.character_class || 'Adventurer',
                level: p.level || 1,
                hp_current: p.character_stats?.[0]?.hp_current,
                hp_max: p.character_stats?.[0]?.hp_max,
                ac: p.character_stats?.[0]?.ac,
                isNPC: false,
            }));
            setPlayerMembers(playersList);

            // Load NPCs
            const { data: campaignState } = await supabase
                .from('campaign_state')
                .select('npcs')
                .eq('campaign_id', campaignId)
                .single();

            handleNPCsUpdate(campaignState?.npcs || []);
        } catch (error) {
            console.error('Error loading party:', error);
        } finally {
            setLoading(false);
        }
    };

    const partyMembers = [...playerMembers, ...npcMembers];

    if (loading) {
        return <SkeletonList count={3} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <UsersIcon size={28} />
                    Party Members
                </h2>
                <div className="text-gray-400 text-sm">
                    {partyMembers.length} members
                </div>
            </div>

            {partyMembers.length === 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                    <p className="text-gray-400">No party members yet</p>
                    <p className="text-gray-500 text-sm mt-2">Players will appear here as they join</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {partyMembers.map((member) => (
                        <div
                            key={member.id}
                            className={`bg-gray-800 rounded-lg border p-4 ${member.isNPC ? 'border-purple-700' : 'border-gray-700'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-white">{member.character_name}</h3>
                                        {member.isNPC && (
                                            <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded">
                                                NPC
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-400 text-sm">
                                        Level {member.level} {member.character_class}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                {member.hp_max && (
                                    <div className="bg-gray-900/50 rounded p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Heart size={16} className="text-red-400" />
                                            <span className="text-xs text-gray-400">Hit Points</span>
                                        </div>
                                        <div className="text-white font-bold">
                                            {member.hp_current || member.hp_max} / {member.hp_max}
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                                            <div
                                                className="bg-red-500 h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${((member.hp_current || member.hp_max) / member.hp_max) * 100}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {member.ac && (
                                    <div className="bg-gray-900/50 rounded p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Shield size={16} className="text-blue-400" />
                                            <span className="text-xs text-gray-400">Armor Class</span>
                                        </div>
                                        <div className="text-white font-bold text-2xl">{member.ac}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

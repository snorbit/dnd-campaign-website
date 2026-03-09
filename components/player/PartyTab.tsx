'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Users as UsersIcon, Heart, Shield, Activity, Skull, Zap, Star, Mountain, EyeOff, EarOff, Ghost, Hand, Ban, Flame, Droplets, Link, Eye, Sparkles } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';
import { useRealtimeSubscription } from '@/components/shared/hooks/useRealtimeSubscription';
import { useCampaign } from '@/context/CampaignContext';

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
    const { state } = useCampaign();
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

    // Helper to get conditions for a party member if there's an active encounter
    const getConditions = (memberId: string) => {
        if (!state?.encounters || state.encounters.length === 0) return [];
        const activeEncounter = state.encounters.find((e: any) => e.isActive);
        if (!activeEncounter) return [];

        const combatant = activeEncounter.combatants?.find((c: any) => c.refs?.id === memberId || c.name === partyMembers.find((m: any) => m.id === memberId)?.character_name);
        return combatant?.conditions || [];
    };

    // Helper to render lucide icon dynamically based on condition string
    const renderConditionIcon = (iconName: string) => {
        switch (iconName) {
            case 'EyeOff': return <EyeOff size={14} />;
            case 'Heart': return <Heart size={14} />;
            case 'EarOff': return <EarOff size={14} />;
            case 'Ghost': return <Ghost size={14} />;
            case 'Hand': return <Hand size={14} />;
            case 'Ban': return <Ban size={14} />;
            case 'ZapOff': return <Zap size={14} className="text-gray-400" />;
            case 'Mountain': return <Mountain size={14} />;
            case 'FlaskConical': return <Droplets size={14} />;
            case 'ArrowDown': return <Activity size={14} />;
            case 'Link': return <Link size={14} />;
            case 'Star': return <Star size={14} />;
            case 'Moon': return <Activity size={14} />;
            case 'Zap': return <Zap size={14} />;
            case 'Sparkles': return <Sparkles size={14} />;
            case 'Skull': return <Skull size={14} />;
            case 'Eye': return <Eye size={14} />;
            default: return <Activity size={14} />;
        }
    };

    // Dynamic style classes based on conditions list
    const getConditionStyles = (conditions: any[]) => {
        if (conditions.length === 0) return 'border-gray-700 bg-gray-800';

        const ids = conditions.map(c => c.id);

        // Priority styling (worst conditions first)
        if (ids.includes('unconscious') || ids.includes('exhaustion-6')) return 'border-red-900 bg-red-950/40 opacity-70 grayscale';
        if (ids.includes('petrified')) return 'border-gray-500 bg-gray-600/50 grayscale sepia-[.3]';
        if (ids.includes('paralyzed') || ids.includes('stunned')) return 'border-yellow-600 bg-yellow-900/20';
        if (ids.includes('poisoned')) return 'border-green-600 bg-green-900/20';
        if (ids.includes('charmed')) return 'border-pink-600 bg-pink-900/20';
        if (ids.includes('hasted')) return 'border-blue-500 bg-blue-900/20';
        if (ids.includes('blessed')) return 'border-yellow-400 bg-yellow-900/10';
        if (ids.includes('bane') || ids.includes('hexed')) return 'border-purple-600 bg-purple-900/20';

        // Default condition present
        return 'border-orange-700 bg-gray-800';
    };

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
                    {partyMembers.map((member) => {
                        const conditions = getConditions(member.id);
                        const cardStyles = getConditionStyles(conditions);

                        return (
                            <div
                                key={member.id}
                                className={`rounded-lg border p-4 transition-all duration-500 ${cardStyles} ${member.isNPC && conditions.length === 0 ? 'border-purple-700' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-3 relative">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-xl font-bold text-white tracking-wide">{member.character_name}</h3>
                                            {member.isNPC && (
                                                <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded border border-purple-700/50">
                                                    NPC
                                                </span>
                                            )}
                                            {conditions.length > 0 && (
                                                <div className="flex gap-1 ml-2">
                                                    {conditions.map((c: any) => (
                                                        <span
                                                            key={c.id}
                                                            className="px-1.5 py-0.5 bg-black/60 text-gray-200 text-[10px] uppercase tracking-wider font-bold rounded flex items-center gap-1 border border-black/50 backdrop-blur-sm"
                                                            title={c.name}
                                                        >
                                                            {renderConditionIcon(c.iconName)}
                                                            {c.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-400 text-sm mt-0.5">
                                            Level {member.level} {member.character_class}
                                        </p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        );
                    })}
                </div>
            )}
        </div>
    );
}

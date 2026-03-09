'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/shared/ui/Skeleton';
import { useRealtimeSubscription } from '@/components/shared/hooks/useRealtimeSubscription';
import { useCampaign } from '@/context/CampaignContext';
import { Heart, Shield, Activity, Skull, Zap, Star, Mountain, EyeOff, EarOff, Ghost, Hand, Ban, Flame, Droplets, Link, Eye, Sparkles } from 'lucide-react';

interface CharacterStats {
    hp_current: number;
    hp_max: number;
    ac: number;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    proficiency_bonus: number;
}

interface StatsTabProps {
    campaignPlayerId: string;
    level: number;
    characterClass: string;
}

export default function StatsTab({ campaignPlayerId, level, characterClass }: StatsTabProps) {
    const { state } = useCampaign();
    const [stats, setStats] = useState<CharacterStats | null>(null);
    const [loading, setLoading] = useState(true);

    const handleStatsUpdate = useCallback((payload: any) => {
        // payload is the single row update because we subscribe with '*' and it's a single record query
        if (payload.new) {
            setStats(payload.new);
        }
    }, []);

    useRealtimeSubscription(
        campaignPlayerId,
        '*',
        handleStatsUpdate,
        {
            table: 'character_stats',
            filterColumn: 'campaign_player_id',
            event: 'UPDATE'
        }
    );

    useEffect(() => {
        loadStats();
    }, [campaignPlayerId]);

    const loadStats = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('character_stats')
                .select('*')
                .eq('campaign_player_id', campaignPlayerId)
                .single();

            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const getModifier = (score: number) => {
        return Math.floor((score - 10) / 2);
    };

    const formatModifier = (mod: number) => {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    // Helper to get conditions for this player if there's an active encounter
    const getConditions = () => {
        if (!state?.encounters || state.encounters.length === 0) return [];
        const activeEncounter = state.encounters.find((e: any) => e.isActive);
        if (!activeEncounter) return [];

        const combatant = activeEncounter.combatants?.find((c: any) => c.refs?.id === campaignPlayerId);
        return combatant?.conditions || [];
    };

    const conditions = getConditions();

    // Helper to render lucide icon
    const renderConditionIcon = (iconName: string) => {
        switch (iconName) {
            case 'EyeOff': return <EyeOff size={16} />;
            case 'Heart': return <Heart size={16} />;
            case 'EarOff': return <EarOff size={16} />;
            case 'Ghost': return <Ghost size={16} />;
            case 'Hand': return <Hand size={16} />;
            case 'Ban': return <Ban size={16} />;
            case 'ZapOff': return <Zap size={16} className="text-gray-400" />;
            case 'Mountain': return <Mountain size={16} />;
            case 'FlaskConical': return <Droplets size={16} />;
            case 'ArrowDown': return <Activity size={16} />;
            case 'Link': return <Link size={16} />;
            case 'Star': return <Star size={16} />;
            case 'Moon': return <Activity size={16} />;
            case 'Zap': return <Zap size={16} />;
            case 'Sparkles': return <Sparkles size={16} />;
            case 'Skull': return <Skull size={16} />;
            case 'Eye': return <Eye size={16} />;
            default: return <Activity size={16} />;
        }
    };

    // Dynamic style classes based on conditions list
    const getConditionStyles = () => {
        if (conditions.length === 0) return 'border-gray-700 bg-gray-800';

        const ids = conditions.map((c: any) => c.id);

        if (ids.includes('unconscious') || ids.includes('exhaustion-6')) return 'border-red-900 bg-red-950/40 opacity-70 grayscale';
        if (ids.includes('petrified')) return 'border-gray-500 bg-gray-600/50 grayscale sepia-[.3]';
        if (ids.includes('paralyzed') || ids.includes('stunned')) return 'border-yellow-600 bg-yellow-900/20';
        if (ids.includes('poisoned')) return 'border-green-600 bg-green-900/20';
        if (ids.includes('charmed')) return 'border-pink-600 bg-pink-900/20';
        if (ids.includes('hasted')) return 'border-blue-500 bg-blue-900/20';
        if (ids.includes('blessed')) return 'border-yellow-400 bg-yellow-900/10';
        if (ids.includes('bane') || ids.includes('hexed')) return 'border-purple-600 bg-purple-900/20';

        return 'border-orange-700 bg-gray-800';
    };

    if (loading || !stats) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="space-y-2">
                        <Skeleton width="w-32" height="h-8" />
                        <Skeleton width="w-48" height="h-4" />
                    </div>
                </div>

                {/* HP and AC Skeletons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col items-center gap-2">
                        <Skeleton width="w-20" height="h-4" />
                        <Skeleton width="w-32" height="h-8" />
                    </div>
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 flex flex-col items-center gap-2">
                        <Skeleton width="w-20" height="h-4" />
                        <Skeleton width="w-16" height="h-8" />
                    </div>
                </div>

                {/* Ability Scores Skeletons */}
                <div>
                    <Skeleton width="w-40" height="h-6" className="mb-4" />
                    <div className="grid grid-cols-3 gap-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col items-center gap-2">
                                <Skeleton width="w-16" height="h-3" />
                                <Skeleton width="w-12" height="h-6" />
                                <Skeleton width="w-8" height="h-4" />
                            </div>
                        ))}
                    </div>
                </div>

                <Skeleton width="w-full" height="h-16" rounded="rounded-lg" />
            </div>
        );
    }

    const abilities = [
        { name: 'Strength', key: 'str' as keyof CharacterStats, value: stats.str },
        { name: 'Dexterity', key: 'dex' as keyof CharacterStats, value: stats.dex },
        { name: 'Constitution', key: 'con' as keyof CharacterStats, value: stats.con },
        { name: 'Intelligence', key: 'int' as keyof CharacterStats, value: stats.int },
        { name: 'Wisdom', key: 'wis' as keyof CharacterStats, value: stats.wis },
        { name: 'Charisma', key: 'cha' as keyof CharacterStats, value: stats.cha },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <div className="text-white">
                    <h2 className="text-3xl font-bold">Level {level}</h2>
                    <p className="text-gray-400">{characterClass}</p>
                </div>
            </div>

            {/* HP and AC */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border p-6 transition-all duration-500 ${getConditionStyles()}`}>

                {conditions.length > 0 && (
                    <div className="md:col-span-2 flex flex-wrap gap-2 mb-2">
                        {conditions.map((c: any) => (
                            <span
                                key={c.id}
                                className="px-2 py-1 bg-black/60 text-gray-200 text-xs uppercase tracking-wider font-bold rounded flex items-center gap-1.5 border border-black/50 backdrop-blur-sm"
                                title={c.description}
                            >
                                {renderConditionIcon(c.iconName)}
                                {c.name}
                            </span>
                        ))}
                    </div>
                )}

                <div className="bg-gray-900/50 rounded-lg p-6 text-center shadow-inner">
                    <div className="text-gray-400 text-sm mb-2 flex justify-center items-center gap-2"><Heart size={16} className="text-red-500" /> Hit Points</div>
                    <div className="text-4xl font-bold text-red-400">
                        {stats.hp_current} / {stats.hp_max}
                    </div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-6 text-center shadow-inner">
                    <div className="text-gray-400 text-sm mb-2 flex justify-center items-center gap-2"><Shield size={16} className="text-blue-500" /> Armor Class</div>
                    <div className="text-4xl font-bold text-blue-400">{stats.ac}</div>
                </div>
            </div>

            {/* Ability Scores */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">Ability Scores</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {abilities.map((ability) => {
                        const modifier = getModifier(ability.value);
                        return (
                            <div
                                key={ability.key}
                                className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center"
                            >
                                <div className="text-gray-400 text-xs uppercase mb-2">{ability.name}</div>
                                <div className="text-2xl font-bold text-white mb-1">{ability.value}</div>
                                <div className="text-yellow-500 font-semibold text-sm">
                                    {formatModifier(modifier)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Proficiency Bonus */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Proficiency Bonus</span>
                    <span className="text-white font-bold text-xl">
                        +{stats.proficiency_bonus}
                    </span>
                </div>
            </div>
        </div>
    );
}

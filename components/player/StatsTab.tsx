'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/shared/ui/Skeleton';

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
    const [stats, setStats] = useState<CharacterStats | null>(null);
    const [loading, setLoading] = useState(true);

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
                <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
                    <div className="text-gray-400 text-sm mb-2">Hit Points</div>
                    <div className="text-3xl font-bold text-red-400">
                        {stats.hp_current} / {stats.hp_max}
                    </div>
                </div>
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 text-center">
                    <div className="text-gray-400 text-sm mb-2">Armor Class</div>
                    <div className="text-3xl font-bold text-blue-400">{stats.ac}</div>
                </div>
            </div>

            {/* Ability Scores */}
            <div>
                <h3 className="text-xl font-bold text-white mb-4">Ability Scores</h3>
                <div className="grid grid-cols-3 gap-3">
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

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Heart, Shield, User } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';
import { toast } from 'sonner';
import { useRealtimeSubscription } from '@/components/shared/hooks/useRealtimeSubscription';
import { RealtimeStatus } from '@/components/shared/ui/RealtimeStatus';

interface Player {
    id: string;
    player_id: string;
    character_name: string;
    character_class: string;
    level: number;
    username: string;
    stats?: {
        hp_current: number;
        hp_max: number;
        ac: number;
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
}

interface PlayersTabProps {
    campaignId: string;
}

export default function PlayersTab({ campaignId }: PlayersTabProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);

    const handlePlayersUpdate = useCallback((payload: any) => {
        const { eventType, new: newRecord } = payload;
        if (eventType === 'UPDATE' || eventType === 'INSERT') {
            setPlayers(prev => {
                const exists = prev.find(p => p.id === newRecord.id);
                if (exists) {
                    return prev.map(p => p.id === newRecord.id ? { ...p, ...newRecord } : p);
                }
                // For new players, we'd need to re-fetch to get the profile.username correctly
                // but we can add a placeholder for now or trigger a refresh
                loadPlayers();
                return prev;
            });
        }
    }, [campaignId]);

    const handleStatsUpdate = useCallback((payload: any) => {
        const { eventType, new: newStats } = payload;
        if (eventType === 'UPDATE' || eventType === 'INSERT') {
            setPlayers(prev => prev.map(p =>
                p.id === newStats.campaign_player_id
                    ? { ...p, stats: { ...p.stats, ...newStats } }
                    : p
            ));
        }
    }, []);

    const { status: playersStatus } = useRealtimeSubscription(
        campaignId,
        '*',
        handlePlayersUpdate,
        { table: 'campaign_players', filterColumn: 'campaign_id', event: '*' }
    );

    const { status: statsStatus } = useRealtimeSubscription(
        null,
        '*',
        handleStatsUpdate,
        { table: 'character_stats', filterColumn: '', event: '*' }
    );

    const realtimeStatus = playersStatus === 'error' || statsStatus === 'error' ? 'error' :
        playersStatus === 'connecting' || statsStatus === 'connecting' ? 'connecting' : 'connected';

    useEffect(() => {
        loadPlayers();
    }, [campaignId]);

    const loadPlayers = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('campaign_players')
                .select(`
          id,
          player_id,
          character_name,
          character_class,
          level,
          profiles (
            username
          ),
          character_stats (
            hp_current,
            hp_max,
            ac,
            str,
            dex,
            con,
            int,
            wis,
            cha
          )
        `)
                .eq('campaign_id', campaignId);

            const formattedPlayers = (data || []).map((p: any) => ({
                id: p.id,
                player_id: p.player_id,
                character_name: p.character_name,
                character_class: p.character_class || 'Adventurer',
                level: p.level || 1,
                username: p.profiles?.username || 'Unknown',
                stats: p.character_stats?.[0],
            }));

            setPlayers(formattedPlayers);
        } catch (error) {
            console.error('Error loading players:', error);
        } finally {
            setLoading(false);
        }
    };

    const grantLevel = async (playerId: string, currentLevel: number) => {
        const newLevel = currentLevel + 1;

        try {
            await supabase
                .from('campaign_players')
                .update({ level: newLevel })
                .eq('id', playerId);

            loadPlayers();
            toast.success(`Level granted!`, {
                description: `Player is now level ${newLevel}.`,
                icon: '⬆️'
            });
        } catch (error) {
            console.error('Error granting level:', error);
            toast.error('Failed to grant level');
        }
    };

    const getModifier = (score: number) => {
        return Math.floor((score - 10) / 2);
    };

    const formatModifier = (mod: number) => {
        return mod >= 0 ? `+${mod}` : `${mod}`;
    };

    if (loading) {
        return <SkeletonList count={3} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">Players</h2>
                    <RealtimeStatus status={realtimeStatus} />
                </div>
                <div className="text-gray-400 text-sm">{players.length} players</div>
            </div>

            {players.length === 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                    <User size={48} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 mb-2">No players in this campaign</p>
                    <p className="text-gray-500 text-sm">Invite players to join your campaign</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {players.map((player) => (
                        <div
                            key={player.id}
                            className="bg-gray-800 rounded-lg border border-gray-700 p-6"
                        >
                            {/* Player Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{player.character_name}</h3>
                                    <p className="text-gray-400 text-sm">
                                        Level {player.level} {player.character_class}
                                    </p>
                                    <p className="text-gray-500 text-xs">Played by {player.username}</p>
                                </div>
                                <button
                                    onClick={() => grantLevel(player.id, player.level)}
                                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                                >
                                    <TrendingUp size={18} />
                                    Grant Level
                                </button>
                            </div>

                            {/* Stats Grid */}
                            {player.stats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {/* HP */}
                                    <div className="bg-gray-900/50 rounded p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Heart size={14} className="text-red-400" />
                                            <span className="text-xs text-gray-400">HP</span>
                                        </div>
                                        <div className="text-white font-bold">
                                            {player.stats.hp_current} / {player.stats.hp_max}
                                        </div>
                                    </div>

                                    {/* AC */}
                                    <div className="bg-gray-900/50 rounded p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Shield size={14} className="text-blue-400" />
                                            <span className="text-xs text-gray-400">AC</span>
                                        </div>
                                        <div className="text-white font-bold text-xl">{player.stats.ac}</div>
                                    </div>

                                    {/* Main Stats */}
                                    <div className="bg-gray-900/50 rounded p-3 col-span-2">
                                        <div className="text-xs text-gray-400 mb-2">Ability Scores</div>
                                        <div className="grid grid-cols-6 gap-2 text-center">
                                            <div>
                                                <div className="text-gray-500 text-xs">STR</div>
                                                <div className="text-white font-semibold">{player.stats.str}</div>
                                                <div className="text-yellow-500 text-xs">{formatModifier(getModifier(player.stats.str))}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">DEX</div>
                                                <div className="text-white font-semibold">{player.stats.dex}</div>
                                                <div className="text-yellow-500 text-xs">{formatModifier(getModifier(player.stats.dex))}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">CON</div>
                                                <div className="text-white font-semibold">{player.stats.con}</div>
                                                <div className="text-yellow-500 text-xs">{formatModifier(getModifier(player.stats.con))}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">INT</div>
                                                <div className="text-white font-semibold">{player.stats.int}</div>
                                                <div className="text-yellow-500 text-xs">{formatModifier(getModifier(player.stats.int))}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">WIS</div>
                                                <div className="text-white font-semibold">{player.stats.wis}</div>
                                                <div className="text-yellow-500 text-xs">{formatModifier(getModifier(player.stats.wis))}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-500 text-xs">CHA</div>
                                                <div className="text-white font-semibold">{player.stats.cha}</div>
                                                <div className="text-yellow-500 text-xs">{formatModifier(getModifier(player.stats.cha))}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

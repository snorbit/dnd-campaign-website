'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Users as UsersIcon, Heart, Shield } from 'lucide-react';

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
    const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
    const [npcs, setNpcs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
        loadParty();
    }, [campaignId]);

    const loadParty = async () => {
        try {
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

            const playerMembers = (players || []).map(p => ({
                id: p.id,
                character_name: p.character_name,
                character_class: p.character_class || 'Adventurer',
                level: p.level || 1,
                hp_current: p.character_stats?.[0]?.hp_current,
                hp_max: p.character_stats?.[0]?.hp_max,
                ac: p.character_stats?.[0]?.ac,
                isNPC: false,
            }));

            // Load NPCs
            const { data: campaignState } = await supabase
                .from('campaign_state')
                .select('npcs')
                .eq('campaign_id', campaignId)
                .single();

            const npcMembers = (campaignState?.npcs || [])
                .filter((npc: any) => npc.inParty)
                .map((npc: any) => ({
                    ...npc,
                    isNPC: true,
                }));

            setPartyMembers([...playerMembers, ...npcMembers]);
        } catch (error) {
            console.error('Error loading party:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-gray-400">Loading party...</div>;
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

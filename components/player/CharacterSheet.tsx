'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/shared/ui/Skeleton';
import { Heart, Shield, Zap, Footprints, Award, BookOpen } from 'lucide-react';

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
    speed: number;
    initiative_bonus: number;
    skills: {
        [key: string]: {
            proficient: boolean;
            expertise: boolean;
        };
    };
    saving_throws: {
        str: boolean;
        dex: boolean;
        con: boolean;
        int: boolean;
        wis: boolean;
        cha: boolean;
    };
}

interface Spell {
    id: string;
    spell_name: string;
    spell_level: number;
    school: string;
    casting_time: string;
    range: string;
    components: string;
    duration: string;
    description: string;
    is_prepared: boolean;
}

interface Feat {
    id: string;
    name: string;
    description: string;
    level_acquired: number;
}

interface CharacterSheetProps {
    campaignPlayerId: string;
    characterName: string;
    characterClass: string;
    level: number;
    race?: string;
}

const SKILLS = [
    { name: 'Acrobatics', key: 'acrobatics', ability: 'dex' },
    { name: 'Animal Handling', key: 'animal_handling', ability: 'wis' },
    { name: 'Arcana', key: 'arcana', ability: 'int' },
    { name: 'Athletics', key: 'athletics', ability: 'str' },
    { name: 'Deception', key: 'deception', ability: 'cha' },
    { name: 'History', key: 'history', ability: 'int' },
    { name: 'Insight', key: 'insight', ability: 'wis' },
    { name: 'Intimidation', key: 'intimidation', ability: 'cha' },
    { name: 'Investigation', key: 'investigation', ability: 'int' },
    { name: 'Medicine', key: 'medicine', ability: 'wis' },
    { name: 'Nature', key: 'nature', ability: 'int' },
    { name: 'Perception', key: 'perception', ability: 'wis' },
    { name: 'Performance', key: 'performance', ability: 'cha' },
    { name: 'Persuasion', key: 'persuasion', ability: 'cha' },
    { name: 'Religion', key: 'religion', ability: 'int' },
    { name: 'Sleight of Hand', key: 'sleight_of_hand', ability: 'dex' },
    { name: 'Stealth', key: 'stealth', ability: 'dex' },
    { name: 'Survival', key: 'survival', ability: 'wis' },
];

export default function CharacterSheet({
    campaignPlayerId,
    characterName,
    characterClass,
    level,
    race,
}: CharacterSheetProps) {
    const [stats, setStats] = useState<CharacterStats | null>(null);
    const [spells, setSpells] = useState<Spell[]>([]);
    const [feats, setFeats] = useState<Feat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCharacterData();
    }, [campaignPlayerId]);

    const loadCharacterData = async () => {
        try {
            setLoading(true);

            // Load stats
            const { data: statsData } = await supabase
                .from('character_stats')
                .select('*')
                .eq('campaign_player_id', campaignPlayerId)
                .single();

            setStats(statsData);

            // Load spells
            const { data: spellsData } = await supabase
                .from('player_spells')
                .select('*')
                .eq('campaign_player_id', campaignPlayerId)
                .order('spell_level', { ascending: true });

            setSpells(spellsData || []);

            // Load feats
            const { data: featsData } = await supabase
                .from('player_feats')
                .select(`
                    id,
                    level_acquired,
                    feat_id,
                    feat_type
                `)
                .eq('campaign_player_id', campaignPlayerId);

            // Fetch feat details
            if (featsData && featsData.length > 0) {
                const standardFeats = featsData.filter(f => f.feat_type === 'standard');
                const homebrewFeats = featsData.filter(f => f.feat_type === 'homebrew');

                const standardDetails = standardFeats.length > 0
                    ? await supabase.from('standard_feats').select('*').in('id', standardFeats.map(f => f.feat_id))
                    : { data: [] };

                const homebrewDetails = homebrewFeats.length > 0
                    ? await supabase.from('homebrew_feats').select('*').in('id', homebrewFeats.map(f => f.feat_id))
                    : { data: [] };

                const allFeats = [
                    ...(standardDetails.data || []).map(f => ({
                        ...f,
                        level_acquired: featsData.find(fd => fd.feat_id === f.id)?.level_acquired || 0
                    })),
                    ...(homebrewDetails.data || []).map(f => ({
                        ...f,
                        level_acquired: featsData.find(fd => fd.feat_id === f.id)?.level_acquired || 0
                    }))
                ];

                setFeats(allFeats);
            }
        } catch (error) {
            console.error('Error loading character data:', error);
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

    const calculateSkillBonus = (
        abilityKey: string,
        skillKey: string
    ) => {
        if (!stats) return 0;

        const abilityScore = stats[abilityKey as keyof CharacterStats] as number;
        const abilityMod = getModifier(abilityScore);
        const skillData = stats.skills[skillKey];

        let bonus = abilityMod;
        if (skillData?.proficient) bonus += stats.proficiency_bonus;
        if (skillData?.expertise) bonus += stats.proficiency_bonus;

        return bonus;
    };

    const calculateSavingThrow = (abilityKey: string) => {
        if (!stats) return 0;

        const abilityScore = stats[abilityKey as keyof CharacterStats] as number;
        const abilityMod = getModifier(abilityScore);
        const isProficient = stats.saving_throws[abilityKey as keyof typeof stats.saving_throws];

        return isProficient ? abilityMod + stats.proficiency_bonus : abilityMod;
    };

    if (loading || !stats) {
        return (
            <div className="space-y-6">
                <Skeleton width="w-full" height="h-32" />
                <Skeleton width="w-full" height="h-64" />
                <Skeleton width="w-full" height="h-96" />
            </div>
        );
    }

    const abilities = [
        { name: 'Strength', key: 'str', value: stats.str },
        { name: 'Dexterity', key: 'dex', value: stats.dex },
        { name: 'Constitution', key: 'con', value: stats.con },
        { name: 'Intelligence', key: 'int', value: stats.int },
        { name: 'Wisdom', key: 'wis', value: stats.wis },
        { name: 'Charisma', key: 'cha', value: stats.cha },
    ];

    const passivePerception = 10 + calculateSkillBonus('wis', 'perception');
    const initiative = getModifier(stats.dex) + (stats.initiative_bonus || 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-yellow-800/20 border border-yellow-600/50 rounded-lg p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-1">{characterName}</h2>
                        <p className="text-gray-300">
                            Level {level} {race && `${race} `}{characterClass}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-400">Proficiency Bonus</div>
                        <div className="text-2xl font-bold text-yellow-400">+{stats.proficiency_bonus}</div>
                    </div>
                </div>
            </div>

            {/* Core Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                        <Heart size={20} />
                        <span className="text-sm">Hit Points</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {stats.hp_current} / {stats.hp_max}
                    </div>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-blue-400 mb-2">
                        <Shield size={20} />
                        <span className="text-sm">Armor Class</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.ac}</div>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
                        <Zap size={20} />
                        <span className="text-sm">Initiative</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{formatModifier(initiative)}</div>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-400 mb-2">
                        <Footprints size={20} />
                        <span className="text-sm">Speed</span>
                    </div>
                    <div className="text-3xl font-bold text-white">{stats.speed} ft</div>
                </div>
            </div>

            {/* Ability Scores & Saving Throws */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Ability Scores</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {abilities.map((ability) => {
                        const modifier = getModifier(ability.value);
                        const savingThrow = calculateSavingThrow(ability.key);
                        const isProficient = stats.saving_throws[ability.key as keyof typeof stats.saving_throws];

                        return (
                            <div key={ability.key} className="text-center">
                                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                    <div className="text-gray-400 text-xs uppercase mb-2">{ability.name}</div>
                                    <div className="text-3xl font-bold text-white mb-1">{ability.value}</div>
                                    <div className="text-yellow-500 font-semibold text-lg mb-2">
                                        {formatModifier(modifier)}
                                    </div>
                                    <div className="border-t border-gray-700 pt-2">
                                        <div className="text-xs text-gray-500 mb-1">Save</div>
                                        <div className={`text-sm font-bold ${isProficient ? 'text-blue-400' : 'text-gray-400'}`}>
                                            {formatModifier(savingThrow)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Skills */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h3 className="text-xl font-bold text-white mb-4">Skills</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {SKILLS.map((skill) => {
                        const bonus = calculateSkillBonus(skill.ability, skill.key);
                        const skillData = stats.skills[skill.key];

                        return (
                            <div key={skill.key} className="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded">
                                <div className="flex items-center gap-2">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${skillData?.expertise
                                            ? 'bg-yellow-500 border-yellow-500'
                                            : skillData?.proficient
                                                ? 'bg-blue-500 border-blue-500'
                                                : 'border-gray-600'
                                        }`}>
                                        {skillData?.expertise && <div className="w-2 h-2 bg-white rounded-full" />}
                                    </div>
                                    <span className="text-gray-300">{skill.name}</span>
                                    <span className="text-xs text-gray-500">({skill.ability.toUpperCase()})</span>
                                </div>
                                <span className="text-white font-bold">{formatModifier(bonus)}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between">
                    <span className="text-gray-400">Passive Perception</span>
                    <span className="text-white font-bold text-xl">{passivePerception}</span>
                </div>
            </div>

            {/* Feats */}
            {feats.length > 0 && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="text-purple-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Feats</h3>
                    </div>
                    <div className="space-y-3">
                        {feats.map((feat) => (
                            <div key={feat.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                                <div className="flex items-start justify-between mb-2">
                                    <h4 className="text-white font-bold">{feat.name}</h4>
                                    <span className="text-xs text-gray-500">Level {feat.level_acquired}</span>
                                </div>
                                <p className="text-gray-400 text-sm">{feat.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Spells */}
            {spells.length > 0 && (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="text-blue-400" size={24} />
                        <h3 className="text-xl font-bold text-white">Spells</h3>
                    </div>
                    <div className="space-y-4">
                        {[...Array(10)].map((_, level) => {
                            const levelSpells = spells.filter(s => s.spell_level === level);
                            if (levelSpells.length === 0) return null;

                            return (
                                <div key={level}>
                                    <h4 className="text-yellow-400 font-bold mb-2">
                                        {level === 0 ? 'Cantrips' : `Level ${level}`}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {levelSpells.map((spell) => (
                                            <div
                                                key={spell.id}
                                                className={`p-3 rounded border ${spell.is_prepared
                                                        ? 'bg-blue-900/30 border-blue-500'
                                                        : 'bg-gray-900 border-gray-700'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="text-white font-semibold">{spell.spell_name}</div>
                                                        <div className="text-xs text-gray-400">{spell.school}</div>
                                                    </div>
                                                    {spell.is_prepared && (
                                                        <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                                                            Prepared
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

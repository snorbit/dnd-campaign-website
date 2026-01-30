'use client';

import { useState } from 'react';
import {
    Dices,
    Save,
    Copy,
    RefreshCw,
    ChevronDown,
    User,
    Shield,
    Heart,
    Footprints,
    Star,
    Sparkles,
    BookOpen,
    Check,
    History,
    X,
} from 'lucide-react';
import {
    useNPCGenerator,
    GeneratedNPC,
    formatNPCAsText,
    AbilityScores,
} from '@/components/shared/hooks/useNPCGenerator';
import { NPC_RACES } from '@/lib/npc-data/races';
import { NPC_CLASSES, ADVENTURER_CLASSES, OCCUPATION_CLASSES } from '@/lib/npc-data/classes';
import styles from './NPCGenerator.module.css';

interface NPCGeneratorProps {
    campaignId: string;
    onSaveNPC?: (npc: { name: string; race: string; role: string; notes: string }) => Promise<void>;
}

const ABILITY_LABELS: Record<keyof AbilityScores, { label: string; color: string }> = {
    str: { label: 'STR', color: 'text-red-400' },
    dex: { label: 'DEX', color: 'text-green-400' },
    con: { label: 'CON', color: 'text-orange-400' },
    int: { label: 'INT', color: 'text-blue-400' },
    wis: { label: 'WIS', color: 'text-purple-400' },
    cha: { label: 'CHA', color: 'text-pink-400' },
};

const getAbilityModifier = (score: number): string => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
};

export const NPCGenerator = ({ campaignId, onSaveNPC }: NPCGeneratorProps) => {
    const {
        generatedNPC,
        isGenerating,
        history,
        generateNPC,
        clearNPC,
        selectFromHistory,
    } = useNPCGenerator();

    const [filters, setFilters] = useState({
        race: '',
        class: '',
        level: 0,
        classType: 'all' as 'all' | 'adventurer' | 'occupation',
    });

    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const handleGenerate = () => {
        generateNPC({
            race: filters.race || undefined,
            class: filters.class || undefined,
            level: filters.level > 0 ? filters.level : undefined,
            includeAdventurers: filters.classType === 'all' || filters.classType === 'adventurer',
            includeOccupations: filters.classType === 'all' || filters.classType === 'occupation',
        });
        setCopied(false);
        setSaved(false);
    };

    const handleCopy = async () => {
        if (!generatedNPC) {
            return;
        }

        const text = formatNPCAsText(generatedNPC);
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!generatedNPC || !onSaveNPC) {
            return;
        }

        await onSaveNPC({
            name: generatedNPC.name,
            race: generatedNPC.race.name,
            role: generatedNPC.class.name,
            notes: `Level ${generatedNPC.level} | HP: ${generatedNPC.hp} | AC: ${generatedNPC.ac}\n${generatedNPC.personality}\nQuirk: ${generatedNPC.quirk}`,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const classOptions = filters.classType === 'adventurer'
        ? ADVENTURER_CLASSES
        : filters.classType === 'occupation'
            ? OCCUPATION_CLASSES
            : NPC_CLASSES;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-900/30 via-amber-900/20 to-orange-900/30 border border-yellow-600/30 p-6">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 ${isGenerating ? styles.diceRoll : ''}`}>
                            <Dices className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
                                NPC Generator
                            </h2>
                            <p className="text-yellow-200/60 text-sm">
                                Forge heroes and villains with a roll of the dice
                            </p>
                        </div>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-3 rounded-xl border transition-all ${showHistory
                                    ? 'bg-yellow-600/20 border-yellow-500/50 text-yellow-400'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                                }`}
                            title="View History"
                        >
                            <History size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* History Panel */}
            {showHistory && history.length > 0 && (
                <div className={`rounded-xl bg-gray-800/80 border border-gray-700 p-4 ${styles.slideIn}`}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">Recent Creations</span>
                        <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {history.map((npc) => (
                            <button
                                key={npc.id}
                                onClick={() => {
                                    selectFromHistory(npc.id);
                                    setShowHistory(false);
                                }}
                                className="w-full text-left p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors"
                            >
                                <span className="font-medium text-white">{npc.name}</span>
                                <span className="text-gray-400 text-sm ml-2">
                                    {npc.race.name} {npc.class.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Race Filter */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-bold block">
                        Race
                    </label>
                    <div className="relative">
                        <select
                            value={filters.race}
                            onChange={(e) => setFilters({ ...filters, race: e.target.value })}
                            className="w-full appearance-none px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition-all cursor-pointer"
                        >
                            <option value="">Any Race</option>
                            {NPC_RACES.map((race) => (
                                <option key={race.id} value={race.id}>
                                    {race.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Class Type Filter */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-bold block">
                        Type
                    </label>
                    <div className="relative">
                        <select
                            value={filters.classType}
                            onChange={(e) => setFilters({ ...filters, classType: e.target.value as 'all' | 'adventurer' | 'occupation', class: '' })}
                            className="w-full appearance-none px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition-all cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            <option value="adventurer">Adventurers</option>
                            <option value="occupation">Commoners</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Class Filter */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-bold block">
                        Class/Role
                    </label>
                    <div className="relative">
                        <select
                            value={filters.class}
                            onChange={(e) => setFilters({ ...filters, class: e.target.value })}
                            className="w-full appearance-none px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition-all cursor-pointer"
                        >
                            <option value="">Any Class</option>
                            {classOptions.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Level Filter */}
                <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wider text-gray-400 font-bold block">
                        Level
                    </label>
                    <div className="relative">
                        <select
                            value={filters.level}
                            onChange={(e) => setFilters({ ...filters, level: parseInt(e.target.value) })}
                            className="w-full appearance-none px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/30 transition-all cursor-pointer"
                        >
                            <option value="0">Random (1-5)</option>
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((lvl) => (
                                <option key={lvl} value={lvl}>
                                    Level {lvl}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${isGenerating
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white shadow-lg shadow-yellow-600/25 hover:shadow-yellow-500/40 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
            >
                <Dices className={`w-6 h-6 ${isGenerating ? styles.diceRoll : ''}`} />
                {isGenerating ? 'Conjuring...' : 'Generate Random NPC'}
            </button>

            {/* Generated NPC Card */}
            {generatedNPC && (
                <div className={`${styles.cardAppear} relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border border-yellow-600/30 shadow-2xl`}>
                    {/* Decorative corner elements */}
                    <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent" />
                    <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-yellow-500/10 to-transparent" />

                    {/* Header */}
                    <div className="relative px-6 py-5 border-b border-yellow-600/20 bg-gradient-to-r from-yellow-900/20 via-transparent to-amber-900/20">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-yellow-100 tracking-wide">
                                    {generatedNPC.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                                        {generatedNPC.race.name}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-600/20 text-purple-400 border border-purple-600/30">
                                        {generatedNPC.class.name}
                                    </span>
                                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                        Level {generatedNPC.level}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleGenerate}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
                                    title="Re-generate"
                                >
                                    <RefreshCw size={18} />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={`p-2 rounded-lg transition-all ${copied
                                            ? 'bg-green-600/20 text-green-400'
                                            : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
                                        }`}
                                    title="Copy to Clipboard"
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                                {onSaveNPC && (
                                    <button
                                        onClick={handleSave}
                                        className={`p-2 rounded-lg transition-all ${saved
                                                ? 'bg-green-600/20 text-green-400'
                                                : 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400'
                                            }`}
                                        title="Save to Campaign"
                                    >
                                        {saved ? <Check size={18} /> : <Save size={18} />}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* HP */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-900/20 border border-red-700/30">
                                <Heart className="w-5 h-5 text-red-400" />
                                <div>
                                    <div className="text-xs text-red-400/70 uppercase font-bold">HP</div>
                                    <div className="text-xl font-bold text-red-300">{generatedNPC.hp}</div>
                                </div>
                            </div>

                            {/* AC */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-900/20 border border-blue-700/30">
                                <Shield className="w-5 h-5 text-blue-400" />
                                <div>
                                    <div className="text-xs text-blue-400/70 uppercase font-bold">AC</div>
                                    <div className="text-xl font-bold text-blue-300">{generatedNPC.ac}</div>
                                </div>
                            </div>

                            {/* Speed */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-900/20 border border-green-700/30">
                                <Footprints className="w-5 h-5 text-green-400" />
                                <div>
                                    <div className="text-xs text-green-400/70 uppercase font-bold">Speed</div>
                                    <div className="text-xl font-bold text-green-300">{generatedNPC.speed}ft</div>
                                </div>
                            </div>
                        </div>

                        {/* Ability Scores */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-yellow-500" />
                                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                                    Ability Scores
                                </span>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                                {(Object.entries(generatedNPC.abilities) as [keyof AbilityScores, number][]).map(
                                    ([key, value]) => (
                                        <div
                                            key={key}
                                            className="relative group p-3 rounded-xl bg-gray-700/50 border border-gray-600/50 text-center hover:border-yellow-500/30 transition-all"
                                        >
                                            <div className={`text-xs font-black ${ABILITY_LABELS[key].color}`}>
                                                {ABILITY_LABELS[key].label}
                                            </div>
                                            <div className="text-2xl font-bold text-white">{value}</div>
                                            <div className="text-sm text-gray-400">{getAbilityModifier(value)}</div>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        {/* Background & Skills */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <BookOpen className="w-4 h-4 text-amber-500" />
                                    <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                                        Background
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-amber-900/10 border border-amber-700/30">
                                    <div className="font-medium text-amber-200">{generatedNPC.background.name}</div>
                                    <div className="text-xs text-amber-400/60 mt-1">
                                        {generatedNPC.background.feature}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Star className="w-4 h-4 text-cyan-500" />
                                    <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                                        Skills
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-cyan-900/10 border border-cyan-700/30">
                                    <div className="flex flex-wrap gap-1">
                                        {generatedNPC.skills.map((skill) => (
                                            <span
                                                key={skill}
                                                className="px-2 py-0.5 text-xs rounded-full bg-cyan-600/20 text-cyan-300"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personality Section */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <User className="w-4 h-4 text-pink-500" />
                                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                                    Personality
                                </span>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 rounded-xl bg-gray-700/30 border border-gray-600/30">
                                    <div className="text-xs text-pink-400 font-bold mb-1">Trait</div>
                                    <div className="text-sm text-gray-200">{generatedNPC.personality}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-gray-700/30 border border-gray-600/30">
                                        <div className="text-xs text-yellow-400 font-bold mb-1">Ideal</div>
                                        <div className="text-sm text-gray-200">{generatedNPC.ideal}</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gray-700/30 border border-gray-600/30">
                                        <div className="text-xs text-blue-400 font-bold mb-1">Bond</div>
                                        <div className="text-sm text-gray-200">{generatedNPC.bond}</div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-gray-700/30 border border-gray-600/30">
                                        <div className="text-xs text-red-400 font-bold mb-1">Flaw</div>
                                        <div className="text-sm text-gray-200">{generatedNPC.flaw}</div>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gray-700/30 border border-gray-600/30">
                                        <div className="text-xs text-purple-400 font-bold mb-1">Quirk</div>
                                        <div className="text-sm text-gray-200">{generatedNPC.quirk}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Racial Traits */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-violet-500" />
                                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">
                                    Racial Traits
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {generatedNPC.traits.map((trait) => (
                                    <span
                                        key={trait}
                                        className="px-3 py-1 text-xs rounded-full bg-violet-600/20 text-violet-300 border border-violet-600/30"
                                    >
                                        {trait}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!generatedNPC && (
                <div className="py-16 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-600/10 border border-yellow-600/20 mb-4">
                        <Dices className="w-10 h-10 text-yellow-600/50" />
                    </div>
                    <p className="text-gray-400 text-lg">
                        Click the button above to generate a random NPC
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                        Use the filters to customize race, class, and level
                    </p>
                </div>
            )}
        </div>
    );
};

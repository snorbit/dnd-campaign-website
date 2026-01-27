/**
 * useNPCGenerator Hook
 * Custom hook for generating random NPCs
 */

import { useState, useCallback } from 'react';
import { NPC_NAMES, RaceKey } from '@/lib/npc-data/names';
import { NPC_RACES, Race } from '@/lib/npc-data/races';
import { NPC_CLASSES, NPCClass, ADVENTURER_CLASSES, OCCUPATION_CLASSES } from '@/lib/npc-data/classes';
import { PERSONALITY_TRAITS, IDEALS, BONDS, FLAWS, QUIRKS } from '@/lib/npc-data/personalities';
import { NPC_BACKGROUNDS, Background } from '@/lib/npc-data/backgrounds';

export interface AbilityScores {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}

export interface GeneratedNPC {
    id: string;
    name: string;
    race: Race;
    class: NPCClass;
    background: Background;
    level: number;
    abilities: AbilityScores;
    hp: number;
    ac: number;
    speed: number;
    proficiencyBonus: number;
    personality: string;
    ideal: string;
    bond: string;
    flaw: string;
    quirk: string;
    traits: string[];
    skills: string[];
    languages: string[];
    generatedAt: Date;
}

export interface GenerateNPCOptions {
    race?: string;
    class?: string;
    level?: number;
    includeAdventurers?: boolean;
    includeOccupations?: boolean;
}

/**
 * Utility function to pick a random element from an array
 */
const randomFrom = <T>(array: T[]): T => {
    return array[Math.floor(Math.random() * array.length)];
};

/**
 * Roll 4d6 and drop the lowest die (standard D&D ability score generation)
 */
const rollAbilityScore = (): number => {
    const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
    rolls.sort((a, b) => b - a);
    return rolls.slice(0, 3).reduce((sum, roll) => sum + roll, 0);
};

/**
 * Calculate ability modifier from score
 */
const getAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
};

/**
 * Calculate proficiency bonus from level
 */
const getProficiencyBonus = (level: number): number => {
    return Math.floor((level - 1) / 4) + 2;
};

/**
 * Calculate HP based on class, level, and constitution
 */
const calculateHP = (npcClass: NPCClass, level: number, conModifier: number): number => {
    // First level: max hit die + con modifier
    const firstLevelHP = npcClass.hitDie + conModifier;

    // Additional levels: average hit die roll + con modifier per level
    const avgHitDieRoll = (npcClass.hitDie / 2) + 1;
    const additionalHP = (level - 1) * (avgHitDieRoll + conModifier);

    return Math.max(1, Math.floor(firstLevelHP + additionalHP));
};

/**
 * Calculate AC (base 10 + dex modifier, no armor)
 */
const calculateAC = (dexModifier: number): number => {
    return 10 + dexModifier;
};

export const useNPCGenerator = () => {
    const [generatedNPC, setGeneratedNPC] = useState<GeneratedNPC | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [history, setHistory] = useState<GeneratedNPC[]>([]);

    const generateNPC = useCallback((options?: GenerateNPCOptions): GeneratedNPC => {
        setIsGenerating(true);

        try {
            // Determine which class pool to use
            let classPool = NPC_CLASSES;
            if (options?.includeAdventurers === true && options?.includeOccupations === false) {
                classPool = ADVENTURER_CLASSES;
            } else if (options?.includeAdventurers === false && options?.includeOccupations === true) {
                classPool = OCCUPATION_CLASSES;
            }

            // Select race (from options or random)
            const race = options?.race
                ? NPC_RACES.find(r => r.id === options.race || r.name === options.race) || randomFrom(NPC_RACES)
                : randomFrom(NPC_RACES);

            // Select class (from options or random)
            const npcClass = options?.class
                ? classPool.find(c => c.id === options.class || c.name === options.class) || randomFrom(classPool)
                : randomFrom(classPool);

            // Generate name based on race
            const raceKey = race.id as RaceKey;
            const nameData = NPC_NAMES[raceKey] || NPC_NAMES.human;
            const firstName = randomFrom([...nameData.first]);
            const lastName = randomFrom([...nameData.last]);

            // Generate base ability scores
            const baseAbilities: AbilityScores = {
                str: rollAbilityScore(),
                dex: rollAbilityScore(),
                con: rollAbilityScore(),
                int: rollAbilityScore(),
                wis: rollAbilityScore(),
                cha: rollAbilityScore(),
            };

            // Apply racial ability bonuses
            const abilities: AbilityScores = { ...baseAbilities };
            Object.entries(race.abilityBonuses).forEach(([ability, bonus]) => {
                if (ability in abilities) {
                    abilities[ability as keyof AbilityScores] += bonus;
                }
            });

            // Determine level
            const level = options?.level || Math.floor(Math.random() * 5) + 1;

            // Calculate derived stats
            const conModifier = getAbilityModifier(abilities.con);
            const dexModifier = getAbilityModifier(abilities.dex);
            const proficiencyBonus = getProficiencyBonus(level);
            const hp = calculateHP(npcClass, level, conModifier);
            const ac = calculateAC(dexModifier);

            // Select background
            const background = randomFrom(NPC_BACKGROUNDS);

            // Generate personality
            const personality = randomFrom(PERSONALITY_TRAITS);
            const ideal = randomFrom(IDEALS).trait;
            const bond = randomFrom(BONDS);
            const flaw = randomFrom(FLAWS);
            const quirk = randomFrom(QUIRKS);

            // Combine traits and skills
            const traits = [...race.traits];
            const skills = [...background.skills];
            const languages = [...race.languages];

            const npc: GeneratedNPC = {
                id: crypto.randomUUID(),
                name: `${firstName} ${lastName}`,
                race,
                class: npcClass,
                background,
                level,
                abilities,
                hp,
                ac,
                speed: race.speed,
                proficiencyBonus,
                personality,
                ideal,
                bond,
                flaw,
                quirk,
                traits,
                skills,
                languages,
                generatedAt: new Date(),
            };

            setGeneratedNPC(npc);
            setHistory(prev => [npc, ...prev].slice(0, 10)); // Keep last 10 NPCs

            return npc;
        } finally {
            setIsGenerating(false);
        }
    }, []);

    const clearNPC = useCallback(() => {
        setGeneratedNPC(null);
    }, []);

    const clearHistory = useCallback(() => {
        setHistory([]);
    }, []);

    const selectFromHistory = useCallback((id: string) => {
        const npc = history.find(n => n.id === id);
        if (npc) {
            setGeneratedNPC(npc);
        }
    }, [history]);

    return {
        generatedNPC,
        isGenerating,
        history,
        generateNPC,
        clearNPC,
        clearHistory,
        selectFromHistory,
    };
};

/**
 * Format NPC as text for clipboard
 */
export const formatNPCAsText = (npc: GeneratedNPC): string => {
    const abilityLine = Object.entries(npc.abilities)
        .map(([key, val]) => `${key.toUpperCase()}: ${val} (${getAbilityModifier(val) >= 0 ? '+' : ''}${getAbilityModifier(val)})`)
        .join(' | ');

    return `
═══════════════════════════════════════
${npc.name}
${npc.race.name} ${npc.class.name} (Level ${npc.level})
Background: ${npc.background.name}
═══════════════════════════════════════

STATS
─────────────────────────────────────
${abilityLine}

HP: ${npc.hp} | AC: ${npc.ac} | Speed: ${npc.speed}ft
Proficiency Bonus: +${npc.proficiencyBonus}

SKILLS & TRAITS
─────────────────────────────────────
Skills: ${npc.skills.join(', ')}
Racial Traits: ${npc.traits.join(', ')}
Languages: ${npc.languages.join(', ')}

PERSONALITY
─────────────────────────────────────
Trait: ${npc.personality}
Ideal: ${npc.ideal}
Bond: ${npc.bond}
Flaw: ${npc.flaw}
Quirk: ${npc.quirk}
═══════════════════════════════════════
`.trim();
};

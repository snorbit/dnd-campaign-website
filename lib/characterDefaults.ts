export const DEFAULT_SKILLS = {
    acrobatics: { proficient: false, expertise: false },
    animal_handling: { proficient: false, expertise: false },
    arcana: { proficient: false, expertise: false },
    athletics: { proficient: false, expertise: false },
    deception: { proficient: false, expertise: false },
    history: { proficient: false, expertise: false },
    insight: { proficient: false, expertise: false },
    intimidation: { proficient: false, expertise: false },
    investigation: { proficient: false, expertise: false },
    medicine: { proficient: false, expertise: false },
    nature: { proficient: false, expertise: false },
    perception: { proficient: false, expertise: false },
    performance: { proficient: false, expertise: false },
    persuasion: { proficient: false, expertise: false },
    religion: { proficient: false, expertise: false },
    sleight_of_hand: { proficient: false, expertise: false },
    stealth: { proficient: false, expertise: false },
    survival: { proficient: false, expertise: false },
};

export const DEFAULT_SAVING_THROWS = {
    str: false,
    dex: false,
    con: false,
    int: false,
    wis: false,
    cha: false,
};

export interface AbilityScores {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}

export interface CharacterStatsDefaults extends AbilityScores {
    hp_current: number;
    hp_max: number;
    ac: number;
    proficiency_bonus: number;
    speed: number;
    initiative_bonus: number;
    skills: typeof DEFAULT_SKILLS;
    saving_throws: typeof DEFAULT_SAVING_THROWS;
}

export function proficiencyBonusForLevel(level: number) {
    return Math.floor((Math.max(level, 1) - 1) / 4) + 2;
}

export function buildCharacterStatsDefaults(
    abilityScores: Partial<AbilityScores> = {},
    level = 1
): CharacterStatsDefaults {
    const str = abilityScores.str ?? 10;
    const dex = abilityScores.dex ?? 10;
    const con = abilityScores.con ?? 10;
    const int = abilityScores.int ?? 10;
    const wis = abilityScores.wis ?? 10;
    const cha = abilityScores.cha ?? 10;
    const conModifier = Math.floor((con - 10) / 2);
    const hpMax = Math.max(1, 10 + conModifier);

    return {
        hp_current: hpMax,
        hp_max: hpMax,
        ac: 10 + Math.floor((dex - 10) / 2),
        str,
        dex,
        con,
        int,
        wis,
        cha,
        proficiency_bonus: proficiencyBonusForLevel(level),
        speed: 30,
        initiative_bonus: 0,
        skills: DEFAULT_SKILLS,
        saving_throws: DEFAULT_SAVING_THROWS,
    };
}

export function normalizeCharacterStats<T extends Partial<CharacterStatsDefaults> | null | undefined>(
    stats: T,
    fallbackAbilityScores: Partial<AbilityScores> = {},
    level = 1
) {
    return {
        ...buildCharacterStatsDefaults(fallbackAbilityScores, level),
        ...(stats || {}),
        skills: { ...DEFAULT_SKILLS, ...((stats as any)?.skills || {}) },
        saving_throws: { ...DEFAULT_SAVING_THROWS, ...((stats as any)?.saving_throws || {}) },
    };
}

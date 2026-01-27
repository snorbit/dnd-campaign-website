/**
 * D&D 5e Class Data for NPC Generation
 * Includes both adventurer classes and common NPC occupations
 */

export interface NPCClass {
    id: string;
    name: string;
    hitDie: number;
    primaryAbility: string;
    savingThrows: string[];
    isAdventurer: boolean;
    description: string;
}

// Adventurer classes
export const ADVENTURER_CLASSES: NPCClass[] = [
    {
        id: 'barbarian',
        name: 'Barbarian',
        hitDie: 12,
        primaryAbility: 'str',
        savingThrows: ['str', 'con'],
        isAdventurer: true,
        description: 'A fierce warrior of primitive background who can enter a battle rage',
    },
    {
        id: 'bard',
        name: 'Bard',
        hitDie: 8,
        primaryAbility: 'cha',
        savingThrows: ['dex', 'cha'],
        isAdventurer: true,
        description: 'An inspiring magician whose power echoes the music of creation',
    },
    {
        id: 'cleric',
        name: 'Cleric',
        hitDie: 8,
        primaryAbility: 'wis',
        savingThrows: ['wis', 'cha'],
        isAdventurer: true,
        description: 'A priestly champion who wields divine magic in service of a higher power',
    },
    {
        id: 'druid',
        name: 'Druid',
        hitDie: 8,
        primaryAbility: 'wis',
        savingThrows: ['int', 'wis'],
        isAdventurer: true,
        description: 'A priest of the Old Faith, wielding the powers of nature',
    },
    {
        id: 'fighter',
        name: 'Fighter',
        hitDie: 10,
        primaryAbility: 'str',
        savingThrows: ['str', 'con'],
        isAdventurer: true,
        description: 'A master of martial combat, skilled with a variety of weapons and armor',
    },
    {
        id: 'monk',
        name: 'Monk',
        hitDie: 8,
        primaryAbility: 'dex',
        savingThrows: ['str', 'dex'],
        isAdventurer: true,
        description: 'A master of martial arts, harnessing the power of the body in pursuit of perfection',
    },
    {
        id: 'paladin',
        name: 'Paladin',
        hitDie: 10,
        primaryAbility: 'str',
        savingThrows: ['wis', 'cha'],
        isAdventurer: true,
        description: 'A holy warrior bound to a sacred oath',
    },
    {
        id: 'ranger',
        name: 'Ranger',
        hitDie: 10,
        primaryAbility: 'dex',
        savingThrows: ['str', 'dex'],
        isAdventurer: true,
        description: 'A warrior who uses martial prowess and nature magic to combat threats',
    },
    {
        id: 'rogue',
        name: 'Rogue',
        hitDie: 8,
        primaryAbility: 'dex',
        savingThrows: ['dex', 'int'],
        isAdventurer: true,
        description: 'A scoundrel who uses stealth and trickery to overcome obstacles',
    },
    {
        id: 'sorcerer',
        name: 'Sorcerer',
        hitDie: 6,
        primaryAbility: 'cha',
        savingThrows: ['con', 'cha'],
        isAdventurer: true,
        description: 'A spellcaster who draws on inherent magic from a gift or bloodline',
    },
    {
        id: 'warlock',
        name: 'Warlock',
        hitDie: 8,
        primaryAbility: 'cha',
        savingThrows: ['wis', 'cha'],
        isAdventurer: true,
        description: 'A wielder of magic that is derived from a bargain with an extraplanar entity',
    },
    {
        id: 'wizard',
        name: 'Wizard',
        hitDie: 6,
        primaryAbility: 'int',
        savingThrows: ['int', 'wis'],
        isAdventurer: true,
        description: 'A scholarly magic-user capable of manipulating the structures of reality',
    },
];

// Common NPC occupations (non-adventurer)
export const OCCUPATION_CLASSES: NPCClass[] = [
    {
        id: 'merchant',
        name: 'Merchant',
        hitDie: 6,
        primaryAbility: 'cha',
        savingThrows: ['cha', 'wis'],
        isAdventurer: false,
        description: 'A trader who deals in goods and services',
    },
    {
        id: 'guard',
        name: 'Guard',
        hitDie: 8,
        primaryAbility: 'str',
        savingThrows: ['str', 'con'],
        isAdventurer: false,
        description: 'A trained protector who keeps the peace',
    },
    {
        id: 'farmer',
        name: 'Farmer',
        hitDie: 6,
        primaryAbility: 'con',
        savingThrows: ['con', 'wis'],
        isAdventurer: false,
        description: 'A hardworking agricultural worker',
    },
    {
        id: 'noble',
        name: 'Noble',
        hitDie: 6,
        primaryAbility: 'cha',
        savingThrows: ['cha', 'int'],
        isAdventurer: false,
        description: 'A member of the aristocratic class',
    },
    {
        id: 'innkeeper',
        name: 'Innkeeper',
        hitDie: 8,
        primaryAbility: 'cha',
        savingThrows: ['cha', 'con'],
        isAdventurer: false,
        description: 'The manager of a tavern or inn',
    },
    {
        id: 'blacksmith',
        name: 'Blacksmith',
        hitDie: 10,
        primaryAbility: 'str',
        savingThrows: ['str', 'con'],
        isAdventurer: false,
        description: 'A skilled metalworker and craftsman',
    },
    {
        id: 'scholar',
        name: 'Scholar',
        hitDie: 4,
        primaryAbility: 'int',
        savingThrows: ['int', 'wis'],
        isAdventurer: false,
        description: 'A learned academic or researcher',
    },
    {
        id: 'priest',
        name: 'Priest',
        hitDie: 6,
        primaryAbility: 'wis',
        savingThrows: ['wis', 'cha'],
        isAdventurer: false,
        description: 'A religious leader serving a temple or deity',
    },
    {
        id: 'sailor',
        name: 'Sailor',
        hitDie: 8,
        primaryAbility: 'dex',
        savingThrows: ['dex', 'con'],
        isAdventurer: false,
        description: 'A seafarer who works aboard ships',
    },
    {
        id: 'entertainer',
        name: 'Entertainer',
        hitDie: 6,
        primaryAbility: 'cha',
        savingThrows: ['cha', 'dex'],
        isAdventurer: false,
        description: 'A performer who delights crowds',
    },
    {
        id: 'beggar',
        name: 'Beggar',
        hitDie: 4,
        primaryAbility: 'cha',
        savingThrows: ['cha', 'wis'],
        isAdventurer: false,
        description: 'A destitute person living on the streets',
    },
    {
        id: 'criminal',
        name: 'Criminal',
        hitDie: 8,
        primaryAbility: 'dex',
        savingThrows: ['dex', 'int'],
        isAdventurer: false,
        description: 'An outlaw or member of the underworld',
    },
];

export const NPC_CLASSES: NPCClass[] = [...ADVENTURER_CLASSES, ...OCCUPATION_CLASSES];

export const getClassById = (id: string): NPCClass | undefined => {
    return NPC_CLASSES.find(npcClass => npcClass.id === id);
};

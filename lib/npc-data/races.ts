/**
 * D&D 5e Race Data for NPC Generation
 */

export interface Race {
    id: string;
    name: string;
    abilityBonuses: Record<string, number>;
    traits: string[];
    speed: number;
    size: 'Small' | 'Medium';
    languages: string[];
}

export const NPC_RACES: Race[] = [
    {
        id: 'human',
        name: 'Human',
        abilityBonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 },
        traits: ['Versatile', 'Extra Language'],
        speed: 30,
        size: 'Medium',
        languages: ['Common', 'One Extra'],
    },
    {
        id: 'elf',
        name: 'Elf',
        abilityBonuses: { dex: 2 },
        traits: ['Darkvision', 'Fey Ancestry', 'Trance', 'Keen Senses'],
        speed: 30,
        size: 'Medium',
        languages: ['Common', 'Elvish'],
    },
    {
        id: 'dwarf',
        name: 'Dwarf',
        abilityBonuses: { con: 2 },
        traits: ['Darkvision', 'Dwarven Resilience', 'Stonecunning', 'Tool Proficiency'],
        speed: 25,
        size: 'Medium',
        languages: ['Common', 'Dwarvish'],
    },
    {
        id: 'halfling',
        name: 'Halfling',
        abilityBonuses: { dex: 2 },
        traits: ['Lucky', 'Brave', 'Halfling Nimbleness'],
        speed: 25,
        size: 'Small',
        languages: ['Common', 'Halfling'],
    },
    {
        id: 'gnome',
        name: 'Gnome',
        abilityBonuses: { int: 2 },
        traits: ['Darkvision', 'Gnome Cunning'],
        speed: 25,
        size: 'Small',
        languages: ['Common', 'Gnomish'],
    },
    {
        id: 'halforc',
        name: 'Half-Orc',
        abilityBonuses: { str: 2, con: 1 },
        traits: ['Darkvision', 'Menacing', 'Relentless Endurance', 'Savage Attacks'],
        speed: 30,
        size: 'Medium',
        languages: ['Common', 'Orc'],
    },
    {
        id: 'tiefling',
        name: 'Tiefling',
        abilityBonuses: { cha: 2, int: 1 },
        traits: ['Darkvision', 'Hellish Resistance', 'Infernal Legacy'],
        speed: 30,
        size: 'Medium',
        languages: ['Common', 'Infernal'],
    },
    {
        id: 'dragonborn',
        name: 'Dragonborn',
        abilityBonuses: { str: 2, cha: 1 },
        traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'],
        speed: 30,
        size: 'Medium',
        languages: ['Common', 'Draconic'],
    },
];

export const getRaceById = (id: string): Race | undefined => {
    return NPC_RACES.find(race => race.id === id);
};

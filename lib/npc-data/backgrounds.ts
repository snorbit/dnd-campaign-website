/**
 * D&D 5e Background Data for NPC Generation
 */

export interface Background {
    id: string;
    name: string;
    skills: string[];
    feature: string;
    description: string;
}

export const NPC_BACKGROUNDS: Background[] = [
    {
        id: 'acolyte',
        name: 'Acolyte',
        skills: ['Insight', 'Religion'],
        feature: 'Shelter of the Faithful',
        description: 'You have spent your life in the service of a temple to a specific god.',
    },
    {
        id: 'charlatan',
        name: 'Charlatan',
        skills: ['Deception', 'Sleight of Hand'],
        feature: 'False Identity',
        description: 'You have always had a way with people and know how to work a crowd.',
    },
    {
        id: 'criminal',
        name: 'Criminal',
        skills: ['Deception', 'Stealth'],
        feature: 'Criminal Contact',
        description: 'You are an experienced criminal with a history of breaking the law.',
    },
    {
        id: 'entertainer',
        name: 'Entertainer',
        skills: ['Acrobatics', 'Performance'],
        feature: 'By Popular Demand',
        description: 'You thrive in front of an audience and know how to captivate a crowd.',
    },
    {
        id: 'folk_hero',
        name: 'Folk Hero',
        skills: ['Animal Handling', 'Survival'],
        feature: 'Rustic Hospitality',
        description: 'You come from humble origins but are destined for greater things.',
    },
    {
        id: 'guild_artisan',
        name: 'Guild Artisan',
        skills: ['Insight', 'Persuasion'],
        feature: 'Guild Membership',
        description: 'You are a member of an artisan guild, skilled in a particular craft.',
    },
    {
        id: 'hermit',
        name: 'Hermit',
        skills: ['Medicine', 'Religion'],
        feature: 'Discovery',
        description: 'You lived in seclusion for a formative part of your life.',
    },
    {
        id: 'noble',
        name: 'Noble',
        skills: ['History', 'Persuasion'],
        feature: 'Position of Privilege',
        description: 'You understand wealth, power, and privilege.',
    },
    {
        id: 'outlander',
        name: 'Outlander',
        skills: ['Athletics', 'Survival'],
        feature: 'Wanderer',
        description: 'You grew up in the wilds, far from civilization.',
    },
    {
        id: 'sage',
        name: 'Sage',
        skills: ['Arcana', 'History'],
        feature: 'Researcher',
        description: 'You spent years learning the lore of the multiverse.',
    },
    {
        id: 'sailor',
        name: 'Sailor',
        skills: ['Athletics', 'Perception'],
        feature: 'Ship\'s Passage',
        description: 'You sailed on a seagoing vessel for years.',
    },
    {
        id: 'soldier',
        name: 'Soldier',
        skills: ['Athletics', 'Intimidation'],
        feature: 'Military Rank',
        description: 'War has been your life for as long as you care to remember.',
    },
    {
        id: 'urchin',
        name: 'Urchin',
        skills: ['Sleight of Hand', 'Stealth'],
        feature: 'City Secrets',
        description: 'You grew up on the streets alone, orphaned, and poor.',
    },
    {
        id: 'merchant',
        name: 'Merchant',
        skills: ['Insight', 'Persuasion'],
        feature: 'Trade Contacts',
        description: 'You have spent your life buying and selling goods.',
    },
    {
        id: 'farmer',
        name: 'Farmer',
        skills: ['Animal Handling', 'Nature'],
        feature: 'Harvest Knowledge',
        description: 'You have worked the land and understand the cycles of nature.',
    },
];

export const getBackgroundById = (id: string): Background | undefined => {
    return NPC_BACKGROUNDS.find(bg => bg.id === id);
};

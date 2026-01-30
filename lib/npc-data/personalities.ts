/**
 * NPC Personality Data
 * Personality traits, ideals, bonds, flaws, and quirks
 */

export const PERSONALITY_TRAITS: string[] = [
    'I am always polite and respectful, no matter the circumstance.',
    'I am easily excitable and often talk too fast when passionate.',
    'I am suspicious of strangers and slow to trust.',
    'I love a good joke and try to find humor in any situation.',
    'I prefer actions over words and let my deeds speak for themselves.',
    'I am fiercely protective of those I care about.',
    'I have a habit of collecting interesting trinkets I find.',
    'I speak in riddles and often confuse those around me.',
    'I am fascinated by history and ancient lore.',
    'I have a nervous tic that appears when I am stressed.',
    'I always plan for the worst-case scenario.',
    'I believe everyone deserves a second chance.',
    'I have an insatiable curiosity about the world.',
    'I am brutally honest, sometimes to a fault.',
    'I am quiet and observant, preferring to listen rather than speak.',
    'I have a booming laugh that fills any room.',
    'I am extremely competitive and hate to lose.',
    'I quote ancient proverbs at inappropriate times.',
    'I am incredibly stubborn once I make up my mind.',
    'I treat everyone I meet as if they were my closest friend.',
    'I am pessimistic and always expect things to go wrong.',
    'I have an encyclopedic knowledge of local gossip.',
    'I am easily distracted by shiny objects or interesting sights.',
    'I speak very formally, even in casual situations.',
];

export interface Ideal {
    trait: string;
    alignment: 'lawful' | 'chaotic' | 'good' | 'evil' | 'neutral';
}

export const IDEALS: Ideal[] = [
    { trait: 'Justice. The law must be upheld to protect the innocent.', alignment: 'lawful' },
    { trait: 'Freedom. Chains are meant to be broken, as are those who would forge them.', alignment: 'chaotic' },
    { trait: 'Charity. I always help those in need, no matter the cost to myself.', alignment: 'good' },
    { trait: 'Power. Only the strong survive, and I intend to be the strongest.', alignment: 'evil' },
    { trait: 'Balance. Everything has its place in the natural order.', alignment: 'neutral' },
    { trait: 'Tradition. The old ways must be preserved and honored.', alignment: 'lawful' },
    { trait: 'Change. Life is constant evolution, and we must adapt or perish.', alignment: 'chaotic' },
    { trait: 'Compassion. Empathy and kindness are the greatest virtues.', alignment: 'good' },
    { trait: 'Ambition. Nothing will stand between me and my destiny.', alignment: 'evil' },
    { trait: 'Knowledge. The pursuit of understanding is the highest calling.', alignment: 'neutral' },
    { trait: 'Honor. My word is my bond, and I will never break it.', alignment: 'lawful' },
    { trait: 'Independence. I must be free to chart my own course.', alignment: 'chaotic' },
    { trait: 'Redemption. Everyone deserves a chance to atone for their past.', alignment: 'good' },
    { trait: 'Revenge. Those who have wronged me will pay, no matter the cost.', alignment: 'evil' },
    { trait: 'Pragmatism. The ends justify the means.', alignment: 'neutral' },
];

export const BONDS: string[] = [
    'I protect my family above all else.',
    'I owe a debt I can never fully repay to the one who saved my life.',
    'My hometown was destroyed, and I will have vengeance on those responsible.',
    'I am searching for a long-lost sibling taken from me years ago.',
    'I am devoted to a deity and will do anything to serve their will.',
    'I carry a memento from a deceased loved one that I will never part with.',
    'I made a promise to a dying friend that I intend to keep.',
    'My mentor taught me everything I know; I owe them my life.',
    'I am loyal to my guild and will protect its interests.',
    'Someone I loved was killed, and I seek justice for their death.',
    'I have sworn to protect an important person or artifact.',
    'My ancestral weapon or heirloom means everything to me.',
    'I am bound by an oath to complete a specific quest.',
    'The common folk look to me for protection, and I will not fail them.',
    'I seek to uncover the truth about my mysterious origins.',
];

export const FLAWS: string[] = [
    'I am quick to anger and slow to forgive.',
    'I have a weakness for gold and shiny things.',
    'I trust too easily and have been betrayed before.',
    'I drink too much when stressed.',
    'I cannot resist a pretty face.',
    'I am terrified of a specific creature or situation.',
    'I lie compulsively, even when there is no reason to.',
    'I am incredibly vain about my appearance.',
    'I hold grudges and never forget a slight.',
    'I am a coward when faced with real danger.',
    'I cannot keep a secret to save my life.',
    'I am addicted to gambling and take foolish risks.',
    'I am arrogant and look down on those I deem inferior.',
    'I am haunted by nightmares that disturb my sleep.',
    'I would do anything for fame and recognition.',
    'I struggle to think before I act.',
    'I am lazy and try to avoid work whenever possible.',
    'I am jealous of those more successful than me.',
];

export const QUIRKS: string[] = [
    'Always hums a particular tune when nervous.',
    'Collects unusual coins from different lands.',
    'Has a pet mouse that lives in their pocket.',
    'Constantly fidgets with a small trinket.',
    'Speaks with an unusual accent from a distant land.',
    'Has a distinctive laugh that turns heads.',
    'Is missing a finger or has a noticeable scar.',
    'Never sits with their back to a door.',
    'Refuses to eat a specific common food.',
    'Talks to themselves when concentrating.',
    'Has a habit of quoting old poems or songs.',
    'Wears mismatched socks as a good luck charm.',
    'Always taps three times before entering a room.',
    'Ends sentences with an unusual catchphrase.',
    'Has an irrational fear of a harmless creature.',
    'Collects buttons from people they meet.',
    'Never uses contractions in speech.',
    'Whistles bird calls as a greeting.',
    'Sketches people they find interesting.',
    'Always knows what day of the week it is.',
];

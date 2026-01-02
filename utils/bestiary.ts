
// Simple dictionary for common monsters to autofill HP/AC
// Since it's homebrew, we'll keep this generic.
export const BESTIARY: Record<string, { type: string, hp: number, ac: number }> = {
    "goblin": { type: "Humanoid", hp: 7, ac: 15 },
    "orc": { type: "Humanoid", hp: 15, ac: 13 },
    "bandit": { type: "Humanoid", hp: 11, ac: 12 },
    "skeleton": { type: "Undead", hp: 13, ac: 13 },
    "zombie": { type: "Undead", hp: 22, ac: 8 },
    "spider": { type: "Beast", hp: 11, ac: 14 },
    "wolf": { type: "Beast", hp: 11, ac: 13 },
    "dragon": { type: "Dragon", hp: 200, ac: 19 },
    "lich": { type: "Undead", hp: 135, ac: 17 },
};

// Returns a Monster object if the name matches (fuzzy)
export function lookupMonster(name: string, idPrefix: string): any | null {
    const lowerName = name.toLowerCase();

    // Check exact or partial match
    const key = Object.keys(BESTIARY).find(k => lowerName.includes(k));

    if (key) {
        const stats = BESTIARY[key];
        return {
            id: `${idPrefix}-${Math.random().toString(36).substr(2, 9)}`,
            name: name, // Keep the original name used in notes (e.g. "Elite Goblin")
            type: stats.type,
            hp: { current: stats.hp, max: stats.hp },
            ac: stats.ac
        };
    }

    // Fallback for unknown/homebrew creatures
    return {
        id: `${idPrefix}-${Math.random().toString(36).substr(2, 9)}`,
        name: name,
        type: "Unknown",
        hp: { current: 10, max: 10 }, // Default safe value
        ac: 10
    };
}

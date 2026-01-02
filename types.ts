export interface Player {
    id: string;
    name: string;
    class: string;
    race: string;
    level: number;
    hp: {
        current: number;
        max: number;
        temp: number;
    };
    stats: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    equipment: string[];
    spells: string[];
    password?: string; // Optional for now, simple string match
    position?: { x: number; y: number; };
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    reward?: string;
    status: 'active' | 'completed' | 'failed';
}

export interface WorldState {
    day: number;
    time: string;
    session: number;
}

export interface MapData {
    url: string;
}

export interface Monster {
    id: string;
    name: string;
    type: string;
    hp: {
        current: number;
        max: number;
    };
    ac?: number;
    initiative?: number;
}

export interface CampaignState {
    players: Player[];
    world: WorldState;
    map: MapData;
    encounters: Monster[];
    quests: Quest[];
    updatePlayer: (id: string, updates: Partial<Player>) => void;
    updateWorld: (updates: Partial<WorldState>) => void;
    updateMap: (url: string) => void;
    addEncounter: (monster: Monster) => void;
    removeEncounter: (id: string) => void;
    updateEncounter: (id: string, updates: Partial<Monster>) => void;
    addQuest: (quest: Quest) => void;
    updateQuest: (id: string, updates: Partial<Quest>) => void;
}

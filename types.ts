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
    token?: string; // Base64 image URL
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
    queue: { title: string; url: string; description: string }[];
    currentIndex: number;
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

export interface AudioState {
    url: string;
    isPlaying: boolean;
    volume: number;
}

export interface TimeState {
    day: number;
    month: number;
    year: number;
    weather: string;
    timeOfDay: string;
}

export interface CampaignState {
    id: number;
    players: Player[];
    world: WorldState;
    map: MapData;
    encounters: Monster[];
    quests: Quest[];
    audio: AudioState;
    time: TimeState;
    updatePlayer: (id: string, updates: Partial<Player>) => void;
    updatePlayerPosition: (id: string, x: number, y: number) => void;
    updateWorld: (updates: Partial<WorldState>) => void;
    updateMap: (url: string) => void;
    setMapQueue: (queue: { title: string; url: string; description: string }[]) => void;
    nextMap: () => void;
    addEncounter: (monster: Monster) => void;
    removeEncounter: (id: string) => void;
    updateEncounter: (id: string, updates: Partial<Monster>) => void;
    addQuest: (quest: Quest) => void;
    updateQuest: (id: string, updates: Partial<Quest>) => void;
    updateAudio: (updates: Partial<AudioState>) => void;
    updateTime: (updates: Partial<TimeState>) => void;
    seedDatabase: () => void;
    connectionStatus?: 'connecting' | 'connected' | 'error';
    lastError?: string | null;
    isSyncing?: boolean;
    resetMap: () => void;
    clearQuests: () => void;
}

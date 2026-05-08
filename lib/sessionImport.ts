import type { ProceduralMapType } from '@/lib/proceduralMap';

export interface ParsedLocation {
    name: string;
    description: string;
    order: number;
}

export interface ParsedQuest {
    name: string;
    description: string;
}

export interface ParsedItem {
    name: string;
    quantity: number;
}

export interface ParsedNPC {
    name: string;
    race: string;
    role: string;
    notes: string;
}

export interface ParsedMonster {
    name: string;
    count: number;
    hp?: number;
    ac?: number;
    difficulty?: number;
}

export interface ParsedEncounter {
    name: string;
    location: string;
    difficulty: number;
    monsters: ParsedMonster[];
}

export interface ParsedSession {
    title: string;
    description: string;
    locations: ParsedLocation[];
    quests: ParsedQuest[];
    items: ParsedItem[];
    npcs: ParsedNPC[];
    encounters: ParsedEncounter[];
}

export interface SessionMapJob {
    title: string;
    description: string;
    prompt: string;
    order: number;
    mapType: ProceduralMapType;
    kind: 'location' | 'travel' | 'encounter';
}

export interface EncounterEnemyRecord {
    id: string;
    name: string;
    hp_current: number;
    hp_max: number;
    ac: number;
}

export interface EncounterRecord {
    id: string;
    name: string;
    enemies: EncounterEnemyRecord[];
    status: 'planned';
}

export interface NPCRecord extends ParsedNPC {
    id: string;
    inParty: boolean;
}

export interface QuestRecord {
    id: string;
    title: string;
    description: string;
    status: 'active';
    objectives: string[];
    reward: string;
}

export interface ItemRecord {
    id: string;
    name: string;
    description: string;
    category: 'misc';
    weight: number;
}

const ENEMY_KEYWORDS = [
    'goblin', 'orc', 'skeleton', 'zombie', 'dragon', 'bandit', 'wolf', 'troll',
    'vampire', 'wraith', 'ghoul', 'spider', 'rat', 'bear', 'cultist', 'guard',
    'assassin', 'demon', 'devil', 'kobold', 'elemental', 'golem', 'ooze',
    'hag', 'priest', 'knight', 'giant', 'lich', 'beast',
];

const NPC_RACES = [
    'human', 'elf', 'dwarf', 'halfling', 'gnome', 'tiefling', 'dragonborn',
    'half-elf', 'half-orc', 'orc', 'goblin', 'aasimar', 'genasi',
];

const MONSTER_STATS: Record<string, { hp: number; ac: number }> = {
    goblin: { hp: 7, ac: 15 },
    kobold: { hp: 5, ac: 12 },
    bandit: { hp: 11, ac: 12 },
    guard: { hp: 11, ac: 16 },
    wolf: { hp: 11, ac: 13 },
    cultist: { hp: 9, ac: 12 },
    skeleton: { hp: 13, ac: 13 },
    zombie: { hp: 22, ac: 8 },
    spider: { hp: 26, ac: 14 },
    ghoul: { hp: 22, ac: 12 },
    elemental: { hp: 60, ac: 15 },
    golem: { hp: 85, ac: 17 },
    troll: { hp: 84, ac: 15 },
    ogre: { hp: 59, ac: 11 },
    priest: { hp: 45, ac: 13 },
    dragon: { hp: 178, ac: 18 },
    boss: { hp: 120, ac: 16 },
};

type IdFactory = () => string;

const defaultIdFactory: IdFactory = () => crypto.randomUUID();

export function normalizeParsedSession(input: unknown, sourceText = ''): ParsedSession {
    const raw = (input || {}) as Partial<ParsedSession>;
    const fallback = parseSessionWithSmartRegex(sourceText);

    return {
        title: cleanText(raw.title) || fallback.title,
        description: cleanText(raw.description) || fallback.description,
        locations: normalizeLocations(raw.locations, fallback.locations),
        quests: normalizeQuests(raw.quests, fallback.quests),
        items: normalizeItems(raw.items, fallback.items),
        npcs: normalizeNPCs(raw.npcs, fallback.npcs),
        encounters: normalizeEncounters(raw.encounters, fallback.encounters),
    };
}

export function parseSessionWithSmartRegex(text: string): ParsedSession {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const title = inferTitle(lines);
    const locations: ParsedLocation[] = [];
    const quests: ParsedQuest[] = [];
    const items: ParsedItem[] = [];
    const npcs: ParsedNPC[] = [];
    const encounters: ParsedEncounter[] = [];
    const descLines: string[] = [];

    let section = '';
    let locationOrder = 0;
    let currentLocation = 'Unknown';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lower = line.toLowerCase();

        if (i === 0 || /^session\s*\d*/i.test(line)) {
            continue;
        }

        const nextSection = detectSection(lower);
        if (nextSection) {
            section = nextSection;
            continue;
        }

        const cleanLine = line.replace(/^[-*]+|\d+[.)]\s*/g, '').trim();
        if (!cleanLine) continue;

        if (section === 'locations') {
            const parsed = parseNamedDescription(cleanLine);
            currentLocation = parsed.name;
            locations.push({
                name: parsed.name,
                description: parsed.description || parsed.name,
                order: locationOrder++,
            });
            continue;
        }

        if (section === 'quests') {
            const parsed = parseNamedDescription(cleanLine);
            quests.push({ name: parsed.name, description: parsed.description || parsed.name });
            continue;
        }

        if (section === 'items') {
            items.push(parseItemLine(cleanLine));
            continue;
        }

        if (section === 'npcs') {
            npcs.push(parseNPCLine(cleanLine));
            continue;
        }

        if (section === 'monsters') {
            const monster = parseMonsterLine(cleanLine);
            encounters.push({
                name: `${monster.name} Encounter`,
                location: currentLocation,
                difficulty: monster.difficulty || extractDifficulty(cleanLine),
                monsters: [monster],
            });
            continue;
        }

        if (section === 'encounters') {
            encounters.push(parseEncounterLine(cleanLine, currentLocation));
            continue;
        }

        if (section === 'description') {
            descLines.push(cleanLine);
            continue;
        }

        if (cleanLine.length > 20) {
            descLines.push(cleanLine);
        }

        const detectedEnemy = ENEMY_KEYWORDS.find(keyword => lower.includes(keyword));
        if (detectedEnemy && !encounters.some(enc => enc.name.toLowerCase().includes(detectedEnemy))) {
            const monster = parseMonsterLine(detectedEnemy);
            encounters.push({
                name: `${toTitleCase(detectedEnemy)} Encounter`,
                location: currentLocation,
                difficulty: extractDifficulty(cleanLine),
                monsters: [monster],
            });
        }
    }

    const inferredLocations = locations.length > 0 ? locations : inferLocationsFromEncounters(encounters);

    return {
        title,
        description: descLines.slice(0, 3).join(' ') || text.slice(0, 240),
        locations: inferredLocations,
        quests,
        items,
        npcs,
        encounters,
    };
}

export function buildSessionMapJobs(parsed: ParsedSession): SessionMapJob[] {
    const jobs: SessionMapJob[] = [];
    const sortedLocations = [...parsed.locations].sort((a, b) => a.order - b.order);

    sortedLocations.forEach((location, index) => {
        jobs.push({
            title: location.name,
            description: location.description,
            prompt: buildLocationPrompt(location.name, location.description),
            order: jobs.length,
            mapType: inferMapType(`${location.name} ${location.description}`),
            kind: 'location',
        });

        const nextLocation = sortedLocations[index + 1];
        if (nextLocation) {
            const terrain = inferTravelTerrain(location, nextLocation);
            jobs.push({
                title: `Travel: ${location.name} to ${nextLocation.name}`,
                description: `${terrain} connecting ${location.name} and ${nextLocation.name}`,
                prompt: buildTravelPrompt(terrain),
                order: jobs.length,
                mapType: 'road',
                kind: 'travel',
            });
        }
    });

    parsed.encounters.forEach((encounter) => {
        const monsterNames = encounter.monsters.map(monster => `${monster.count} ${monster.name}`).join(', ');
        const bossLike = encounter.difficulty >= 8 || /boss|final|legendary/i.test(encounter.name);
        jobs.push({
            title: `Encounter: ${encounter.name}`,
            description: `${encounter.location}. Monsters: ${monsterNames || encounter.name}`,
            prompt: [
                buildLocationPrompt(encounter.name, encounter.location),
                `combat encounter space for ${monsterNames || encounter.name}`,
                bossLike ? 'boss arena with dramatic focal point' : 'clear tactical cover and movement lanes',
            ].join(', '),
            order: jobs.length,
            mapType: bossLike ? 'boss-arena' : inferMapType(`${encounter.name} ${encounter.location}`),
            kind: 'encounter',
        });
    });

    return jobs;
}

export function buildNPCRecords(npcs: ParsedNPC[], idFactory: IdFactory = defaultIdFactory): NPCRecord[] {
    return npcs.map(npc => ({
        id: idFactory(),
        name: npc.name,
        race: npc.race || 'Unknown',
        role: npc.role || 'NPC',
        notes: npc.notes || '',
        inParty: false,
    }));
}

export function buildQuestRecords(quests: ParsedQuest[], idFactory: IdFactory = defaultIdFactory): QuestRecord[] {
    return quests.map(quest => ({
        id: idFactory(),
        title: quest.name,
        description: quest.description,
        status: 'active',
        objectives: [],
        reward: '',
    }));
}

export function buildItemRecords(items: ParsedItem[], idFactory: IdFactory = defaultIdFactory): ItemRecord[] {
    return items.map(item => ({
        id: idFactory(),
        name: item.name,
        description: `Qty: ${item.quantity} - Found during session import`,
        category: 'misc',
        weight: 0,
    }));
}

export function buildEncounterRecords(encounters: ParsedEncounter[], idFactory: IdFactory = defaultIdFactory): EncounterRecord[] {
    return encounters.map(encounter => ({
        id: idFactory(),
        name: encounter.location && encounter.location !== 'Unknown'
            ? `${encounter.name} (at ${encounter.location})`
            : encounter.name,
        enemies: buildEnemiesForEncounter(encounter, idFactory),
        status: 'planned',
    }));
}

export function countEncounterMonsters(encounters: ParsedEncounter[]) {
    return encounters.reduce((total, encounter) => {
        const monsters = encounter.monsters.length > 0
            ? encounter.monsters
            : [{ name: encounter.name, count: 1 }];
        return total + monsters.reduce((sum, monster) => sum + Math.max(1, monster.count || 1), 0);
    }, 0);
}

function buildEnemiesForEncounter(encounter: ParsedEncounter, idFactory: IdFactory): EncounterEnemyRecord[] {
    const monsters = encounter.monsters.length > 0
        ? encounter.monsters
        : [{ name: encounter.name, count: 1, difficulty: encounter.difficulty }];

    return monsters.flatMap(monster => {
        const count = Math.min(Math.max(1, monster.count || 1), 24);
        const stats = inferMonsterStats(monster.name, monster.difficulty || encounter.difficulty, monster.hp, monster.ac);
        return Array.from({ length: count }, (_, index) => ({
            id: idFactory(),
            name: count > 1 ? `${monster.name} ${index + 1}` : monster.name,
            hp_current: stats.hp,
            hp_max: stats.hp,
            ac: stats.ac,
        }));
    });
}

function inferMonsterStats(name: string, difficulty = 3, hp?: number, ac?: number) {
    const lower = name.toLowerCase();
    const defaults = Object.entries(MONSTER_STATS).find(([key]) => lower.includes(key))?.[1];
    const baseHp = defaults?.hp || Math.max(8, difficulty * 10);
    const baseAc = defaults?.ac || Math.min(20, 10 + Math.ceil(difficulty / 2));
    return {
        hp: hp && hp > 0 ? hp : baseHp,
        ac: ac && ac > 0 ? ac : baseAc,
    };
}

function normalizeLocations(input: unknown, fallback: ParsedLocation[]): ParsedLocation[] {
    if (!Array.isArray(input)) return fallback;
    const locations = input
        .map((item, index) => {
            const raw = item as Partial<ParsedLocation>;
            const name = cleanText(raw.name);
            if (!name) return null;
            return {
                name,
                description: cleanText(raw.description) || name,
                order: Number.isFinite(raw.order) ? Number(raw.order) : index,
            };
        })
        .filter(Boolean) as ParsedLocation[];
    return locations.length > 0 ? locations : fallback;
}

function normalizeQuests(input: unknown, fallback: ParsedQuest[]): ParsedQuest[] {
    if (!Array.isArray(input)) return fallback;
    const quests = input
        .map(item => {
            const raw = item as Partial<ParsedQuest>;
            const name = cleanText(raw.name);
            if (!name) return null;
            return { name, description: cleanText(raw.description) || name };
        })
        .filter(Boolean) as ParsedQuest[];
    return quests.length > 0 ? quests : fallback;
}

function normalizeItems(input: unknown, fallback: ParsedItem[]): ParsedItem[] {
    if (!Array.isArray(input)) return fallback;
    const items = input
        .map(item => {
            const raw = item as Partial<ParsedItem>;
            const name = cleanText(raw.name);
            if (!name) return null;
            return { name, quantity: Math.max(1, Number(raw.quantity) || 1) };
        })
        .filter(Boolean) as ParsedItem[];
    return items.length > 0 ? items : fallback;
}

function normalizeNPCs(input: unknown, fallback: ParsedNPC[]): ParsedNPC[] {
    if (!Array.isArray(input)) return fallback;
    const npcs = input
        .map(item => {
            const raw = item as Partial<ParsedNPC>;
            const name = cleanText(raw.name);
            if (!name) return null;
            return {
                name,
                race: cleanText(raw.race) || 'Unknown',
                role: cleanText(raw.role) || 'NPC',
                notes: cleanText(raw.notes),
            };
        })
        .filter(Boolean) as ParsedNPC[];
    return npcs.length > 0 ? npcs : fallback;
}

function normalizeEncounters(input: unknown, fallback: ParsedEncounter[]): ParsedEncounter[] {
    if (!Array.isArray(input)) return fallback;
    const encounters = input
        .map(item => {
            const raw = item as Partial<ParsedEncounter>;
            const name = cleanText(raw.name);
            if (!name) return null;
            const monsters = normalizeMonsters(raw.monsters);
            return {
                name,
                location: cleanText(raw.location) || 'Unknown',
                difficulty: Math.max(1, Number(raw.difficulty) || extractDifficulty(name)),
                monsters: monsters.length > 0 ? monsters : [parseMonsterLine(name)],
            };
        })
        .filter(Boolean) as ParsedEncounter[];
    return encounters.length > 0 ? encounters : fallback;
}

function normalizeMonsters(input: unknown): ParsedMonster[] {
    if (!Array.isArray(input)) return [];
    return input
        .map(item => {
            const raw = item as Partial<ParsedMonster>;
            const name = cleanText(raw.name);
            if (!name) return null;
            return {
                name,
                count: Math.max(1, Number(raw.count) || 1),
                hp: Number(raw.hp) || undefined,
                ac: Number(raw.ac) || undefined,
                difficulty: Number(raw.difficulty) || undefined,
            };
        })
        .filter(Boolean) as ParsedMonster[];
}

function detectSection(lower: string) {
    if (/^(locations?|places?|areas?|scenes?)\s*:?$/.test(lower)) return 'locations';
    if (/^(quests?|objectives?|missions?)\s*:?$/.test(lower)) return 'quests';
    if (/^(items?|loot|treasure|rewards?|inventory)\s*:?$/.test(lower)) return 'items';
    if (/^(npcs?|characters?|allies|villains?|merchants?)\s*:?$/.test(lower)) return 'npcs';
    if (/^(monsters?|creatures?|enemies)\s*:?$/.test(lower)) return 'monsters';
    if (/^(encounters?|combat)\s*:?$/.test(lower)) return 'encounters';
    if (/^(notes?|summary|description|overview)\s*:?$/.test(lower)) return 'description';
    return '';
}

function inferTitle(lines: string[]) {
    const first = lines[0] || 'Imported Session';
    return cleanText(first.replace(/^session\s*\d*\s*[-:]?/i, '')) || first;
}

function parseNamedDescription(line: string) {
    const match = line.match(/^(.+?)\s*[-:]\s*(.+)$/);
    return {
        name: cleanText(match?.[1] || line),
        description: cleanText(match?.[2] || ''),
    };
}

function parseItemLine(line: string): ParsedItem {
    const countFirst = line.match(/^(\d+)\s+(.+)$/);
    if (countFirst) {
        return { name: cleanText(countFirst[2]), quantity: Math.max(1, Number(countFirst[1]) || 1) };
    }

    const countLast = line.match(/^(.+?)\s*[xX]\s*(\d+)$/);
    if (countLast) {
        return { name: cleanText(countLast[1]), quantity: Math.max(1, Number(countLast[2]) || 1) };
    }

    return { name: cleanText(line), quantity: 1 };
}

function parseNPCLine(line: string): ParsedNPC {
    const parsed = parseNamedDescription(line);
    const details = parsed.description || '';
    const chunks = details.split(/\s*[,;]\s*/).filter(Boolean);
    const race = chunks.find(chunk => NPC_RACES.includes(chunk.toLowerCase())) || inferRace(details);
    const role = chunks.find(chunk => chunk !== race) || details || 'NPC';

    return {
        name: parsed.name,
        race: race || 'Unknown',
        role,
        notes: details,
    };
}

function inferRace(text: string) {
    const lower = text.toLowerCase();
    return NPC_RACES.find(race => lower.includes(race)) || '';
}

function parseEncounterLine(line: string, fallbackLocation: string): ParsedEncounter {
    const [left, monsterText = ''] = line.split(/\s*:\s*/, 2);
    const locationMatch = left.match(/^(.+?)\s*(?:[@(]\s*)(.+?)(?:\))?$/);
    const name = cleanText(locationMatch?.[1] || left);
    const locationDetails = cleanText(locationMatch?.[2] || '');
    const detailParts = locationDetails.split(/\s*,\s*/).filter(Boolean);
    const location = cleanText(detailParts[0] || fallbackLocation || 'Unknown');
    const inlineMonsterText = detailParts.slice(1).join(', ');
    let monsters = parseMonsterList(monsterText || inlineMonsterText || left);

    if (
        monsters.length === 0 ||
        (monsters.length === 1 && /^(\d+\s+)?(enemy|enemies|monster|monsters)$/i.test(monsters[0].name))
    ) {
        const count = Number((monsterText || inlineMonsterText).match(/\b(\d+)\b/)?.[1]) || 1;
        monsters = [{ ...parseMonsterLine(name), count }];
    }

    return {
        name,
        location,
        difficulty: extractDifficulty(line),
        monsters: monsters.length > 0 ? monsters : [parseMonsterLine(name)],
    };
}

function parseMonsterList(text: string): ParsedMonster[] {
    const candidates = text
        .replace(/[()]/g, ',')
        .split(/\s*,\s*|\s+and\s+/i)
        .map(item => item.trim())
        .filter(Boolean);

    return candidates
        .map(parseMonsterLine)
        .filter(monster => monster.name && !/^(easy|medium|moderate|hard|boss|entrance|sanctum|hall)$/i.test(monster.name));
}

function parseMonsterLine(line: string): ParsedMonster {
    const clean = cleanText(line);
    const countFirst = clean.match(/^(\d+)\s+(.+)$/);
    const countLast = clean.match(/^(.+?)\s*[xX]\s*(\d+)$/);
    const hpMatch = clean.match(/\bhp\s*(\d+)/i);
    const acMatch = clean.match(/\bac\s*(\d+)/i);

    let name = clean.replace(/\bhp\s*\d+/ig, '').replace(/\bac\s*\d+/ig, '').replace(/\bdc\s*\d+/ig, '').trim();
    let count = 1;

    if (countFirst) {
        count = Math.max(1, Number(countFirst[1]) || 1);
        name = countFirst[2].trim();
    } else if (countLast) {
        name = countLast[1].trim();
        count = Math.max(1, Number(countLast[2]) || 1);
    } else {
        const embeddedCount = clean.match(/(\d+)\s+(enemies|monsters|guards|golems|goblins|orcs|wolves|skeletons|zombies)/i);
        if (embeddedCount) count = Math.max(1, Number(embeddedCount[1]) || 1);
    }

    name = name
        .replace(/\b\d+\s+(enemies|monsters)\b/ig, '')
        .replace(/\b(easy|medium|moderate|hard|boss|legendary)\b/ig, '')
        .trim();

    return {
        name: singularize(toTitleCase(name || clean)),
        count,
        hp: hpMatch ? Number(hpMatch[1]) : undefined,
        ac: acMatch ? Number(acMatch[1]) : undefined,
        difficulty: extractDifficulty(clean),
    };
}

function extractDifficulty(text: string): number {
    const lower = text.toLowerCase();
    if (lower.includes('boss') || lower.includes('legendary') || lower.includes('ancient')) return 8;
    if (lower.includes('hard') || lower.includes('difficult') || lower.includes('elite')) return 5;
    if (lower.includes('medium') || lower.includes('moderate')) return 3;
    if (lower.includes('easy') || lower.includes('simple') || lower.includes('weak')) return 1;
    return 3;
}

function inferLocationsFromEncounters(encounters: ParsedEncounter[]): ParsedLocation[] {
    const unique = Array.from(new Set(encounters.map(encounter => encounter.location).filter(location => location && location !== 'Unknown')));
    return unique.map((name, index) => ({
        name,
        description: `${name} session location`,
        order: index,
    }));
}

function buildLocationPrompt(name: string, description: string) {
    return [
        'top-down tabletop RPG battle map',
        name,
        description,
        'clear grid',
        'empty playable space',
        'terrain details',
        'no characters',
    ].join(', ');
}

function buildTravelPrompt(terrain: string) {
    return [
        'top-down tabletop RPG travel map',
        terrain,
        'visible path or road',
        'clear grid',
        'empty playable space',
        'no characters',
    ].join(', ');
}

function inferTravelTerrain(from: ParsedLocation, to: ParsedLocation): string {
    const combined = `${from.name} ${from.description} ${to.name} ${to.description}`.toLowerCase();
    if (combined.includes('forest') || combined.includes('wood')) return 'dense forest path';
    if (combined.includes('mountain') || combined.includes('hill')) return 'mountain trail';
    if (combined.includes('city') || combined.includes('town') || combined.includes('village')) return 'cobblestone road';
    if (combined.includes('desert') || combined.includes('dune')) return 'sandy desert path';
    if (combined.includes('cave') || combined.includes('dungeon') || combined.includes('underground')) return 'stone tunnel';
    if (combined.includes('temple') || combined.includes('castle') || combined.includes('keep')) return 'grand stone hallway';
    if (combined.includes('swamp') || combined.includes('marsh')) return 'boggy swampland path';
    if (combined.includes('river') || combined.includes('lake') || combined.includes('coast')) return 'riverside path';
    return 'wilderness path between locations';
}

function inferMapType(text: string): ProceduralMapType {
    const lower = text.toLowerCase();
    if (lower.includes('tavern') || lower.includes('inn')) return 'tavern';
    if (lower.includes('forest') || lower.includes('wood')) return 'forest';
    if (lower.includes('dungeon') || lower.includes('crypt')) return 'dungeon';
    if (lower.includes('desert') || lower.includes('dune')) return 'desert';
    if (lower.includes('cave') || lower.includes('cavern')) return 'cave';
    if (lower.includes('castle') || lower.includes('keep') || lower.includes('temple')) return 'castle';
    if (lower.includes('town') || lower.includes('city') || lower.includes('village')) return 'town';
    if (lower.includes('road') || lower.includes('path') || lower.includes('trail')) return 'road';
    if (lower.includes('boss') || lower.includes('final')) return 'boss-arena';
    return 'auto';
}

function cleanText(value: unknown) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function toTitleCase(value: string) {
    return cleanText(value)
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
}

function singularize(value: string) {
    return value
        .replace(/\bGoblins\b/i, 'Goblin')
        .replace(/\bOrcs\b/i, 'Orc')
        .replace(/\bWolves\b/i, 'Wolf')
        .replace(/\bGolems\b/i, 'Golem')
        .replace(/\bSkeletons\b/i, 'Skeleton')
        .replace(/\bZombies\b/i, 'Zombie')
        .replace(/\bBandits\b/i, 'Bandit')
        .replace(/\bCultists\b/i, 'Cultist');
}

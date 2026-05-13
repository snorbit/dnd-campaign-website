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
    kind: 'location' | 'travel' | 'encounter' | 'venue';
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
    objectives: Array<{ id: string; text: string; completed: boolean }>;
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

const MAPPABLE_PLACE_PATTERNS: Array<{ keyword: string; mapType: ProceduralMapType; label: string; description: string }> = [
    { keyword: 'town', mapType: 'town', label: 'Town', description: 'town square with streets, homes, market stalls, and alleys' },
    { keyword: 'village', mapType: 'town', label: 'Village', description: 'village center with cottages, paths, and gathering space' },
    { keyword: 'city', mapType: 'town', label: 'City District', description: 'city district with roads, buildings, alleys, and plaza space' },
    { keyword: 'market', mapType: 'town', label: 'Market', description: 'market square with stalls, carts, crates, and alleys' },
    { keyword: 'shop', mapType: 'shop', label: 'Shop', description: 'fantasy shop interior with counters, shelves, crates, and clear walking lanes' },
    { keyword: 'store', mapType: 'shop', label: 'Store', description: 'fantasy store interior with shelves, counter, stockroom, and playable aisles' },
    { keyword: 'tavern', mapType: 'tavern', label: 'Tavern', description: 'tavern interior with bar, tables, fireplace, stage, and storage room' },
    { keyword: 'inn', mapType: 'tavern', label: 'Inn', description: 'inn common room with tables, bar, stairs, hearth, and guest rooms' },
    { keyword: 'blacksmith', mapType: 'blacksmith', label: 'Blacksmith', description: 'blacksmith workshop with forge, anvil, weapon racks, coal, and workbenches' },
    { keyword: 'forge', mapType: 'blacksmith', label: 'Forge', description: 'forge workshop with furnace, anvils, cooling troughs, racks, and worktables' },
    { keyword: 'forest', mapType: 'forest', label: 'Forest', description: 'forest clearing with trees, brush, trail, rocks, and tactical cover' },
    { keyword: 'woods', mapType: 'forest', label: 'Woods', description: 'woodland path with dense trees, brush, rocks, and clearings' },
    { keyword: 'cave', mapType: 'cave', label: 'Cave', description: 'cave chamber with tunnels, rocks, crystals, ledges, and pools' },
    { keyword: 'cavern', mapType: 'cave', label: 'Cavern', description: 'large cavern with tunnels, rocks, stalagmites, and elevation changes' },
    { keyword: 'mine', mapType: 'cave', label: 'Mine', description: 'mine tunnels with rails, supports, ore piles, carts, and side passages' },
    { keyword: 'dungeon', mapType: 'dungeon', label: 'Dungeon', description: 'dungeon rooms with corridors, doors, pillars, traps, and cover' },
    { keyword: 'crypt', mapType: 'dungeon', label: 'Crypt', description: 'crypt chambers with tombs, columns, corridors, and ritual space' },
    { keyword: 'temple', mapType: 'castle', label: 'Temple', description: 'temple hall with altar, pillars, side chambers, stairs, and ritual markings' },
    { keyword: 'castle', mapType: 'castle', label: 'Castle', description: 'castle room with stone walls, banners, doors, pillars, and central aisle' },
    { keyword: 'keep', mapType: 'castle', label: 'Keep', description: 'fortified keep interior with stone walls, doors, stairs, and cover' },
    { keyword: 'road', mapType: 'road', label: 'Road', description: 'wilderness road with ditches, rocks, trees, carts, and ambush cover' },
    { keyword: 'trail', mapType: 'road', label: 'Trail', description: 'winding trail with terrain features, cover, and clear path' },
    { keyword: 'camp', mapType: 'road', label: 'Camp', description: 'camp site with tents, fire pit, wagons, crates, and nearby cover' },
    { keyword: 'warehouse', mapType: 'shop', label: 'Warehouse', description: 'warehouse interior with crates, shelves, loading doors, and aisles' },
    { keyword: 'dock', mapType: 'town', label: 'Docks', description: 'dockside map with piers, crates, boats, alleys, and water edge' },
];

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
            addInferredQuest(cleanLine, quests);
            addInferredItems(cleanLine, items);
            continue;
        }

        if (cleanLine.length > 20) {
            descLines.push(cleanLine);
        }

        addInferredQuest(cleanLine, quests);
        addInferredItems(cleanLine, items);

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

    if (quests.length === 0) {
        lines.forEach(line => addInferredQuest(line, quests));
    }
    if (items.length === 0) {
        lines.forEach(line => addInferredItems(line, items));
    }

    const inferredPlaces = inferMappablePlaces(lines, locations, encounters);
    const inferredLocations = dedupeLocations(
        locations.length > 0 ? [...locations, ...inferredPlaces] : [...inferLocationsFromEncounters(encounters), ...inferredPlaces]
    );

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
            mapType: inferLocationMapType(location),
            kind: inferVenueMapType(`${location.name} ${location.description}`) ? 'venue' : 'location',
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
        objectives: buildObjectives(quest, idFactory),
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
    if (/^(locations?|places?|areas?|scenes?|shops?|stores?|taverns?|inns?|blacksmiths?|buildings?|venues?)\s*:?$/.test(lower)) return 'locations';
    if (/^(quests?|objectives?|missions?|goals?|hooks?)\s*:?$/.test(lower)) return 'quests';
    if (/^(items?|loot|treasure|rewards?|inventory|gear)\s*:?$/.test(lower)) return 'items';
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

function buildObjectives(quest: ParsedQuest, idFactory: IdFactory) {
    const objectiveText = quest.description || quest.name;
    return [{
        id: idFactory(),
        text: objectiveText,
        completed: false,
    }];
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

function addInferredQuest(line: string, quests: ParsedQuest[]) {
    const lower = line.toLowerCase();
    if (!/\b(seek|retrieve|find|recover|rescue|deliver|defeat|protect|investigate|discover|stop|destroy|escort|solve|decipher)\b/.test(lower)) {
        return;
    }

    const target = line.match(/\b(?:seek|retrieve|find|recover|rescue|deliver|defeat|protect|investigate|discover|stop|destroy|escort|solve|decipher)\s+(?:the\s+|a\s+|an\s+)?([^.,;]+)/i)?.[1];
    const name = target ? `${toTitleCase(line.match(/\b(seek|retrieve|find|recover|rescue|deliver|defeat|protect|investigate|discover|stop|destroy|escort|solve|decipher)\b/i)?.[1] || 'Complete')} ${cleanText(target)}` : line;
    const title = cleanText(name).slice(0, 80);

    if (title && !quests.some(quest => quest.name.toLowerCase() === title.toLowerCase())) {
        quests.push({ name: title, description: line });
    }
}

function addInferredItems(line: string, items: ParsedItem[]) {
    const lower = line.toLowerCase();
    if (!/\b(item|loot|treasure|reward|rewards|contains|finds|found|receives|chest|cache)\b/.test(lower)) {
        return;
    }

    const source = line
        .replace(/^.*\b(?:contains|finds|found|receives|rewards?|loot|treasure|items?|chest|cache)\b\s*[:,-]?\s*/i, '')
        .trim();

    if (!source || source.length > 160) return;

    source
        .split(/\s*,\s*|\s+and\s+/i)
        .map(part => part.replace(/\(.*?\)/g, '').replace(/^(and|or)\s+/i, '').replace(/[.。]+$/g, '').trim())
        .filter(Boolean)
        .map(parseItemLine)
        .forEach(item => {
            if (item.name && !items.some(existing => existing.name.toLowerCase() === item.name.toLowerCase())) {
                items.push(item);
            }
        });
}

function inferMappablePlaces(lines: string[], explicitLocations: ParsedLocation[], encounters: ParsedEncounter[]): ParsedLocation[] {
    const existingNames = new Set(explicitLocations.map(location => location.name.toLowerCase()));
    const locationNames = new Set<string>();
    const inferred: ParsedLocation[] = [];
    let order = explicitLocations.length;

    for (const encounter of encounters) {
        if (encounter.location && encounter.location !== 'Unknown') {
            locationNames.add(encounter.location.toLowerCase());
        }
    }

    for (const line of lines) {
        const lower = line.toLowerCase();
        for (const pattern of MAPPABLE_PLACE_PATTERNS) {
            if (!lower.includes(pattern.keyword)) continue;

            const name = inferPlaceName(line, pattern.keyword, pattern.label);
            const key = name.toLowerCase();
            if (hasSimilarPlace(existingNames, key) || hasSimilarPlace(locationNames, key)) continue;

            inferred.push({
                name,
                description: `${pattern.description}. Source note: ${line}`,
                order: order++,
            });
            existingNames.add(key);
        }
    }

    return inferred;
}

function inferPlaceName(line: string, keyword: string, fallback: string) {
    const segment = line.split(/[.;,]/).map(part => part.trim()).find(part => part.toLowerCase().includes(keyword)) || line;
    const keywordIndex = segment.toLowerCase().indexOf(keyword);
    const beforeText = keywordIndex >= 0 ? segment.slice(0, keywordIndex).replace(/\b(the|a|an|party|heroes|adventurers|visits?|visit|goes?|travel|travels|follows?|follow|into|to|at|in|and|then)\b/ig, ' ').trim() : '';
    const afterText = keywordIndex >= 0 ? segment.slice(keywordIndex + keyword.length).trim() : '';
    const before = beforeText.match(/([A-Z][A-Za-z']+(?:\s+[A-Z][A-Za-z']+){0,2})$/)?.[1];
    const after = afterText.match(/^(?:called|named|of|at|in)?\s*([A-Z][A-Za-z']+(?:\s+[A-Z][A-Za-z']+){0,2})/)?.[1];
    const name = cleanText(before || after || fallback);
    return name.toLowerCase().includes(keyword) ? toTitleCase(name) : `${toTitleCase(name)} ${toTitleCase(keyword)}`;
}

function hasSimilarPlace(names: Set<string>, key: string) {
    if (names.has(key)) return true;
    return Array.from(names).some(name => name.includes(key) || key.includes(name));
}

function dedupeLocations(locations: ParsedLocation[]) {
    const seen = new Set<string>();
    return locations.filter(location => {
        const key = location.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    }).map((location, order) => ({ ...location, order }));
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
    if (lower.includes('blacksmith') || lower.includes('forge')) return 'blacksmith';
    if (lower.includes('shop') || lower.includes('store') || lower.includes('warehouse')) return 'shop';
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

function inferLocationMapType(location: ParsedLocation): ProceduralMapType {
    const fromName = inferMapType(location.name);
    return fromName === 'auto' ? inferMapType(`${location.name} ${location.description}`) : fromName;
}

function inferVenueMapType(text: string) {
    const type = inferMapType(text);
    return type === 'shop' || type === 'blacksmith' || type === 'tavern' || type === 'town';
}

function cleanText(value: unknown) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function toTitleCase(value: string) {
    return cleanText(value)
        .toLowerCase()
        .split(' ')
        .map(word => word ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word)
        .join(' ');
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

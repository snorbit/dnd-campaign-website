import { describe, expect, it } from 'vitest';
import {
    buildEncounterRecords,
    buildNPCRecords,
    buildItemRecords,
    buildQuestRecords,
    buildSessionMapJobs,
    countEncounterMonsters,
    parseSessionWithSmartRegex,
} from './sessionImport';

const sessionScript = `Session 3: The Cursed Temple

The party follows a broken trade road to the Temple of Solara.

Locations:
1. Desert Approach - Sandy dunes, ancient statues, dry ravines
2. Temple Entrance - Stone pillars, hieroglyphs, cracked stairs
3. Inner Sanctum - Golden chamber, sun beams, central altar

NPCs:
- Mira Voss - human priest, nervous guide who knows the old hymn
- Thalen - elf scholar, wants the Sun Medallion protected

Encounters:
- Sand Elementals (Temple Entrance, 3 enemies)
- Goblin Ambush @ Desert Approach: 4 goblins, 1 wolf
- Corrupted Sun Priest @ Inner Sanctum: boss priest hp 70 ac 15

Items:
- Ancient Scroll
- Healing Elixir x3`;

describe('session import parser', () => {
    it('extracts full-session maps, NPCs, encounters, and monsters from a script', () => {
        const parsed = parseSessionWithSmartRegex(sessionScript);
        const maps = buildSessionMapJobs(parsed);

        expect(parsed.title).toBe('The Cursed Temple');
        expect(parsed.locations.length).toBeGreaterThanOrEqual(3);
        expect(parsed.npcs).toHaveLength(2);
        expect(parsed.encounters).toHaveLength(3);
        expect(parsed.items).toEqual([
            { name: 'Ancient Scroll', quantity: 1 },
            { name: 'Healing Elixir', quantity: 3 },
        ]);
        expect(maps.filter(map => map.kind === 'location' || map.kind === 'venue').length).toBeGreaterThanOrEqual(3);
        expect(maps.filter(map => map.kind === 'travel').length).toBeGreaterThanOrEqual(2);
        expect(maps.filter(map => map.kind === 'encounter')).toHaveLength(3);
    });

    it('builds playable NPC and encounter records for campaign_state', () => {
        const parsed = parseSessionWithSmartRegex(sessionScript);
        let id = 0;
        const ids = () => `id-${++id}`;
        const npcs = buildNPCRecords(parsed.npcs, ids);
        const encounters = buildEncounterRecords(parsed.encounters, ids);

        expect(npcs[0]).toMatchObject({
            name: 'Mira Voss',
            race: 'human',
            inParty: false,
        });
        expect(encounters[1].enemies).toHaveLength(5);
        expect(encounters[1].enemies[0]).toMatchObject({
            name: 'Goblin 1',
            hp_current: 7,
            hp_max: 7,
            ac: 15,
        });
        expect(encounters[2].enemies[0]).toMatchObject({
            name: 'Priest',
            hp_current: 70,
            hp_max: 70,
            ac: 15,
        });
        expect(countEncounterMonsters(parsed.encounters)).toBe(9);
    });
});

const openScript = `Session 5: Shadows Over Emberfall

The party visits Emberfall town, the Copper Kettle tavern, Mira's General Shop, Bronn blacksmith forge, then follows a trail into the Whispering Forest and Moonwell Cave.
The heroes must investigate missing caravans and recover the Moon Shard.
The bandit cache contains Silvered Dagger, Healing Potion x2, and Moon Shard.

Encounters:
- Bandit Roadblock @ Forest Trail: 3 bandits
- Cave Horror @ Moonwell Cave: boss ooze hp 55 ac 12`;

describe('broad session content inference', () => {
    it('creates maps for towns, shops, taverns, blacksmiths, forests, caves, and encounter spaces', () => {
        const parsed = parseSessionWithSmartRegex(openScript);
        const maps = buildSessionMapJobs(parsed);
        const mapTypes = new Set(maps.map(map => map.mapType));

        expect(parsed.locations.map(location => location.name)).toEqual(expect.arrayContaining([
            'Emberfall Town',
            'Copper Kettle Tavern',
            "Mira's General Shop",
            'Bronn Blacksmith',
            'Whispering Forest',
            'Moonwell Cave',
        ]));
        expect(mapTypes.has('town')).toBe(true);
        expect(mapTypes.has('tavern')).toBe(true);
        expect(mapTypes.has('shop')).toBe(true);
        expect(mapTypes.has('blacksmith')).toBe(true);
        expect(mapTypes.has('forest')).toBe(true);
        expect(mapTypes.has('cave')).toBe(true);
        expect(maps.filter(map => map.kind === 'encounter').length).toBeGreaterThanOrEqual(2);
    });

    it('infers quests and items from prose when no explicit sections are present', () => {
        const parsed = parseSessionWithSmartRegex(openScript);
        let id = 0;
        const ids = () => `id-${++id}`;
        const quests = buildQuestRecords(parsed.quests, ids);
        const items = buildItemRecords(parsed.items, ids);

        expect(quests.length).toBeGreaterThan(0);
        expect(quests[0].objectives[0]).toMatchObject({ completed: false });
        expect(items.map(item => item.name)).toEqual(expect.arrayContaining([
            'Silvered Dagger',
            'Healing Potion',
            'Moon Shard',
        ]));
    });
});

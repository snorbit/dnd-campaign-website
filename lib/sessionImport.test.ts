import { describe, expect, it } from 'vitest';
import {
    buildEncounterRecords,
    buildNPCRecords,
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
        expect(parsed.locations).toHaveLength(3);
        expect(parsed.npcs).toHaveLength(2);
        expect(parsed.encounters).toHaveLength(3);
        expect(parsed.items).toEqual([
            { name: 'Ancient Scroll', quantity: 1 },
            { name: 'Healing Elixir', quantity: 3 },
        ]);
        expect(maps.filter(map => map.kind === 'location')).toHaveLength(3);
        expect(maps.filter(map => map.kind === 'travel')).toHaveLength(2);
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

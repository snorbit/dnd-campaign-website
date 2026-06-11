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

const oakhavenStyleScript = `**DM GUIDE**: This is your complete script for Session 1.

# ACT 1: THE OAKHAVEN AFTERMATH

## MAYOR ELDRIN'S ORATION

### INTERACTION: MAYOR ELDRIN
**DM**: If players ask about "The Audit": "They took Elara. My girl."

### QUEST HOOK (Random): REVIEW THE LEDGER
**DM**: Quest Card
- **Name**: Review the Ledger
- **Hook**: "Death keeps strict accounts. Someone cooked the books."
- **Objective**: Track down where the Audit records are being made and steal or destroy the ledger pages.
- **Reward (Later)**: A lead to an archive of Audit records.

### THE SHOP: HAWTHORN & WICK
**DM**: Shopkeeper
- **Name**: Willa Hawthorn
- **Vibe**: Practical, exhausted, alert.

## ENCOUNTER: THE RUSHING RIVER AMBUSH
### COMBAT NOTES
- **Goblins (4)**: Using longbows with Tracer Arrows
- **Hulking Worg**: Focuses on Tactical Displacement
- **Environmental**: Every 2 rounds, a massive log sweeps through the stones

## COMBAT WITH RED EYE
**DM**: Red Eye is a hobgoblin warlord with enhanced abilities:
- **AC**: 18
- **HP**: 67

## THE AUDITOR'S TREASURY (Gold + Decent Gear)
**DM**: Loot Cache
- **Coin**: 120 gp, 180 sp
- **Potions**: 2 potions of healing
- **Weapons (decent, mundane)**: 1 longsword, 1 battleaxe, 1 longbow, 40 arrows
- **Armor (decent, mundane)**: 1 chain shirt, 1 shield, 1 set of studded leather`;

describe('Oakhaven session script structure', () => {
    it('extracts Quest Card blocks, interaction NPCs, combat notes, and loot cache items', () => {
        const parsed = parseSessionWithSmartRegex(oakhavenStyleScript);

        expect(parsed.quests).toEqual(expect.arrayContaining([
            expect.objectContaining({
                name: 'Review the Ledger',
                reward: 'A lead to an archive of Audit records.',
            }),
        ]));

        expect(parsed.npcs).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'MAYOR ELDRIN', role: 'Interaction NPC' }),
            expect.objectContaining({ name: 'Willa Hawthorn', role: 'Shopkeeper' }),
        ]));

        expect(parsed.encounters).toEqual(expect.arrayContaining([
            expect.objectContaining({
                name: 'THE RUSHING RIVER AMBUSH',
                monsters: expect.arrayContaining([
                    expect.objectContaining({ name: 'Goblin', count: 4 }),
                    expect.objectContaining({ name: 'Hulking Worg', count: 1 }),
                ]),
            }),
            expect.objectContaining({
                name: 'RED EYE',
                monsters: expect.arrayContaining([
                    expect.objectContaining({ name: 'Red Eye', hp: 67, ac: 18 }),
                ]),
            }),
        ]));

        expect(parsed.items.map(item => item.name)).toEqual(expect.arrayContaining([
            'gp',
            'sp',
            'potions of healing',
            'longsword',
            'battleaxe',
            'longbow',
            'arrows',
            'chain shirt',
            'shield',
            'set of studded leather',
        ]));
    });

    it('does not import shop stock or gear lists as session loot', () => {
        const parsed = parseSessionWithSmartRegex(`## THE SHOP: HAWTHORN & WICK

**DM**: For sale (common goods)
- **Rations (1 day)**: 5 sp
- **Rope, hempen (50 ft)**: 1 gp
- **Potion of healing**: 40 gp

### QUICK GEAR TIERS
- **Weapon**: Club or dagger or spear

## THE AUDITOR'S TREASURY
**DM**: Loot Cache
- **Coin**: 120 gp
- **Potions**: 2 potions of healing`);

        expect(parsed.items.map(item => item.name)).toEqual(expect.arrayContaining([
            'gp',
            'potions of healing',
        ]));
        expect(parsed.items.map(item => item.name)).not.toEqual(expect.arrayContaining([
            'Rations',
            'Rope, hempen',
            'Potion of healing',
            'Club or dagger or spear',
        ]));
    });
});

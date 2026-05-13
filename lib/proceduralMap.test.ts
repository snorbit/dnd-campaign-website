import { describe, expect, it } from 'vitest';
import { detectProceduralMapType, generateProceduralMapSvg } from './proceduralMap';

describe('procedural map generator', () => {
    it('detects common D&D map types from prompts', () => {
        expect(detectProceduralMapType('a smoky tavern with a fireplace')).toBe('tavern');
        expect(detectProceduralMapType('a cramped magic shop with counters')).toBe('shop');
        expect(detectProceduralMapType('blacksmith forge with anvils')).toBe('blacksmith');
        expect(detectProceduralMapType('ancient forest road')).toBe('forest');
        expect(detectProceduralMapType('boss arena with a blood altar')).toBe('boss-arena');
    });

    it('generates a top-level svg battle map with grid metadata', () => {
        const result = generateProceduralMapSvg({
            prompt: 'stone dungeon with pillars',
            mapType: 'dungeon',
            width: 768,
            height: 768,
            gridSize: 32,
        });

        expect(result.mapType).toBe('dungeon');
        expect(result.svg).toContain('<svg');
        expect(result.svg).toContain('aria-label="dungeon battle map"');
        expect(result.svg).toContain('<line');
        expect(result.metadata.width).toBe(768);
    });

    it('generates recognizable venue maps instead of plain grid floors', () => {
        const shop = generateProceduralMapSvg({
            prompt: 'general shop with shelves and crates',
            mapType: 'shop',
            width: 768,
            height: 768,
            gridSize: 32,
        });
        const blacksmith = generateProceduralMapSvg({
            prompt: 'blacksmith forge with anvil',
            mapType: 'blacksmith',
            width: 768,
            height: 768,
            gridSize: 32,
        });

        expect(shop.svg).toContain('aria-label="shop battle map"');
        expect(shop.svg).toContain('#5a3824');
        expect(blacksmith.svg).toContain('aria-label="blacksmith battle map"');
        expect(blacksmith.svg).toContain('#fb923c');
    });
});

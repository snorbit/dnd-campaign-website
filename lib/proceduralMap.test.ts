import { describe, expect, it } from 'vitest';
import { detectProceduralMapType, generateProceduralMapSvg } from './proceduralMap';

describe('procedural map generator', () => {
    it('detects common D&D map types from prompts', () => {
        expect(detectProceduralMapType('a smoky tavern with a fireplace')).toBe('tavern');
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
});

import { describe, expect, it } from 'vitest';
import { inferMapDetails, isSupportedMapFile } from './mapZipImport';

describe('map ZIP import helpers', () => {
    it('accepts common map image files and ignores junk files', () => {
        expect(isSupportedMapFile('town/tavern.png')).toBe(true);
        expect(isSupportedMapFile('forest/clearing.webp')).toBe(true);
        expect(isSupportedMapFile('__MACOSX/._town.png')).toBe(false);
        expect(isSupportedMapFile('notes/readme.txt')).toBe(false);
    });

    it('infers titles, groups, and map types from folders and filenames', () => {
        expect(inferMapDetails('town/01-blacksmith.png')).toEqual({
            title: 'Blacksmith',
            group: 'Town',
            type: 'Blacksmith',
        });

        expect(inferMapDetails('forest/deep-woods-encounter.jpg')).toEqual({
            title: 'Deep Woods Encounter',
            group: 'Forest',
            type: 'Forest',
        });
    });
});

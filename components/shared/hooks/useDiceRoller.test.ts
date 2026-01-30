import { renderHook, act } from '@testing-library/react';
import { useDiceRoller } from './useDiceRoller';
import { describe, it, expect, vi } from 'vitest';

describe('useDiceRoller', () => {
    it('should initialize with empty history', () => {
        const { result } = renderHook(() => useDiceRoller());
        expect(result.current.history).toEqual([]);
        expect(result.current.lastRoll).toBeNull();
    });

    it('should roll a single die correctly', () => {
        const { result } = renderHook(() => useDiceRoller());

        act(() => {
            result.current.roll(20, 1, 0, "normal", false);
        });

        expect(result.current.lastRoll).not.toBeNull();
        expect(result.current.lastRoll?.sides).toBe(20);
        expect(result.current.lastRoll?.rolls.length).toBe(1);
        expect(result.current.lastRoll?.total).toBeGreaterThanOrEqual(1);
        expect(result.current.lastRoll?.total).toBeLessThanOrEqual(20);
        expect(result.current.history.length).toBe(1);
    });

    it('should apply modifiers correctly', () => {
        const { result } = renderHook(() => useDiceRoller());

        // Mock Math.random to always return 0.5 (so 1d20 = 11)
        const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

        act(() => {
            result.current.roll(20, 1, 5, "normal", false);
        });

        // 1d20 (0.5 * 20 + 1 = 11) + 5 = 16
        expect(result.current.lastRoll?.total).toBe(16);
        expect(result.current.lastRoll?.formula).toContain('+ 5');

        spy.mockRestore();
    });

    it('should handle advantage correctly', () => {
        const { result } = renderHook(() => useDiceRoller());

        // Mock Math.random to return 0.1 then 0.9 (rolls 3 and 19)
        let rollIdx = 0;
        const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
            rollIdx++;
            return rollIdx === 1 ? 0.1 : 0.9;
        });

        act(() => {
            result.current.roll(20, 1, 0, "advantage", false);
        });

        // d20 advantage takes max(3, 19) = 19
        expect(result.current.lastRoll?.total).toBe(19);
        expect(result.current.lastRoll?.rolls).toEqual([3, 19]);
        expect(result.current.lastRoll?.formula).toContain('(advantage)');

        spy.mockRestore();
    });

    it('should handle disadvantage correctly', () => {
        const { result } = renderHook(() => useDiceRoller());

        // Mock Math.random to return 0.1 then 0.9 (rolls 3 and 19)
        let rollIdx = 0;
        const spy = vi.spyOn(Math, 'random').mockImplementation(() => {
            rollIdx++;
            return rollIdx === 1 ? 0.1 : 0.9;
        });

        act(() => {
            result.current.roll(20, 1, 0, "disadvantage", false);
        });

        // d20 disadvantage takes min(3, 19) = 3
        expect(result.current.lastRoll?.total).toBe(3);
        expect(result.current.lastRoll?.rolls).toEqual([3, 19]);
        expect(result.current.lastRoll?.formula).toContain('(disadvantage)');

        spy.mockRestore();
    });

    it('should parse and roll from formula', () => {
        const { result } = renderHook(() => useDiceRoller());
        const spy = vi.spyOn(Math, 'random').mockReturnValue(0.5);

        act(() => {
            result.current.parseAndRoll("2d6+3", false);
        });

        // 2d6 (4,4) + 3 = 11
        expect(result.current.lastRoll?.formula).toBe("2d6 + 3");
        expect(result.current.lastRoll?.total).toBe(11);

        spy.mockRestore();
    });

    it('should clear history', () => {
        const { result } = renderHook(() => useDiceRoller());

        act(() => {
            result.current.roll(6, 1, 0, "normal", false);
            result.current.clearHistory();
        });

        expect(result.current.history).toEqual([]);
        expect(result.current.lastRoll).toBeNull();
    });
});

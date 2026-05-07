import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '@/lib/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

describe('useRealtimeSubscription', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('subscribes to campaign_state updates and cleans up on unmount', async () => {
        const channel = {
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn((callback?: (status: string) => void) => {
                callback?.('SUBSCRIBED');
                return channel;
            }),
        };
        vi.mocked(supabase.channel).mockReturnValue(channel as any);

        const onUpdate = vi.fn();
        const { result, unmount } = renderHook(() =>
            useRealtimeSubscription('campaign-1', 'map', onUpdate)
        );

        await waitFor(() => expect(result.current.status).toBe('connected'));
        expect(supabase.channel).toHaveBeenCalledWith('realtime_campaign_state_campaign-1_map_UPDATE');
        expect(channel.on).toHaveBeenCalledWith(
            'postgres_changes',
            expect.objectContaining({
                event: 'UPDATE',
                schema: 'public',
                table: 'campaign_state',
                filter: 'campaign_id=eq.campaign-1',
            }),
            expect.any(Function)
        );

        unmount();
        expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
    });

    it('passes updated column data to the callback', () => {
        let updateHandler: ((payload: any) => void) | undefined;
        const channel = {
            on: vi.fn((_event, _filter, callback) => {
                updateHandler = callback;
                return channel;
            }),
            subscribe: vi.fn().mockReturnThis(),
        };
        vi.mocked(supabase.channel).mockReturnValue(channel as any);

        const onUpdate = vi.fn();
        renderHook(() => useRealtimeSubscription('campaign-1', 'quests', onUpdate));

        updateHandler?.({ new: { quests: [{ id: 'q1', title: 'Find the key' }] } });
        expect(onUpdate).toHaveBeenCalledWith([{ id: 'q1', title: 'Find the key' }]);
    });
});

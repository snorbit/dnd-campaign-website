import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type RealtimeStatus = 'connecting' | 'connected' | 'error';

/**
 * useRealtimeSubscription Hook
 * Generic hook for subscribing to realtime changes in campaign_state table
 */
export const useRealtimeSubscription = <T>(
    campaignId: string | number | null | undefined,
    column: string | '*',
    onUpdate: (data: any) => void,
    options: {
        table?: string;
        filterColumn?: string;
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    } = {}
) => {
    const [status, setStatus] = useState<RealtimeStatus>('connecting');
    const [error, setError] = useState<string | null>(null);

    const {
        table = 'campaign_state',
        filterColumn = 'campaign_id',
        event = 'UPDATE'
    } = options;

    useEffect(() => {
        const needsFilter = filterColumn && filterColumn !== '';

        if (needsFilter && !campaignId) {
            setStatus('connecting');
            return;
        }

        console.log(`[Realtime] Subscribing to ${event} on ${table} for ${filterColumn}=${campaignId}`);

        const channel = supabase
            .channel(`realtime_${table}_${campaignId}_${column}_${event}`)
            .on(
                'postgres_changes' as any,
                {
                    event: event,
                    schema: 'public',
                    table: table,
                    filter: filterColumn && campaignId ? `${filterColumn}=eq.${campaignId}` : undefined,
                } as any,
                (payload: any) => {
                    console.log(`[Realtime] Received ${event} for ${table}:`, payload);

                    // Logic depends on the table and column
                    if (table === 'campaign_state' && column !== '*') {
                        const newData = payload.new[column];
                        if (newData !== undefined) {
                            onUpdate(newData as T);
                        }
                    } else {
                        // For other tables or '*' column, pass the whole payload
                        // The callback will decide how to merge it into local state
                        onUpdate(payload);
                    }
                }
            )
            .subscribe((status) => {
                console.log(`[Realtime] Status for ${table} (${event}):`, status);
                if (status === 'SUBSCRIBED') {
                    setStatus('connected');
                    setError(null);
                } else if (status === 'CLOSED') {
                    setStatus('connecting');
                } else if (status === 'CHANNEL_ERROR') {
                    setStatus('error');
                    setError(`Failed to subscribe to ${table} updates`);
                }
            });

        return () => {
            console.log(`[Realtime] Unsubscribing from ${table} (${event})`);
            supabase.removeChannel(channel);
        };
    }, [campaignId, column, onUpdate, table, filterColumn, event]);

    return { status, error };
};

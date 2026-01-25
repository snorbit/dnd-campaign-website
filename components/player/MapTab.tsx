'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/shared/ui/Skeleton';

interface MapTabProps {
    campaignId: string;
}

export default function MapTab({ campaignId }: MapTabProps) {
    const [mapUrl, setMapUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMap();

        // Subscribe to map changes
        const channel = supabase
            .channel(`campaign_${campaignId}_map`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'campaign_state',
                    filter: `campaign_id=eq.${campaignId}`,
                },
                (payload) => {
                    const newMap = payload.new.map as any;
                    if (newMap?.url) {
                        setMapUrl(newMap.url);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    const loadMap = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('campaign_state')
                .select('map')
                .eq('campaign_id', campaignId)
                .single();

            setMapUrl(data?.map?.url || '');
        } catch (error) {
            console.error('Error loading map:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton width="w-48" height="h-8" />
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-2">
                    <Skeleton width="w-full" height="h-[500px]" rounded="rounded-lg" />
                </div>
            </div>
        );
    }

    if (!mapUrl) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] bg-gray-800 rounded-lg border-2 border-dashed border-gray-700">
                <p className="text-gray-400 text-lg mb-2">No map currently displayed</p>
                <p className="text-gray-500 text-sm">Waiting for the DM to show a map...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Current Map</h2>
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                <img
                    src={mapUrl}
                    alt="Campaign Map"
                    className="w-full h-auto object-contain"
                    style={{ maxHeight: '80vh' }}
                />
            </div>
        </div>
    );
}

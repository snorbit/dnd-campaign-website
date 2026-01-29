'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/shared/ui/Skeleton';
import { useRealtimeSubscription } from '@/components/shared/hooks/useRealtimeSubscription';
import { RealtimeStatus } from '@/components/shared/ui/RealtimeStatus';
import { RefreshCw, Map as MapIcon } from 'lucide-react';

interface MapTabProps {
    campaignId: string;
}

export default function MapTab({ campaignId }: MapTabProps) {
    const [mapUrl, setMapUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleMapUpdate = useCallback((newMap: any) => {
        setIsUpdating(true);
        if (newMap?.url) {
            setMapUrl(newMap.url);
        }
        setTimeout(() => setIsUpdating(false), 2000);
    }, []);

    const { status: realtimeStatus } = useRealtimeSubscription<any>(
        campaignId,
        'map',
        handleMapUpdate
    );

    useEffect(() => {
        loadMap();
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
            <div className="flex flex-col items-center justify-center min-h-[500px] bg-gray-800 rounded-lg border-2 border-dashed border-gray-700 p-8 text-center">
                <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mb-4 border border-gray-700">
                    <MapIcon className="text-gray-600" size={32} />
                </div>
                <p className="text-gray-400 text-lg mb-2">No map currently displayed</p>
                <p className="text-gray-500 text-sm max-w-xs mx-auto">
                    The DM hasn't shared a map for this area yet. It will appear here automatically when they do.
                </p>
                <button
                    onClick={() => loadMap()}
                    className="mt-6 flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-all"
                >
                    <RefreshCw size={14} />
                    Check for Updates
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-white">Current Map</h2>
                    {isUpdating && (
                        <div className="flex items-center gap-2 text-yellow-500 text-xs animate-pulse">
                            <RefreshCw size={12} className="animate-spin" />
                            <span>Updating...</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => loadMap()}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-all"
                        title="Force Refresh"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <RealtimeStatus status={realtimeStatus} />
                </div>
            </div>
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

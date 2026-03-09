'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/shared/ui/Skeleton';
import { useRealtimeSubscription } from '@/components/shared/hooks/useRealtimeSubscription';
import { RealtimeStatus } from '@/components/shared/ui/RealtimeStatus';
import { RefreshCw, Map as MapIcon } from 'lucide-react';

interface MapTabProps {
    campaignId: string;
}

interface MapPing {
    id: string;
    x: number;
    y: number;
    color: string;
}

export default function MapTab({ campaignId }: MapTabProps) {
    const [mapUrl, setMapUrl] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Map Pings State
    const [pings, setPings] = useState<MapPing[]>([]);
    const channelRef = useRef<any>(null);

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
        
        // Setup Map Pings channel
        const channel = supabase.channel(`map_pings_${campaignId}`);
        channelRef.current = channel;
        
        channel.on('broadcast', { event: 'ping' }, ({ payload }) => {
            const newPing = { ...payload, id: crypto.randomUUID() };
            setPings(prev => [...prev, newPing]);
            setTimeout(() => {
                setPings(prev => prev.filter(p => p.id !== newPing.id));
            }, 3000);
        }).subscribe();

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

    const handleMapClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        const color = '#3b82f6'; // Blue for player
        
        channelRef.current?.send({
            type: 'broadcast',
            event: 'ping',
            payload: { x, y, color }
        });
        
        // Also show locally
        const newPing = { id: crypto.randomUUID(), x, y, color };
        setPings(prev => [...prev, newPing]);
        setTimeout(() => {
            setPings(prev => prev.filter(p => p.id !== newPing.id));
        }, 3000);
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
            
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden flex justify-center p-4">
                <div className="relative inline-block">
                    <img
                        src={mapUrl}
                        alt="Campaign Map"
                        onClick={handleMapClick}
                        className="max-w-full max-h-[80vh] object-contain cursor-crosshair rounded shadow-lg"
                    />
                    
                    {pings.map(ping => (
                        <div key={`anim-${ping.id}`}>
                            <div 
                                className="absolute w-6 h-6 rounded-full animate-ping pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                                style={{ left: `${ping.x}%`, top: `${ping.y}%`, backgroundColor: ping.color, opacity: 0.6 }} 
                            />
                            <div 
                                className="absolute w-3 h-3 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                                style={{ left: `${ping.x}%`, top: `${ping.y}%`, backgroundColor: ping.color }} 
                            />
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="text-xs text-gray-500 text-center">
                Click anywhere on the map to ping a location to the party
            </div>
        </div>
    );
}

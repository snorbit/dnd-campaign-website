'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, FolderOpen, Image as ImageIcon, Layers, Loader2, Plus, Search, Trash2, Upload, Wand2, X } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';
import { toast } from 'sonner';
import { AtlasPlacement, buildAtlas, extractZipMaps, ZipMapEntry } from '@/lib/mapZipImport';

interface MapToken {
    id: string;
    x: number;
    y: number;
    label: string;
    color: string;
    size: number;
    imageUrl?: string;
}

interface Map {
    id: string;
    url: string;
    title: string;
    description?: string;
    tokens?: MapToken[];
    source?: string;
    group?: string;
    type?: string;
    order?: number;
    metadata?: {
        group?: string;
        type?: string;
        relativePath?: string;
        atlas?: {
            width: number;
            height: number;
            placements: AtlasPlacement[];
        };
        [key: string]: unknown;
    };
}

interface MapsTabProps {
    campaignId: string;
}

interface MapPing {
    id: string;
    x: number;
    y: number;
    color: string;
}

export default function MapsTab({ campaignId }: MapsTabProps) {
    const [maps, setMaps] = useState<Map[]>([]);
    const [currentMapUrl, setCurrentMapUrl] = useState('');
    const [currentMapId, setCurrentMapId] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMapUrl, setNewMapUrl] = useState('');
    const [newMapTitle, setNewMapTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [mapSearch, setMapSearch] = useState('');
    const [mapTypeFilter, setMapTypeFilter] = useState('All');
    const [importingZip, setImportingZip] = useState(false);
    const [importProgress, setImportProgress] = useState('');
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiPrompt, setAIPrompt] = useState('');
    const [aiGenerating, setAIGenerating] = useState(false);
    const [aiMapType, setAIMapType] = useState('auto');
    const [aiSize, setAISize] = useState(1024);
    const [aiGridSize, setAIGridSize] = useState(32);
    const [aiIncludeGrid, setAIIncludeGrid] = useState(true);
    const [generatedMap, setGeneratedMap] = useState<{
        imageUrl: string;
        title: string;
        source: string;
        metadata?: Record<string, unknown>;
        warning?: string;
    } | null>(null);

    // Map Pings & Tokens State
    const [pings, setPings] = useState<MapPing[]>([]);
    const [tokens, setTokens] = useState<MapToken[]>([]);
    const [draggingToken, setDraggingToken] = useState<string | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null);
    const tokensRef = useRef<MapToken[]>([]);
    const currentMapIdRef = useRef('');

    // New Token Form State
    const [newTokenLabel, setNewTokenLabel] = useState('');
    const [newTokenColor, setNewTokenColor] = useState('#ef4444');
    const [newTokenSize, setNewTokenSize] = useState(1);

    useEffect(() => {
        tokensRef.current = tokens;
    }, [tokens]);

    useEffect(() => {
        currentMapIdRef.current = currentMapId;
    }, [currentMapId]);

    useEffect(() => {
        loadMaps();

        // Setup Map Pings channel
        const channel = supabase.channel(`map_pings_${campaignId}`);
        channelRef.current = channel;

        channel.on('broadcast', { event: 'ping' }, ({ payload }) => {
            const newPing = { ...payload, id: crypto.randomUUID() };
            setPings(prev => [...prev, newPing]);
            setTimeout(() => {
                setPings(prev => prev.filter(p => p.id !== newPing.id));
            }, 3000);
        }).on('broadcast', { event: 'token_move' }, ({ payload }) => {
            if (payload.mapId && payload.mapId !== currentMapIdRef.current) return;
            setTokens(prev => prev.map(t => t.id === payload.id ? { ...t, x: payload.x, y: payload.y } : t));
        }).on('broadcast', { event: 'tokens_update' }, ({ payload }) => {
            if (payload.mapId && payload.mapId !== currentMapIdRef.current) return;
            setTokens(payload.tokens);
        }).subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    const loadMaps = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('campaign_state')
                .select('map')
                .eq('campaign_id', campaignId)
                .single();

            const mapState = data?.map || {};
            const mapQueue = Array.isArray(mapState.queue) ? mapState.queue : [];
            const activeMapId = getActiveMapId(mapState, mapQueue);
            setCurrentMapUrl(mapState.url || '');
            setCurrentMapId(activeMapId);
            setMaps(mapQueue);
            setTokens(getTokensForMap(mapState, activeMapId));
        } catch (error) {
            console.error('Error loading maps:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMapClick = (e: React.MouseEvent<HTMLImageElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        const color = '#ef4444'; // Red for DM

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

    const handlePointerDown = (e: React.PointerEvent, tokenId: string) => {
        e.stopPropagation(); // prevent map ping
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setDraggingToken(tokenId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!draggingToken || !mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        setTokens(prev => prev.map(t => t.id === draggingToken ? { ...t, x, y } : t));

        channelRef.current?.send({
            type: 'broadcast',
            event: 'token_move',
            payload: { id: draggingToken, x, y, mapId: currentMapIdRef.current }
        });
    };

    const handlePointerUp = async (e: React.PointerEvent) => {
        if (!draggingToken) return;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        setDraggingToken(null);
        await saveTokensToDb(tokensRef.current);
    };

    const saveTokensToDb = async (newTokens: MapToken[]) => {
        try {
            const { data: currentState } = await supabase.from('campaign_state').select('map').eq('campaign_id', campaignId).single();
            const mapState = currentState?.map || {};
            const activeMapId = currentMapIdRef.current || getActiveMapId(mapState, maps);
            const tokensByMapId = {
                ...(mapState.tokensByMapId || {}),
                ...(activeMapId ? { [activeMapId]: newTokens } : {}),
            };

            await supabase.from('campaign_state').update({
                map: { ...mapState, tokens: newTokens, tokensByMapId }
            }).eq('campaign_id', campaignId);

            channelRef.current?.send({
                type: 'broadcast',
                event: 'tokens_update',
                payload: { tokens: newTokens, mapId: activeMapId }
            });
        } catch (error) {
            console.error('Error saving tokens:', error);
        }
    };

    const handleAddToken = async () => {
        if (!newTokenLabel) return;
        const newToken: MapToken = {
            id: crypto.randomUUID(),
            x: 50,
            y: 50,
            label: newTokenLabel.substring(0, 10),
            color: newTokenColor,
            size: newTokenSize
        };
        const updatedTokens = [...tokens, newToken];
        setTokens(updatedTokens);
        setNewTokenLabel('');
        await saveTokensToDb(updatedTokens);
    };

    const handleRemoveToken = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updatedTokens = tokens.filter(t => t.id !== id);
        setTokens(updatedTokens);
        await saveTokensToDb(updatedTokens);
    };

    const generateAIMap = async () => {
        if (!aiPrompt.trim()) return;
        setAIGenerating(true);
        try {
            const res = await fetch('/api/generate-map-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: aiPrompt,
                    campaignId,
                    title: aiPrompt.substring(0, 40),
                    mapType: aiMapType,
                    width: aiSize,
                    height: aiSize,
                    gridSize: aiGridSize,
                    includeGrid: aiIncludeGrid,
                })
            });
            const data = await res.json();
            if (!data.success || !data.imageUrl) {
                toast.error('Map generation failed', { description: data.error || 'Please try again.' });
                return;
            }
            setGeneratedMap({
                imageUrl: data.imageUrl,
                title: data.title || aiPrompt.substring(0, 40),
                source: data.source || 'generated',
                metadata: data.metadata,
                warning: data.warning,
            });
            toast.success(data.source === 'procedural' ? 'Procedural map ready' : 'AI map ready', {
                description: 'Preview it, then save it to your map library.',
            });
        } catch (err) {
            console.error('Error generating AI map:', err);
            toast.error('Failed to generate map');
        } finally {
            setAIGenerating(false);
        }
    };

    const saveGeneratedMap = async (displayNow = false) => {
        if (!generatedMap) return;

        const newMap: Map = {
            id: crypto.randomUUID(),
            url: generatedMap.imageUrl,
            title: generatedMap.title,
            description: aiPrompt,
            source: generatedMap.source,
            group: 'Generated',
            type: String(generatedMap.metadata?.type || aiMapType || 'Generated'),
            metadata: {
                ...generatedMap.metadata,
                group: 'Generated',
                type: String(generatedMap.metadata?.type || aiMapType || 'Generated'),
            },
        };

        const updatedMaps = [...maps, newMap];
        const nextCurrentUrl = displayNow ? newMap.url : currentMapUrl;
        const nextCurrentId = displayNow ? newMap.id : currentMapId;

        try {
            const { data: currentState } = await supabase.from('campaign_state').select('map').eq('campaign_id', campaignId).single();
            await supabase.from('campaign_state').update({
                map: {
                    ...currentState?.map,
                    queue: updatedMaps,
                    url: nextCurrentUrl,
                    currentMapId: nextCurrentId,
                    tokens: displayNow ? [] : tokensRef.current,
                }
            }).eq('campaign_id', campaignId);

            setMaps(updatedMaps);
            if (displayNow) {
                setCurrentMapUrl(newMap.url);
                setCurrentMapId(newMap.id);
                setTokens([]);
            }
            setShowAIModal(false);
            setAIPrompt('');
            setGeneratedMap(null);
            toast.success(displayNow ? 'Map saved and displayed' : 'Map saved', { description: 'Added to your map library.' });
        } catch (error) {
            console.error('Error saving generated map:', error);
            toast.error('Failed to save generated map');
        }
    };

    const addMap = async () => {
        if (!newMapUrl || !newMapTitle) return;

        const newMap = {
            id: crypto.randomUUID(),
            url: newMapUrl,
            title: newMapTitle,
            group: 'Manual',
            type: 'Map',
            source: 'manual',
            metadata: {
                group: 'Manual',
                type: 'Map',
            },
        };

        const updatedMaps = [...maps, newMap];

        try {
            const { data: currentState } = await supabase
                .from('campaign_state')
                .select('map')
                .eq('campaign_id', campaignId)
                .single();

            await supabase
                .from('campaign_state')
                .update({
                    map: {
                        ...currentState?.map,
                        queue: updatedMaps,
                    }
                })
                .eq('campaign_id', campaignId);

            setMaps(updatedMaps);
            setNewMapUrl('');
            setNewMapTitle('');
            setShowAddModal(false);
        } catch (error) {
            console.error('Error adding map:', error);
        }
    };

    const displayMap = async (map: Map) => {
        try {
            const { data: currentState } = await supabase
                .from('campaign_state')
                .select('map')
                .eq('campaign_id', campaignId)
                .single();

            const mapState = currentState?.map || {};
            const currentTokensByMapId = mapState.tokensByMapId || {};
            const outgoingMapId = currentMapIdRef.current || getActiveMapId(mapState, maps);
            const tokensByMapId = {
                ...currentTokensByMapId,
                ...(outgoingMapId ? { [outgoingMapId]: tokensRef.current } : {}),
            };
            const nextTokens = getTokensForMap({ ...mapState, tokensByMapId }, map.id);

            await supabase
                .from('campaign_state')
                .update({
                    map: {
                        ...mapState,
                        url: map.url,
                        currentMapId: map.id,
                        tokens: nextTokens,
                        tokensByMapId,
                    }
                })
                .eq('campaign_id', campaignId);

            setCurrentMapUrl(map.url);
            setCurrentMapId(map.id);
            setTokens(nextTokens);
            channelRef.current?.send({
                type: 'broadcast',
                event: 'tokens_update',
                payload: { tokens: nextTokens, mapId: map.id }
            });
        } catch (error) {
            console.error('Error displaying map:', error);
        }
    };

    const deleteMap = async (mapId: string) => {
        const updatedMaps = maps.filter(m => m.id !== mapId);

        try {
            const { data: currentState } = await supabase
                .from('campaign_state')
                .select('map')
                .eq('campaign_id', campaignId)
                .single();

            await supabase
                .from('campaign_state')
                .update({
                    map: {
                        ...currentState?.map,
                        queue: updatedMaps,
                        ...(currentMapId === mapId ? {
                            url: updatedMaps[0]?.url || '',
                            currentMapId: updatedMaps[0]?.id || '',
                            tokens: getTokensForMap(currentState?.map || {}, updatedMaps[0]?.id || ''),
                        } : {}),
                    }
                })
                .eq('campaign_id', campaignId);

            setMaps(updatedMaps);
            if (currentMapId === mapId) {
                setCurrentMapUrl(updatedMaps[0]?.url || '');
                setCurrentMapId(updatedMaps[0]?.id || '');
                setTokens(getTokensForMap(currentState?.map || {}, updatedMaps[0]?.id || ''));
            }
        } catch (error) {
            console.error('Error deleting map:', error);
        }
    };

    const handleZipImport = async (file: File | null) => {
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.zip')) {
            toast.error('Choose a ZIP file', { description: 'Put your map images in a .zip file and upload that.' });
            return;
        }

        const objectUrls: string[] = [];
        setImportingZip(true);
        setImportProgress('Opening ZIP file...');

        try {
            const zipEntries = await extractZipMaps(file);
            objectUrls.push(...zipEntries.map(entry => entry.objectUrl));

            if (zipEntries.length === 0) {
                toast.error('No maps found', { description: 'The ZIP needs PNG, JPG, JPEG, or WEBP files.' });
                return;
            }

            setImportProgress(`Found ${zipEntries.length} map image${zipEntries.length === 1 ? '' : 's'}. Uploading maps...`);
            const uploadedMaps: Map[] = [];

            for (let index = 0; index < zipEntries.length; index += 1) {
                const entry = zipEntries[index];
                setImportProgress(`Uploading ${entry.title} (${index + 1} of ${zipEntries.length})...`);
                const url = await uploadMapImage(entry.file, entry.title, 'zip-map');
                uploadedMaps.push(mapFromZipEntry(entry, url, index + 1));
            }

            setImportProgress('Building the scrollable atlas...');
            const atlas = await buildAtlas(zipEntries);
            const atlasFile = new File([atlas.blob], 'imported-map-atlas.png', { type: 'image/png' });

            setImportProgress('Uploading the atlas...');
            const atlasUrl = await uploadMapImage(atlasFile, `${file.name.replace(/\.zip$/i, '')} Atlas`, 'atlas');
            const atlasMap: Map = {
                id: crypto.randomUUID(),
                title: `${cleanTitle(file.name.replace(/\.zip$/i, ''))} Atlas`,
                url: atlasUrl,
                description: 'Scrollable overview made from the imported ZIP maps.',
                source: 'zip-atlas',
                group: 'Atlas',
                type: 'Atlas',
                order: 0,
                metadata: {
                    group: 'Atlas',
                    type: 'Atlas',
                    atlas: {
                        width: atlas.width,
                        height: atlas.height,
                        placements: atlas.placements,
                    },
                },
            };

            const importedMaps = [atlasMap, ...uploadedMaps];
            const updatedMaps = [...maps, ...importedMaps];

            setImportProgress('Saving maps to the campaign...');
            const { data: currentState } = await supabase
                .from('campaign_state')
                .select('map')
                .eq('campaign_id', campaignId)
                .single();

            const mapState = currentState?.map || {};
            const nextCurrentMap = currentMapUrl ? { url: currentMapUrl, id: currentMapId } : { url: atlasMap.url, id: atlasMap.id };
            const tokensByMapId = {
                ...(mapState.tokensByMapId || {}),
                ...(currentMapId ? { [currentMapId]: tokensRef.current } : {}),
            };
            const nextTokens = nextCurrentMap.id === atlasMap.id ? [] : tokensRef.current;

            await supabase
                .from('campaign_state')
                .update({
                    map: {
                        ...mapState,
                        queue: updatedMaps,
                        url: nextCurrentMap.url,
                        currentMapId: nextCurrentMap.id,
                        tokens: nextTokens,
                        tokensByMapId,
                    },
                })
                .eq('campaign_id', campaignId);

            setMaps(updatedMaps);
            setCurrentMapUrl(nextCurrentMap.url);
            setCurrentMapId(nextCurrentMap.id);
            setTokens(nextTokens);
            toast.success('ZIP maps imported', {
                description: `${zipEntries.length} maps and 1 atlas were added to the library.`,
            });
        } catch (error) {
            console.error('ZIP import failed:', error);
            toast.error('ZIP import failed', { description: (error as Error).message });
        } finally {
            objectUrls.forEach(url => URL.revokeObjectURL(url));
            setImportProgress('');
            setImportingZip(false);
        }
    };

    const uploadMapImage = async (file: File, title: string, kind: string) => {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error('You need to sign in again before uploading maps.');

        const formData = new FormData();
        formData.append('campaignId', campaignId);
        formData.append('title', title);
        formData.append('kind', kind);
        formData.append('file', file);

        const response = await fetch('/api/upload-map-image', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        const result = await response.json();
        if (!response.ok || !result.success || !result.url) {
            throw new Error(result.error || 'Map upload failed.');
        }

        return result.url as string;
    };

    const switchRelativeMap = (direction: -1 | 1) => {
        if (maps.length === 0) return;
        const currentIndex = Math.max(0, maps.findIndex(map => map.id === currentMapId));
        const nextIndex = (currentIndex + direction + maps.length) % maps.length;
        displayMap(maps[nextIndex]);
    };

    const mapTypes = useMemo(() => {
        const types = new Set(['All', 'Atlas', 'Town', 'Shop', 'Tavern', 'Blacksmith', 'Forest', 'Cave', 'Battle', 'Dungeon', 'Road', 'Map']);
        maps.forEach(map => types.add(getMapType(map)));
        return Array.from(types);
    }, [maps]);

    const filteredMaps = useMemo(() => {
        const search = mapSearch.trim().toLowerCase();
        return maps.filter(map => {
            const type = getMapType(map);
            const group = getMapGroup(map);
            const matchesFilter = mapTypeFilter === 'All' || type === mapTypeFilter;
            const matchesSearch = !search || `${map.title} ${group} ${type}`.toLowerCase().includes(search);
            return matchesFilter && matchesSearch;
        });
    }, [maps, mapSearch, mapTypeFilter]);

    const groupedMaps = useMemo(() => {
        return filteredMaps.reduce<Record<string, Map[]>>((groups, map) => {
            const group = getMapGroup(map);
            groups[group] = groups[group] || [];
            groups[group].push(map);
            return groups;
        }, {});
    }, [filteredMaps]);

    const currentMap = useMemo(() => {
        return maps.find(map => map.id === currentMapId) || maps.find(map => map.url === currentMapUrl);
    }, [maps, currentMapId, currentMapUrl]);

    if (loading) {
        return <SkeletonList count={3} />;
    }

    return (
        <div className="space-y-6">
            {/* Current Map Preview */}
            <div>
                <h3 className="mb-3 flex flex-col gap-1 text-lg font-bold text-white sm:flex-row sm:items-center sm:justify-between">
                    <span>Currently Displayed</span>
                    <span className="text-xs font-normal text-gray-500">
                        {currentMap ? `${getMapGroup(currentMap)} > ${currentMap.title}` : 'Click to ping location'}
                    </span>
                </h3>
                {currentMapUrl ? (
                    <div className="flex flex-col items-center rounded-lg border border-yellow-600 bg-gray-900 p-3 sm:p-4">
                        <div className="mb-3 flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-gray-300">
                                <span className="font-semibold text-yellow-300">{currentMap?.title || 'Current Map'}</span>
                                {currentMap && (
                                    <span className="ml-2 text-xs text-gray-500">{getMapType(currentMap)}</span>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => switchRelativeMap(-1)}
                                    disabled={maps.length < 2}
                                    className="flex items-center gap-1 rounded bg-gray-800 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={14} />
                                    Previous
                                </button>
                                <button
                                    onClick={() => switchRelativeMap(1)}
                                    disabled={maps.length < 2}
                                    className="flex items-center gap-1 rounded bg-gray-800 px-3 py-1.5 text-xs text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="max-h-[70vh] w-full overflow-auto text-center">
                            <div
                                className="relative inline-block select-none touch-none"
                                ref={mapContainerRef}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerLeave={handlePointerUp}
                            >
                            <img
                                src={currentMapUrl}
                                alt="Current Map"
                                onPointerDown={(e) => {
                                    if (draggingToken) return;
                                    handleMapClick(e as any);
                                }}
                                className="max-w-none object-contain cursor-crosshair rounded shadow-lg pointer-events-auto"
                                style={{ maxHeight: currentMap?.source === 'zip-atlas' ? 'none' : '60vh', maxWidth: currentMap?.source === 'zip-atlas' ? 'none' : '100%' }}
                                draggable={false}
                            />

                            {tokens.map(token => (
                                <div
                                    key={token.id}
                                    onPointerDown={(e) => handlePointerDown(e, token.id)}
                                    className={`group absolute rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center font-bold text-white text-xs cursor-move hover:scale-110 transition-transform ${draggingToken === token.id ? 'opacity-80 scale-110' : ''}`}
                                    style={{
                                        left: `${token.x}%`,
                                        top: `${token.y}%`,
                                        backgroundColor: token.color,
                                        width: `${token.size * 2}rem`,
                                        height: `${token.size * 2}rem`,
                                        transform: 'translate(-50%, -50%)',
                                        zIndex: draggingToken === token.id ? 50 : 10,
                                        touchAction: 'none'
                                    }}
                                >
                                    <span className="pointer-events-none drop-shadow-md">{token.label.substring(0, 2).toUpperCase()}</span>
                                    {!draggingToken && (
                                        <button
                                            onClick={(e) => handleRemoveToken(token.id, e)}
                                            className="absolute -right-2 -top-2 rounded-full bg-red-600 p-0.5 opacity-100 transition-opacity sm:opacity-0 sm:hover:opacity-100 sm:group-hover:opacity-100"
                                            aria-label={`Remove ${token.label} token`}
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            ))}

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

                        {/* Token Controls */}
                        <div className="mt-4 grid w-full max-w-2xl grid-cols-[1fr_auto] items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3 sm:flex sm:flex-wrap">
                            <span className="col-span-2 text-sm font-bold text-gray-300 sm:col-span-1">Add Token:</span>
                            <input
                                type="text"
                                placeholder="Label (e.g. G1)"
                                value={newTokenLabel}
                                onChange={e => setNewTokenLabel(e.target.value)}
                                className="min-w-0 rounded border border-gray-600 bg-gray-900 px-3 py-1.5 text-sm text-white focus:outline-none sm:w-32"
                            />
                            <input
                                type="color"
                                value={newTokenColor}
                                onChange={e => setNewTokenColor(e.target.value)}
                                className="h-9 w-10 cursor-pointer rounded bg-transparent"
                                title="Token Color"
                            />
                            <select
                                value={newTokenSize}
                                onChange={e => setNewTokenSize(Number(e.target.value))}
                                className="rounded border border-gray-600 bg-gray-900 px-2 py-1.5 text-sm text-white focus:outline-none"
                            >
                                <option value={0.75}>Small</option>
                                <option value={1}>Medium</option>
                                <option value={1.5}>Large</option>
                                <option value={2}>Huge</option>
                            </select>
                            <button
                                onClick={handleAddToken}
                                disabled={!newTokenLabel}
                                className="rounded bg-yellow-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-yellow-700 disabled:bg-gray-700"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">
                        No map currently displayed to players
                    </div>
                )}
            </div>

            {/* Map Library */}
            <div>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-lg font-bold text-white">Map Library</h3>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm text-white transition-colors hover:bg-green-800">
                            {importingZip ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            Import ZIP
                            <input
                                type="file"
                                accept=".zip,application/zip,application/x-zip-compressed"
                                className="hidden"
                                disabled={importingZip}
                                onChange={(event) => {
                                    const file = event.target.files?.[0] || null;
                                    event.target.value = '';
                                    handleZipImport(file);
                                }}
                            />
                        </label>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                        >
                            <Plus size={18} />
                            Add Map
                        </button>
                    </div>
                </div>

                {importProgress && (
                    <div className="mb-4 rounded-lg border border-green-800 bg-green-950/50 p-3 text-sm text-green-100">
                        {importProgress}
                    </div>
                )}

                <div className="mb-4 grid gap-3 rounded-lg border border-gray-700 bg-gray-900 p-3 sm:grid-cols-[1fr_auto]">
                    <label className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="search"
                            value={mapSearch}
                            onChange={(event) => setMapSearch(event.target.value)}
                            placeholder="Search maps, groups, or types"
                            className="w-full rounded border border-gray-700 bg-gray-950 py-2 pl-9 pr-3 text-sm text-white placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
                        />
                    </label>
                    <select
                        value={mapTypeFilter}
                        onChange={(event) => setMapTypeFilter(event.target.value)}
                        className="rounded border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none"
                    >
                        {mapTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-5">
                    {Object.entries(groupedMaps).map(([group, groupMaps]) => (
                        <section key={group}>
                            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-300">
                                <FolderOpen size={16} className="text-yellow-500" />
                                {group}
                                <span className="text-xs font-normal text-gray-500">{groupMaps.length} map{groupMaps.length === 1 ? '' : 's'}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                                {groupMaps.map((map) => {
                                    const isActive = map.id === currentMapId || (!currentMapId && map.url === currentMapUrl);
                                    return (
                                        <div
                                            key={map.id}
                                            className={`group overflow-hidden rounded-lg border bg-gray-800 transition-colors ${isActive ? 'border-yellow-500 ring-1 ring-yellow-500' : 'border-gray-700 hover:border-yellow-500'}`}
                                        >
                                            <div className="relative">
                                                <img src={map.url} alt={map.title} className="h-32 w-full object-cover" />
                                                <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                                                    {getMapType(map)}
                                                </div>
                                                <button
                                                    onClick={() => deleteMap(map.id)}
                                                    className="absolute right-2 top-2 rounded bg-red-600 p-1.5 text-white opacity-100 transition-opacity hover:bg-red-700 sm:opacity-0 sm:group-hover:opacity-100"
                                                    aria-label={`Delete ${map.title}`}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                            <div className="p-3">
                                                <div className="mb-1 truncate text-sm font-semibold text-white">{map.title}</div>
                                                <div className="mb-3 truncate text-xs text-gray-500">{group} &gt; {map.title}</div>
                                                <button
                                                    onClick={() => displayMap(map)}
                                                    disabled={isActive}
                                                    className="w-full rounded bg-yellow-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-yellow-700 disabled:cursor-default disabled:bg-gray-700 disabled:text-gray-300"
                                                >
                                                    {isActive ? 'Currently Displayed' : 'Display to Players'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                {maps.length === 0 && (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                        <Layers size={48} className="mx-auto text-gray-600 mb-3" />
                        <p className="text-gray-400 mb-2">No maps in library</p>
                        <p className="text-gray-500 text-sm">Import a ZIP of named maps to build an atlas and quick-switch library.</p>
                    </div>
                )}

                {maps.length > 0 && filteredMaps.length === 0 && (
                    <div className="rounded-lg border border-gray-700 bg-gray-800 p-8 text-center">
                        <ImageIcon size={40} className="mx-auto mb-3 text-gray-600" />
                        <p className="text-gray-400">No maps match that search or filter.</p>
                    </div>
                )}
            </div>

            {/* Add Map Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4">
                    <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-4 sm:p-6">
                        <h3 className="text-xl font-bold text-white mb-4">Add New Map</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={newMapTitle}
                                    onChange={(e) => setNewMapTitle(e.target.value)}
                                    placeholder="Tavern Battle Map"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL</label>
                                <input
                                    type="url"
                                    value={newMapUrl}
                                    onChange={(e) => setNewMapUrl(e.target.value)}
                                    placeholder="https://example.com/map.jpg"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                                />
                            </div>

                            {newMapUrl && (
                                <div className="bg-gray-900 rounded p-2">
                                    <img src={newMapUrl} alt="Preview" className="w-full h-32 object-cover rounded" />
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={addMap}
                                disabled={!newMapUrl || !newMapTitle}
                                className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Add Map
                            </button>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewMapUrl('');
                                    setNewMapTitle('');
                                }}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Generate Modal */}
            {showAIModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4">
                    <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-lg border border-purple-700 bg-gray-800 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Wand2 size={20} className="text-purple-400" />
                                AI Map Generator
                            </h3>
                            <button onClick={() => setShowAIModal(false)} className="text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-gray-400 text-sm mb-4">
                            Describe the location. Stable Diffusion is used when available; otherwise a procedural battle map is generated.
                        </p>
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => { setAIPrompt(e.target.value); setGeneratedMap(null); }}
                            placeholder="Stone dungeon with torches and a central pit trap..."
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none mb-4"
                        />
                        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <label className="text-xs text-gray-300">
                                Map Type
                                <select
                                    value={aiMapType}
                                    onChange={(e) => { setAIMapType(e.target.value); setGeneratedMap(null); }}
                                    className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                >
                                    <option value="auto">Auto Detect</option>
                                    <option value="tavern">Tavern</option>
                                    <option value="forest">Forest</option>
                                    <option value="dungeon">Dungeon</option>
                                    <option value="desert">Desert</option>
                                    <option value="cave">Cave</option>
                                    <option value="castle">Castle</option>
                                    <option value="town">Town</option>
                                    <option value="road">Road</option>
                                    <option value="boss-arena">Boss Arena</option>
                                </select>
                            </label>
                            <label className="text-xs text-gray-300">
                                Size
                                <select
                                    value={aiSize}
                                    onChange={(e) => { setAISize(Number(e.target.value)); setGeneratedMap(null); }}
                                    className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                >
                                    <option value={768}>Small 768</option>
                                    <option value={1024}>Standard 1024</option>
                                    <option value={1536}>Large 1536</option>
                                </select>
                            </label>
                            <label className="text-xs text-gray-300">
                                Grid Size
                                <select
                                    value={aiGridSize}
                                    onChange={(e) => { setAIGridSize(Number(e.target.value)); setGeneratedMap(null); }}
                                    className="mt-1 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                >
                                    <option value={24}>24 px</option>
                                    <option value={32}>32 px</option>
                                    <option value={48}>48 px</option>
                                    <option value={64}>64 px</option>
                                </select>
                            </label>
                            <label className="flex items-end gap-2 text-xs text-gray-300 pb-2">
                                <input
                                    type="checkbox"
                                    checked={aiIncludeGrid}
                                    onChange={(e) => { setAIIncludeGrid(e.target.checked); setGeneratedMap(null); }}
                                    className="h-4 w-4"
                                />
                                Show Grid
                            </label>
                        </div>
                        {generatedMap && (
                            <div className="mb-4 rounded-lg border border-gray-700 bg-gray-900 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-bold text-white">{generatedMap.title}</span>
                                    <span className="text-xs text-purple-300 uppercase">{generatedMap.source}</span>
                                </div>
                                <img src={generatedMap.imageUrl} alt="Generated map preview" className="w-full max-h-72 object-contain rounded border border-gray-700 bg-black" />
                                {generatedMap.warning && (
                                    <p className="mt-2 text-xs text-yellow-300">{generatedMap.warning}</p>
                                )}
                            </div>
                        )}
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <button
                                onClick={generateAIMap}
                                disabled={aiGenerating || !aiPrompt.trim()}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                {aiGenerating ? (
                                    <><Loader2 size={16} className="animate-spin" />Generating...</>
                                ) : (
                                    <><Wand2 size={16} />{generatedMap ? 'Regenerate' : 'Generate'}</>
                                )}
                            </button>
                            {generatedMap && (
                                <button
                                    onClick={() => saveGeneratedMap(false)}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-lg transition-colors"
                                >
                                    Save
                                </button>
                            )}
                            {generatedMap && (
                                <button
                                    onClick={() => saveGeneratedMap(true)}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
                                >
                                    Display
                                </button>
                            )}
                            <button
                                onClick={() => { setShowAIModal(false); setAIPrompt(''); setGeneratedMap(null); }}
                                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getActiveMapId(mapState: any, maps: Map[]) {
    if (typeof mapState?.currentMapId === 'string' && mapState.currentMapId) return mapState.currentMapId;
    const activeMap = maps.find(map => map.url === mapState?.url);
    return activeMap?.id || '';
}

function getTokensForMap(mapState: any, mapId: string) {
    const tokensByMapId = mapState?.tokensByMapId || {};
    if (mapId && Array.isArray(tokensByMapId[mapId])) return tokensByMapId[mapId] as MapToken[];
    if (Array.isArray(mapState?.tokens)) return mapState.tokens as MapToken[];
    return [];
}

function getMapGroup(map: Map) {
    return map.group || map.metadata?.group || 'Imported Maps';
}

function getMapType(map: Map) {
    return map.type || map.metadata?.type || 'Map';
}

function mapFromZipEntry(entry: ZipMapEntry, url: string, order: number): Map {
    return {
        id: entry.id,
        title: entry.title,
        url,
        description: `Imported from ${entry.relativePath}`,
        source: 'zip',
        group: entry.group,
        type: entry.type,
        order,
        metadata: {
            group: entry.group,
            type: entry.type,
            relativePath: entry.relativePath,
        },
    };
}

function cleanTitle(value: string) {
    return value
        .replace(/^\d+[-_\s.]*/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, char => char.toUpperCase()) || 'Imported Maps';
}

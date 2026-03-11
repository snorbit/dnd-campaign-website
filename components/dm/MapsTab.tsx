'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Image as ImageIcon, Wand2, Loader2, X } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';
import { toast } from 'sonner';

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
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMapUrl, setNewMapUrl] = useState('');
    const [newMapTitle, setNewMapTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiPrompt, setAIPrompt] = useState('');
    const [aiGenerating, setAIGenerating] = useState(false);

    // Map Pings & Tokens State
    const [pings, setPings] = useState<MapPing[]>([]);
    const [tokens, setTokens] = useState<MapToken[]>([]);
    const [draggingToken, setDraggingToken] = useState<string | null>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null);

    // New Token Form State
    const [newTokenLabel, setNewTokenLabel] = useState('');
    const [newTokenColor, setNewTokenColor] = useState('#ef4444');
    const [newTokenSize, setNewTokenSize] = useState(1);

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
            setTokens(prev => prev.map(t => t.id === payload.id ? { ...t, x: payload.x, y: payload.y } : t));
        }).on('broadcast', { event: 'tokens_update' }, ({ payload }) => {
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

            const mapQueue = data?.map?.queue || [];
            setCurrentMapUrl(data?.map?.url || '');
            setMaps(mapQueue);
            setTokens(data?.map?.tokens || []);
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
            payload: { id: draggingToken, x, y }
        });
    };

    const handlePointerUp = async (e: React.PointerEvent) => {
        if (!draggingToken) return;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        setDraggingToken(null);
        await saveTokensToDb(tokens);
    };

    const saveTokensToDb = async (newTokens: MapToken[]) => {
        try {
            const { data: currentState } = await supabase.from('campaign_state').select('map').eq('campaign_id', campaignId).single();
            await supabase.from('campaign_state').update({
                map: { ...currentState?.map, tokens: newTokens }
            }).eq('campaign_id', campaignId);

            channelRef.current?.send({
                type: 'broadcast',
                event: 'tokens_update',
                payload: { tokens: newTokens }
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
                body: JSON.stringify({ prompt: aiPrompt, campaignId })
            });
            const data = await res.json();
            if (!data.success || !data.imageUrl) {
                toast.error('SD not running', { description: 'Start Stable Diffusion with --api flag.' });
                return;
            }
            // Add generated map to library
            const newMap = { id: crypto.randomUUID(), url: data.imageUrl, title: aiPrompt.substring(0, 40) };
            const updatedMaps = [...maps, newMap];
            const { data: currentState } = await supabase.from('campaign_state').select('map').eq('campaign_id', campaignId).single();
            await supabase.from('campaign_state').update({ map: { ...currentState?.map, queue: updatedMaps } }).eq('campaign_id', campaignId);
            setMaps(updatedMaps);
            setShowAIModal(false);
            setAIPrompt('');
            toast.success('AI map generated!', { description: 'Map added to your library.' });
        } catch (err) {
            console.error('Error generating AI map:', err);
            toast.error('Failed to generate map');
        } finally {
            setAIGenerating(false);
        }
    };

    const addMap = async () => {
        if (!newMapUrl || !newMapTitle) return;

        const newMap = {
            id: crypto.randomUUID(),
            url: newMapUrl,
            title: newMapTitle,
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

            await supabase
                .from('campaign_state')
                .update({
                    map: {
                        ...currentState?.map,
                        url: map.url,
                    }
                })
                .eq('campaign_id', campaignId);

            setCurrentMapUrl(map.url);
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
                    }
                })
                .eq('campaign_id', campaignId);

            setMaps(updatedMaps);
        } catch (error) {
            console.error('Error deleting map:', error);
        }
    };

    if (loading) {
        return <SkeletonList count={3} />;
    }

    return (
        <div className="space-y-6">
            {/* Current Map Preview */}
            <div>
                <h3 className="text-lg font-bold text-white mb-3 flex items-center justify-between">
                    <span>Currently Displayed</span>
                    <span className="text-xs font-normal text-gray-500">Click to ping location</span>
                </h3>
                {currentMapUrl ? (
                    <div className="bg-gray-900 rounded-lg border border-yellow-600 p-4 flex flex-col items-center">
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
                                className="max-w-full max-h-[60vh] object-contain cursor-crosshair rounded shadow-lg pointer-events-auto"
                                draggable={false}
                            />

                            {tokens.map(token => (
                                <div
                                    key={token.id}
                                    onPointerDown={(e) => handlePointerDown(e, token.id)}
                                    className={`absolute rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.8)] flex items-center justify-center font-bold text-white text-xs cursor-move hover:scale-110 transition-transform ${draggingToken === token.id ? 'opacity-80 scale-110' : ''}`}
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
                                            className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
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

                        {/* Token Controls */}
                        <div className="mt-4 flex flex-wrap gap-2 items-center bg-gray-800 p-3 rounded-lg border border-gray-700 w-full max-w-2xl">
                            <span className="text-sm font-bold text-gray-300">Add Token:</span>
                            <input
                                type="text"
                                placeholder="Label (e.g. G1)"
                                value={newTokenLabel}
                                onChange={e => setNewTokenLabel(e.target.value)}
                                className="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:outline-none w-32"
                            />
                            <input
                                type="color"
                                value={newTokenColor}
                                onChange={e => setNewTokenColor(e.target.value)}
                                className="w-8 h-8 rounded bg-transparent cursor-pointer"
                                title="Token Color"
                            />
                            <select
                                value={newTokenSize}
                                onChange={e => setNewTokenSize(Number(e.target.value))}
                                className="px-2 py-1.5 bg-gray-900 border border-gray-600 rounded text-sm text-white focus:outline-none"
                            >
                                <option value={0.75}>Small</option>
                                <option value={1}>Medium</option>
                                <option value={1.5}>Large</option>
                                <option value={2}>Huge</option>
                            </select>
                            <button
                                onClick={handleAddToken}
                                disabled={!newTokenLabel}
                                className="px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white font-bold rounded text-sm transition-colors"
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
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Map Library</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAIModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
                        >
                            <Wand2 size={16} />
                            AI Generate
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                        >
                            <Plus size={18} />
                            Add Map
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {maps.map((map) => (
                        <div
                            key={map.id}
                            className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-yellow-500 transition-colors group"
                        >
                            <div className="relative">
                                <img src={map.url} alt={map.title} className="w-full h-32 object-cover" />
                                <button
                                    onClick={() => deleteMap(map.id)}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="p-3">
                                <div className="text-white font-semibold text-sm mb-2 truncate">{map.title}</div>
                                <button
                                    onClick={() => displayMap(map)}
                                    className="w-full px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
                                >
                                    Display to Players
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {maps.length === 0 && (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                        <ImageIcon size={48} className="mx-auto text-gray-600 mb-3" />
                        <p className="text-gray-400 mb-2">No maps in library</p>
                        <p className="text-gray-500 text-sm">Add maps to display them to your players</p>
                    </div>
                )}
            </div>

            {/* Add Map Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
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

                        <div className="flex gap-3 mt-6">
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
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-purple-700">
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
                            Describe the location and SD will generate a top-down battle map.
                        </p>
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAIPrompt(e.target.value)}
                            placeholder="Stone dungeon with torches and a central pit trap..."
                            rows={4}
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={generateAIMap}
                                disabled={aiGenerating || !aiPrompt.trim()}
                                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                                {aiGenerating ? (
                                    <><Loader2 size={16} className="animate-spin" />Generating...</>
                                ) : (
                                    <><Wand2 size={16} />Generate</>
                                )}
                            </button>
                            <button
                                onClick={() => { setShowAIModal(false); setAIPrompt(''); }}
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

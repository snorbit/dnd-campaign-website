'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';

interface Map {
    id: string;
    url: string;
    title: string;
    description?: string;
}

interface MapsTabProps {
    campaignId: string;
}

export default function MapsTab({ campaignId }: MapsTabProps) {
    const [maps, setMaps] = useState<Map[]>([]);
    const [currentMapUrl, setCurrentMapUrl] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newMapUrl, setNewMapUrl] = useState('');
    const [newMapTitle, setNewMapTitle] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMaps();
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
        } catch (error) {
            console.error('Error loading maps:', error);
        } finally {
            setLoading(false);
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
                <h3 className="text-lg font-bold text-white mb-3">Currently Displayed</h3>
                {currentMapUrl ? (
                    <div className="bg-gray-900 rounded-lg border border-yellow-600 p-2">
                        <img src={currentMapUrl} alt="Current Map" className="w-full h-48 object-cover rounded" />
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
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    >
                        <Plus size={18} />
                        Add Map
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        </div>
    );
}

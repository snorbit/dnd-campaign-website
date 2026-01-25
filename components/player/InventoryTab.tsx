'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';

interface Item {
    id: string;
    name: string;
    description: string;
    quantity: number;
    weight: number;
    category: 'weapon' | 'armor' | 'consumable' | 'misc';
}

interface InventoryTabProps {
    campaignPlayerId: string;
}

export default function InventoryTab({ campaignPlayerId }: InventoryTabProps) {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInventory();
    }, [campaignPlayerId]);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const { data } = await supabase
                .from('player_inventory')
                .select('*')
                .eq('campaign_player_id', campaignPlayerId);

            setItems(data || []);
        } catch (error) {
            console.error('Error loading inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors = {
            weapon: 'text-red-400 bg-red-900/20',
            armor: 'text-blue-400 bg-blue-900/20',
            consumable: 'text-green-400 bg-green-900/20',
            misc: 'text-gray-400 bg-gray-900/20',
        };
        return colors[category as keyof typeof colors] || colors.misc;
    };

    if (loading) {
        return <SkeletonList count={4} />;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Inventory</h2>
                <div className="text-gray-400 text-sm">
                    Total Weight: {items.reduce((sum, item) => sum + (item.weight * item.quantity), 0)} lbs
                </div>
            </div>

            {items.length === 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                    <p className="text-gray-400">Your inventory is empty</p>
                    <p className="text-gray-500 text-sm mt-2">Items will appear here as you acquire them</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-white font-bold">{item.name}</h3>
                                        <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(item.category)}`}>
                                            {item.category}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm">{item.description}</p>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-white font-bold">×{item.quantity}</div>
                                    <div className="text-gray-500 text-xs">{item.weight} lbs</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

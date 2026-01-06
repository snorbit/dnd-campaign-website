'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus } from 'lucide-react';

interface Item {
    id: string;
    name: string;
    description: string;
    category: string;
    weight: number;
}

interface ItemsTabProps {
    campaignId: string;
}

export default function ItemsTab({ campaignId }: ItemsTabProps) {
    const [items, setItems] = useState<Item[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', description: '', category: 'misc', weight: 0 });
    // Using imported supabase client

    useEffect(() => {
        loadItems();
    }, [campaignId]);

    const loadItems = async () => {
        const { data } = await supabase.from('campaign_state').select('items').eq('campaign_id', campaignId).single();
        setItems(data?.items || []);
    };

    const createItem = async () => {
        const item: Item = { id: crypto.randomUUID(), ...newItem };
        const updated = [...items, item];
        await supabase.from('campaign_state').update({ items: updated }).eq('campaign_id', campaignId);
        setItems(updated);
        setShowCreateModal(false);
        setNewItem({ name: '', description: '', category: 'misc', weight: 0 });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <h2 className="text-2xl font-bold text-white">Items</h2>
                <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg">
                    <Plus size={18} className="inline mr-2" />
                    New Item
                </button>
            </div>

            <div className="grid gap-3">
                {items.map(item => (
                    <div key={item.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                        <h3 className="text-white font-bold">{item.name}</h3>
                        <p className="text-gray-400 text-sm">{item.description}</p>
                        <div className="text-gray-500 text-xs mt-2">
                            {item.category} • {item.weight} lbs
                        </div>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold text-white mb-4">Create Item</h3>
                        <input type="text" placeholder="Item Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <textarea placeholder="Description" value={newItem.description} onChange={e => setNewItem({ ...newItem, description: e.target.value })} rows={2} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3">
                            <option value="weapon">Weapon</option>
                            <option value="armor">Armor</option>
                            <option value="consumable">Consumable</option>
                            <option value="misc">Miscellaneous</option>
                        </select>
                        <input type="number" placeholder="Weight (lbs)" value={newItem.weight} onChange={e => setNewItem({ ...newItem, weight: parseFloat(e.target.value) })} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white mb-3" />
                        <div className="flex gap-3">
                            <button onClick={createItem} disabled={!newItem.name} className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg">Create</button>
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

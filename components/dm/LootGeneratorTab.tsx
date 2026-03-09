'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Coins, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface LootItem {
    name: string;
    description: string;
    category: string;
    weight: number;
}

interface LootGeneratorTabProps {
    campaignId: string;
}

export default function LootGeneratorTab({ campaignId }: LootGeneratorTabProps) {
    const [cr, setCr] = useState<number>(1);
    const [generatedLoot, setGeneratedLoot] = useState<LootItem[]>([]);
    const [generating, setGenerating] = useState(false);
    const [adding, setAdding] = useState(false);

    const generateLoot = () => {
        setGenerating(true);
        // Simple mock generation logic for now based on CR
        const coinsInt = Math.floor(Math.random() * 100 * cr) + 50;

        const newLoot: LootItem[] = [
            {
                name: `${coinsInt} Gold Pieces`,
                description: 'A pouch of shiny gold coins.',
                category: 'misc',
                weight: coinsInt * 0.02
            }
        ];

        const gemTypes = ['Ruby', 'Sapphire', 'Emerald', 'Diamond', 'Topaz', 'Amethyst'];
        const artTypes = ['Silver comb', 'Gold ring', 'Carved bone statuette', 'Velvet mask', 'Copper chalice'];
        const magicItems = ['Potion of Healing', 'Scroll of Magic Missile', 'Bag of Holding', 'Ring of Protection', 'Wand of Secrets', 'Cloak of Elvenkind'];

        if (cr >= 5 || Math.random() > 0.7) {
            const item = magicItems[Math.floor(Math.random() * magicItems.length)];
            newLoot.push({
                name: item,
                description: `A magical ${item.toLowerCase()} found in the hoard.`,
                category: 'magic_item',
                weight: 2
            });
        }

        if (Math.random() > 0.4) {
            const gem = gemTypes[Math.floor(Math.random() * gemTypes.length)];
            const count = Math.floor(Math.random() * 4) + 1;
            newLoot.push({
                name: `${gem} x${count}`,
                description: `Sparkling precious ${gem.toLowerCase()}s.`,
                category: 'gem',
                weight: 0.1 * count
            });
        }

        if (Math.random() > 0.6) {
            const art = artTypes[Math.floor(Math.random() * artTypes.length)];
            newLoot.push({
                name: art,
                description: `A finely crafted ${art.toLowerCase()}.`,
                category: 'art',
                weight: 1
            });
        }

        setGeneratedLoot(newLoot);
        setGenerating(false);
    };

    const addToInventory = async () => {
        if (!generatedLoot.length) return;
        setAdding(true);
        try {
            const { data } = await supabase.from('campaign_state').select('items').eq('campaign_id', campaignId).single();
            const existingItems = data?.items || [];

            const newItemsFormatted = generatedLoot.map(item => ({
                id: crypto.randomUUID(),
                ...item
            }));

            const updatedItems = [...existingItems, ...newItemsFormatted];
            const { error } = await supabase.from('campaign_state').update({ items: updatedItems }).eq('campaign_id', campaignId);

            if (error) throw error;

            toast.success('Loot added to campaign inventory!');
            setGeneratedLoot([]); // Clear after adding
        } catch (error) {
            console.error('Error adding loot:', error);
            toast.error('Failed to add loot to inventory');
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Loot Generator</h2>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Encounter Challenge Rating (CR)</label>
                        <input
                            type="number"
                            min="0"
                            max="30"
                            value={cr}
                            onChange={(e) => setCr(parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={generateLoot}
                        disabled={generating}
                        className="w-full sm:w-auto px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Coins size={18} />
                        Generate Hoard
                    </button>
                </div>
            </div>

            {generatedLoot.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Generated Loot</h3>
                        <button
                            onClick={addToInventory}
                            disabled={adding}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
                        >
                            <PackagePlus size={16} />
                            {adding ? 'Adding...' : 'Add All to Inventory'}
                        </button>
                    </div>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {generatedLoot.map((item, idx) => (
                            <div key={idx} className="bg-gray-900 rounded p-4 border border-gray-700">
                                <h4 className="text-yellow-500 font-bold mb-1">{item.name}</h4>
                                <p className="text-gray-400 text-sm">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

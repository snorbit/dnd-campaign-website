'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Coins, PackagePlus, Store, Sword } from 'lucide-react';
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
    const [tabMode, setTabMode] = useState<'loot' | 'shop'>('loot');

    // Loot State
    const [cr, setCr] = useState<number>(1);

    // Shop State
    const [shopType, setShopType] = useState<string>('blacksmith');
    const [shopLevel, setShopLevel] = useState<number>(1);

    const [generatedLoot, setGeneratedLoot] = useState<LootItem[]>([]);
    const [generating, setGenerating] = useState(false);
    const [adding, setAdding] = useState(false);

    const generateShop = () => {
        setGenerating(true);
        const newItems: LootItem[] = [];

        const count = Math.floor(Math.random() * 5) + (shopLevel * 3);

        const shopData: Record<string, { name: string, desc: string, basePrice: number, cat: string }[]> = {
            blacksmith: [
                { name: 'Longsword', desc: 'A standard steel longsword.', basePrice: 15, cat: 'weapon' },
                { name: 'Chain Shirt', desc: 'Armor made of interlocking metal rings.', basePrice: 50, cat: 'armor' },
                { name: 'Dagger', desc: 'A sharp, balanced dagger.', basePrice: 2, cat: 'weapon' },
                { name: 'Shield', desc: 'A sturdy wooden and metal shield.', basePrice: 10, cat: 'armor' },
                { name: '+1 Weapon', desc: 'A slightly magical weapon.', basePrice: 500, cat: 'magic_item' },
                { name: 'Whetstone', desc: 'Used for sharpening blades.', basePrice: 0.1, cat: 'misc' }
            ],
            magic: [
                { name: 'Potion of Healing', desc: 'Restores 2d4+2 HP.', basePrice: 50, cat: 'potion' },
                { name: 'Scroll of Shield', desc: 'Cast Shield spell once.', basePrice: 25, cat: 'scroll' },
                { name: 'Bag of Holding', desc: 'Larger on the inside.', basePrice: 400, cat: 'magic_item' },
                { name: 'Wand of Magic Missiles', desc: 'Shoots arcane darts.', basePrice: 500, cat: 'magic_item' },
                { name: 'Arcane Focus', desc: 'A glowing crystal.', basePrice: 10, cat: 'misc' }
            ],
            general: [
                { name: 'Rope (50ft)', desc: 'Hempen rope.', basePrice: 1, cat: 'misc' },
                { name: 'Torches (10)', desc: 'Provides light.', basePrice: 0.1, cat: 'misc' },
                { name: 'Rations (1 day)', desc: 'Travel food.', basePrice: 0.5, cat: 'misc' },
                { name: 'Backpack', desc: 'Carries gear.', basePrice: 2, cat: 'misc' },
                { name: 'Tinderbox', desc: 'Starts fires.', basePrice: 0.5, cat: 'misc' }
            ],
            alchemist: [
                { name: 'Alchemist Fire', desc: 'Sticky, flammable fluid.', basePrice: 50, cat: 'potion' },
                { name: 'Acid Vial', desc: 'Corrosive liquid.', basePrice: 25, cat: 'potion' },
                { name: 'Antitoxin', desc: 'Advantage on saving throws against poison.', basePrice: 50, cat: 'potion' },
                { name: 'Poison (Basic)', desc: 'Applied to weapons.', basePrice: 100, cat: 'poison' }
            ]
        };

        const pool = shopData[shopType] || shopData.general;

        for (let i = 0; i < count; i++) {
            const itemDef = pool[Math.floor(Math.random() * pool.length)];
            // Price variation +/- 20%
            const priceMod = 0.8 + (Math.random() * 0.4);
            let finalPrice = Math.round(itemDef.basePrice * priceMod * (shopLevel * 0.8));
            if (finalPrice < 1 && itemDef.basePrice >= 1) finalPrice = 1;

            const priceString = finalPrice > 0 ? `${finalPrice} gp` : `${Math.max(1, Math.round(finalPrice * 10))} sp`;

            newItems.push({
                name: itemDef.name,
                description: `${itemDef.desc} (Price: ${priceString})`,
                category: itemDef.cat,
                weight: 1
            });
        }

        // Add random gold context to store
        const coins = Math.floor(Math.random() * 500 * shopLevel);
        newItems.unshift({
            name: 'Shop Cash Register',
            description: `${coins} gp in the register.`,
            category: 'misc',
            weight: 0
        });

        setGeneratedLoot(newItems);
        setGenerating(false);
    };

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Loot & Shops</h2>
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                    <button
                        onClick={() => { setTabMode('loot'); setGeneratedLoot([]); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${tabMode === 'loot'
                            ? 'bg-yellow-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        <Sword size={16} />
                        Monster Loot
                    </button>
                    <button
                        onClick={() => { setTabMode('shop'); setGeneratedLoot([]); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${tabMode === 'shop'
                            ? 'bg-yellow-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                    >
                        <Store size={16} />
                        Shop Generator
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                {tabMode === 'loot' ? (
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
                ) : (
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Shop Type</label>
                            <select
                                value={shopType}
                                onChange={(e) => setShopType(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                            >
                                <option value="general">General Store</option>
                                <option value="blacksmith">Blacksmith</option>
                                <option value="magic">Magic Shop</option>
                                <option value="alchemist">Alchemist</option>
                            </select>
                        </div>
                        <div className="flex-1 w-full">
                            <label className="block text-sm font-medium text-gray-300 mb-2">Wealth Level</label>
                            <select
                                value={shopLevel}
                                onChange={(e) => setShopLevel(parseInt(e.target.value))}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                            >
                                <option value={1}>Low (Village)</option>
                                <option value={2}>Medium (Town)</option>
                                <option value={3}>High (City)</option>
                                <option value={5}>Legendary (Metropolis)</option>
                            </select>
                        </div>
                        <button
                            onClick={generateShop}
                            disabled={generating}
                            className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <Store size={18} />
                            Generate Shop Inventory
                        </button>
                    </div>
                )}
            </div>

            {generatedLoot.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">{tabMode === 'loot' ? 'Generated Loot' : 'Shop Inventory & Prices'}</h3>
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

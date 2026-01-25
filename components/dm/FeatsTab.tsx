'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Award, Search } from 'lucide-react';

interface Feat {
    id: string;
    name: string;
    description: string;
    prerequisites: string | null;
    benefits: string[];
    source: 'standard' | 'homebrew';
}

interface FeatsTabProps {
    campaignId: string;
}

export default function DMFeatsTab({ campaignId }: FeatsTabProps) {
    const [standardFeats, setStandardFeats] = useState<Feat[]>([]);
    const [homebrewFeats, setHomebrewFeats] = useState<Feat[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newFeat, setNewFeat] = useState({
        name: '',
        description: '',
        prerequisites: '',
        benefits: [''],
    });
    const [loading, setLoading] = useState(true);
    // Using imported supabase client

    useEffect(() => {
        loadFeats();
    }, [campaignId]);

    const loadFeats = async () => {
        try {
            // Load standard feats
            const { data: standard } = await supabase
                .from('standard_feats')
                .select('*');

            // Load campaign homebrew feats
            const { data: homebrew } = await supabase
                .from('homebrew_feats')
                .select('*')
                .eq('campaign_id', campaignId);

            setStandardFeats((standard || []).map(f => ({ ...f, source: 'standard' as const })));
            setHomebrewFeats((homebrew || []).map(f => ({ ...f, source: 'homebrew' as const, benefits: f.benefits || [] })));
        } catch (error) {
            console.error('Error loading feats:', error);
        } finally {
            setLoading(false);
        }
    };

    const createHomebrewFeat = async () => {
        if (!newFeat.name || !newFeat.description) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase
                .from('homebrew_feats')
                .insert({
                    campaign_id: campaignId,
                    name: newFeat.name,
                    description: newFeat.description,
                    prerequisites: newFeat.prerequisites || null,
                    benefits: newFeat.benefits.filter(b => b.trim()),
                    created_by: user.id,
                });

            loadFeats();
            setShowCreateModal(false);
            setNewFeat({ name: '', description: '', prerequisites: '', benefits: [''] });
        } catch (error) {
            console.error('Error creating feat:', error);
        }
    };

    const deleteHomebrewFeat = async (featId: string) => {
        if (!confirm('Delete this homebrew feat?')) return;

        try {
            await supabase
                .from('homebrew_feats')
                .delete()
                .eq('id', featId);

            loadFeats();
        } catch (error) {
            console.error('Error deleting feat:', error);
        }
    };

    const addBenefit = () => {
        setNewFeat({ ...newFeat, benefits: [...newFeat.benefits, ''] });
    };

    const updateBenefit = (index: number, value: string) => {
        const newBenefits = [...newFeat.benefits];
        newBenefits[index] = value;
        setNewFeat({ ...newFeat, benefits: newBenefits });
    };

    const allFeats = [...standardFeats, ...homebrewFeats].filter(feat =>
        feat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feat.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="text-gray-400">Loading feats...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Feats</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                    <Plus size={18} />
                    Create Homebrew Feat
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search feats..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
                    <div className="text-2xl font-bold text-white">{standardFeats.length}</div>
                    <div className="text-sm text-gray-400">Standard D&D Feats</div>
                </div>
                <div className="bg-gray-800 rounded-lg border border-purple-700 p-4 text-center">
                    <div className="text-2xl font-bold text-purple-400">{homebrewFeats.length}</div>
                    <div className="text-sm text-gray-400">Homebrew Feats</div>
                </div>
            </div>

            {/* Feats List */}
            <div className="space-y-3">
                {allFeats.map((feat) => (
                    <div
                        key={feat.id}
                        className={`bg-gray-800 rounded-lg border p-4 ${feat.source === 'homebrew' ? 'border-purple-700' : 'border-gray-700'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                                <Award size={20} className={feat.source === 'homebrew' ? 'text-purple-400' : 'text-yellow-500'} />
                                <h3 className="text-white font-bold text-lg">{feat.name}</h3>
                                <span className={`px-2 py-1 text-xs rounded ${feat.source === 'homebrew'
                                    ? 'bg-purple-900/30 text-purple-400'
                                    : 'bg-gray-700 text-gray-400'
                                    }`}>
                                    {feat.source === 'homebrew' ? 'Homebrew' : 'Standard'}
                                </span>
                            </div>

                            {feat.source === 'homebrew' && (
                                <button
                                    onClick={() => deleteHomebrewFeat(feat.id)}
                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        {feat.prerequisites && (
                            <div className="text-sm text-gray-500 mb-2">
                                <span className="font-semibold">Prerequisites:</span> {feat.prerequisites}
                            </div>
                        )}

                        <p className="text-gray-400 text-sm mb-3">{feat.description}</p>

                        {feat.benefits && feat.benefits.length > 0 && (
                            <div className="bg-gray-900/50 rounded p-3">
                                <div className="text-xs text-gray-500 uppercase mb-2">Benefits:</div>
                                <ul className="space-y-1">
                                    {feat.benefits.map((benefit, idx) => (
                                        <li key={idx} className="text-sm text-gray-300 flex gap-2">
                                            <span className="text-yellow-500">•</span>
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}

                {allFeats.length === 0 && (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                        <p className="text-gray-400">No feats found</p>
                    </div>
                )}
            </div>

            {/* Create Homebrew Feat Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-700 my-8">
                        <h3 className="text-xl font-bold text-white mb-4">Create Homebrew Feat</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Feat Name</label>
                                <input
                                    type="text"
                                    value={newFeat.name}
                                    onChange={(e) => setNewFeat({ ...newFeat, name: e.target.value })}
                                    placeholder="Shadow Strike"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <textarea
                                    value={newFeat.description}
                                    onChange={(e) => setNewFeat({ ...newFeat, description: e.target.value })}
                                    rows={3}
                                    placeholder="You have mastered the art of striking from the shadows..."
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Prerequisites (Optional)</label>
                                <input
                                    type="text"
                                    value={newFeat.prerequisites}
                                    onChange={(e) => setNewFeat({ ...newFeat, prerequisites: e.target.value })}
                                    placeholder="Dexterity 13 or higher"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-300">Benefits</label>
                                    <button
                                        onClick={addBenefit}
                                        className="text-sm text-purple-400 hover:text-purple-300"
                                    >
                                        + Add Benefit
                                    </button>
                                </div>
                                {newFeat.benefits.map((benefit, idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        value={benefit}
                                        onChange={(e) => updateBenefit(idx, e.target.value)}
                                        placeholder="You gain +2 to Stealth checks"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none mb-2"
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={createHomebrewFeat}
                                disabled={!newFeat.name || !newFeat.description}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                            >
                                Create Feat
                            </button>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setNewFeat({ name: '', description: '', prerequisites: '', benefits: [''] });
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

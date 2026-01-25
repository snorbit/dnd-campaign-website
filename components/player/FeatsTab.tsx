'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Award, Search } from 'lucide-react';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';

interface Feat {
    id: string;
    name: string;
    description: string;
    prerequisites: string | null;
    benefits: string[];
    source: 'standard' | 'homebrew';
    isAcquired: boolean;
    levelAcquired?: number;
}

interface FeatsTabProps {
    campaignPlayerId: string;
    campaignId: string;
}

export default function FeatsTab({ campaignPlayerId, campaignId }: FeatsTabProps) {
    const [feats, setFeats] = useState<Feat[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'acquired' | 'available'>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFeats();
    }, [campaignPlayerId, campaignId]);

    const loadFeats = async () => {
        try {
            setLoading(true);
            // Load player's acquired feats
            const { data: playerFeats } = await supabase
                .from('player_feats')
                .select('*')
                .eq('campaign_player_id', campaignPlayerId);

            const acquiredFeatIds = new Set(playerFeats?.map(pf => pf.feat_id) || []);

            // Load standard feats
            const { data: standardFeats } = await supabase
                .from('standard_feats')
                .select('*');

            // Load campaign homebrew feats
            const { data: homebrewFeats } = await supabase
                .from('homebrew_feats')
                .select('*')
                .eq('campaign_id', campaignId);

            const allFeats: Feat[] = [
                ...(standardFeats || []).map(f => ({
                    ...f,
                    source: 'standard' as const,
                    isAcquired: acquiredFeatIds.has(f.id),
                    benefits: f.benefits || []
                })),
                ...(homebrewFeats || []).map(f => ({
                    ...f,
                    source: 'homebrew' as const,
                    isAcquired: acquiredFeatIds.has(f.id),
                    benefits: f.benefits || []
                }))
            ];

            setFeats(allFeats);
        } catch (error) {
            console.error('Error loading feats:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredFeats = feats.filter(feat => {
        const matchesSearch = feat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            feat.description?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'acquired') return feat.isAcquired && matchesSearch;
        if (filter === 'available') return !feat.isAcquired && matchesSearch;
        return matchesSearch;
    });

    if (loading) {
        return <SkeletonList count={3} />;
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Feats</h2>
                <div className="text-gray-400 text-sm">
                    {feats.filter(f => f.isAcquired).length} acquired
                </div>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-3">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search feats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                    <option value="all">All Feats</option>
                    <option value="acquired">Acquired</option>
                    <option value="available">Available</option>
                </select>
            </div>

            {/* Feats List */}
            <div className="space-y-3">
                {filteredFeats.map((feat) => (
                    <div
                        key={feat.id}
                        className={`bg-gray-800 rounded-lg border p-4 transition-colors ${feat.isAcquired
                            ? 'border-yellow-500 shadow-yellow-500/20 shadow-lg'
                            : 'border-gray-700 hover:border-gray-600'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {feat.isAcquired && <Award className="text-yellow-500" size={20} />}
                                <h3 className="text-white font-bold text-lg">{feat.name}</h3>
                            </div>
                            <div className="flex gap-2">
                                {feat.source === 'homebrew' && (
                                    <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded">
                                        Homebrew
                                    </span>
                                )}
                                {feat.isAcquired && (
                                    <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded">
                                        Acquired
                                    </span>
                                )}
                            </div>
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
                                            <span className="text-blue-400">•</span>
                                            <span>{benefit}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}

                {filteredFeats.length === 0 && (
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                        <p className="text-gray-400">No feats found</p>
                    </div>
                )}
            </div>
        </div>
    );
}

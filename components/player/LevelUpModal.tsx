'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Award, TrendingUp, X } from 'lucide-react';

interface LevelUpModalProps {
    campaignPlayerId: string;
    currentLevel: number;
    currentStats: {
        str: number;
        dex: number;
        con: number;
        int: number;
        wis: number;
        cha: number;
    };
    campaignId: string;
    onClose: () => void;
    onComplete: () => void;
}

interface Feat {
    id: string;
    name: string;
    description: string;
    prerequisites: string | null;
    benefits: string[];
    source: 'standard' | 'homebrew';
}

export default function LevelUpModal({
    campaignPlayerId,
    currentLevel,
    currentStats,
    campaignId,
    onClose,
    onComplete,
}: LevelUpModalProps) {
    const [choice, setChoice] = useState<'feat' | 'asi' | null>(null);
    const [selectedFeatId, setSelectedFeatId] = useState('');
    const [availableFeats, setAvailableFeats] = useState<Feat[]>([]);
    const [asiStats, setAsiStats] = useState({
        stat1: '' as keyof typeof currentStats | '',
        points1: 0,
        stat2: '' as keyof typeof currentStats | '',
        points2: 0,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (choice === 'feat') {
            loadFeats();
        }
    }, [choice]);

    const loadFeats = async () => {
        // Load standard feats
        const { data: standard } = await supabase
            .from('standard_feats')
            .select('*');

        // Load campaign homebrew feats
        const { data: homebrew } = await supabase
            .from('homebrew_feats')
            .select('*')
            .eq('campaign_id', campaignId);

        const allFeats = [
            ...(standard || []).map(f => ({ ...f, source: 'standard' as const, benefits: f.benefits || [] })),
            ...(homebrew || []).map(f => ({ ...f, source: 'homebrew' as const, benefits: f.benefits || [] })),
        ];

        setAvailableFeats(allFeats);
    };

    const validateASI = () => {
        const { stat1, points1, stat2, points2 } = asiStats;

        // Must select at least one stat
        if (!stat1) return false;

        // Total points must be 2
        const totalPoints = points1 + points2;
        if (totalPoints !== 2) return false;

        // If using 2 stats, each must be +1
        if (stat2 && (points1 !== 1 || points2 !== 1)) return false;

        // If using 1 stat, must be +2
        if (!stat2 && points1 !== 2) return false;

        // Cannot exceed 20
        if (stat1 && currentStats[stat1] + points1 > 20) return false;
        if (stat2 && currentStats[stat2] + points2 > 20) return false;

        return true;
    };

    const handleComplete = async () => {
        setLoading(true);

        try {
            if (choice === 'feat') {
                // Save feat selection
                await supabase
                    .from('player_feats')
                    .insert({
                        campaign_player_id: campaignPlayerId,
                        feat_id: selectedFeatId,
                        feat_type: availableFeats.find(f => f.id === selectedFeatId)?.source || 'standard',
                        level_acquired: currentLevel,
                    });
            } else if (choice === 'asi') {
                // Update character stats
                const { stat1, points1, stat2, points2 } = asiStats;
                const newStats = { ...currentStats };
                if (stat1) newStats[stat1] += points1;
                if (stat2) newStats[stat2] += points2;

                await supabase
                    .from('character_stats')
                    .update({
                        str: newStats.str,
                        dex: newStats.dex,
                        con: newStats.con,
                        int: newStats.int,
                        wis: newStats.wis,
                        cha: newStats.cha,
                    })
                    .eq('campaign_player_id', campaignPlayerId);
            }

            onComplete();
        } catch (error) {
            console.error('Error completing level up:', error);
            alert('Failed to complete level up');
        } finally {
            setLoading(false);
        }
    };

    const canComplete = () => {
        if (choice === 'feat') return !!selectedFeatId;
        if (choice === 'asi') return validateASI();
        return false;
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg border-2 border-yellow-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <TrendingUp size={32} className="text-white" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Level Up!</h2>
                            <p className="text-yellow-100">You've reached level {currentLevel}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-yellow-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {!choice ? (
                        // Choice Selection
                        <div className="space-y-4">
                            <p className="text-gray-300 text-center mb-6">
                                Choose your level up bonus:
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Feat Option */}
                                <button
                                    onClick={() => setChoice('feat')}
                                    className="bg-gray-700 hover:bg-purple-700 border-2 border-purple-500 rounded-lg p-6 transition-colors group"
                                >
                                    <Award size={48} className="mx-auto text-purple-400 mb-3 group-hover:text-white" />
                                    <h3 className="text-xl font-bold text-white mb-2">Choose a Feat</h3>
                                    <p className="text-gray-400 text-sm">
                                        Gain a special ability or feature from the feat list
                                    </p>
                                </button>

                                {/* ASI Option */}
                                <button
                                    onClick={() => setChoice('asi')}
                                    className="bg-gray-700 hover:bg-blue-700 border-2 border-blue-500 rounded-lg p-6 transition-colors group"
                                >
                                    <TrendingUp size={48} className="mx-auto text-blue-400 mb-3 group-hover:text-white" />
                                    <h3 className="text-xl font-bold text-white mb-2">Ability Score Improvement</h3>
                                    <p className="text-gray-400 text-sm">
                                        +2 to one stat OR +1 to two stats (max 20)
                                    </p>
                                </button>
                            </div>
                        </div>
                    ) : choice === 'feat' ? (
                        // Feat Selection
                        <div className="space-y-4">
                            <button
                                onClick={() => setChoice(null)}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                ← Back to choice
                            </button>

                            <h3 className="text-xl font-bold text-white">Select a Feat</h3>

                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {availableFeats.map((feat) => (
                                    <div
                                        key={feat.id}
                                        onClick={() => setSelectedFeatId(feat.id)}
                                        className={`bg-gray-700 rounded-lg border-2 p-4 cursor-pointer transition-colors ${selectedFeatId === feat.id
                                                ? 'border-yellow-500 bg-gray-600'
                                                : 'border-gray-600 hover:border-gray-500'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="text-white font-bold">{feat.name}</h4>
                                            {feat.source === 'homebrew' && (
                                                <span className="px-2 py-1 bg-purple-900/30 text-purple-400 text-xs rounded">
                                                    Homebrew
                                                </span>
                                            )}
                                        </div>
                                        {feat.prerequisites && (
                                            <p className="text-gray-500 text-sm mb-2">
                                                Prerequisites: {feat.prerequisites}
                                            </p>
                                        )}
                                        <p className="text-gray-300 text-sm mb-2">{feat.description}</p>
                                        {feat.benefits.length > 0 && (
                                            <ul className="space-y-1">
                                                {feat.benefits.map((benefit, idx) => (
                                                    <li key={idx} className="text-sm text-gray-400 flex gap-2">
                                                        <span className="text-yellow-500">•</span>
                                                        <span>{benefit}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // ASI Selection
                        <div className="space-y-4">
                            <button
                                onClick={() => setChoice(null)}
                                className="text-gray-400 hover:text-white text-sm"
                            >
                                ← Back to choice
                            </button>

                            <h3 className="text-xl font-bold text-white">Ability Score Improvement</h3>
                            <p className="text-gray-400 text-sm">
                                Increase one ability by +2, or two abilities by +1 each. No ability can exceed 20.
                            </p>

                            {/* Stat 1 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Ability 1</label>
                                    <select
                                        value={asiStats.stat1}
                                        onChange={(e) => setAsiStats({ ...asiStats, stat1: e.target.value as any })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    >
                                        <option value="">Select...</option>
                                        <option value="str">Strength ({currentStats.str})</option>
                                        <option value="dex">Dexterity ({currentStats.dex})</option>
                                        <option value="con">Constitution ({currentStats.con})</option>
                                        <option value="int">Intelligence ({currentStats.int})</option>
                                        <option value="wis">Wisdom ({currentStats.wis})</option>
                                        <option value="cha">Charisma ({currentStats.cha})</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                                    <select
                                        value={asiStats.points1}
                                        onChange={(e) => setAsiStats({ ...asiStats, points1: parseInt(e.target.value) })}
                                        disabled={!asiStats.stat1}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                                    >
                                        <option value="0">0</option>
                                        <option value="1">+1</option>
                                        <option value="2">+2</option>
                                    </select>
                                </div>
                            </div>

                            {/* Stat 2 (Optional) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Ability 2 (Optional)</label>
                                    <select
                                        value={asiStats.stat2}
                                        onChange={(e) => setAsiStats({ ...asiStats, stat2: e.target.value as any })}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                    >
                                        <option value="">None</option>
                                        <option value="str">Strength ({currentStats.str})</option>
                                        <option value="dex">Dexterity ({currentStats.dex})</option>
                                        <option value="con">Constitution ({currentStats.con})</option>
                                        <option value="int">Intelligence ({currentStats.int})</option>
                                        <option value="wis">Wisdom ({currentStats.wis})</option>
                                        <option value="cha">Charisma ({currentStats.cha})</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                                    <select
                                        value={asiStats.points2}
                                        onChange={(e) => setAsiStats({ ...asiStats, points2: parseInt(e.target.value) })}
                                        disabled={!asiStats.stat2}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:opacity-50"
                                    >
                                        <option value="0">0</option>
                                        <option value="1">+1</option>
                                    </select>
                                </div>
                            </div>

                            {/* Validation Messages */}
                            {!validateASI() && asiStats.stat1 && (
                                <div className="bg-red-900/20 border border-red-500 rounded p-3 text-red-400 text-sm">
                                    {asiStats.points1 + asiStats.points2 !== 2 && 'Total points must equal 2.'}
                                    {asiStats.stat1 && currentStats[asiStats.stat1] + asiStats.points1 > 20 && ' Cannot exceed 20.'}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {choice && (
                    <div className="p-6 bg-gray-900 border-t border-gray-700 flex gap-3">
                        <button
                            onClick={handleComplete}
                            disabled={!canComplete() || loading}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            {loading ? 'Applying...' : 'Confirm Level Up'}
                        </button>
                        <button
                            onClick={() => setChoice(null)}
                            className="px-6 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                        >
                            Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

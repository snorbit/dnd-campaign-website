'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

interface Campaign {
    id: string;
    name: string;
    description: string;
    dm_id: string;
    last_played_at: string;
    player_count?: number;
    is_dm: boolean;
}

export default function CampaignsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newCampaignDesc, setNewCampaignDesc] = useState('');

    const router = useRouter();
    // Using imported supabase client

    useEffect(() => {
        checkUser();
        loadCampaigns();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/auth/login');
        } else {
            setUser(user);
        }
    };

    const loadCampaigns = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get campaigns where user is DM
            const { data: dmCampaigns } = await supabase
                .from('campaigns')
                .select('*')
                .eq('dm_id', user.id);

            // Get campaigns where user is player
            const { data: playerCampaigns } = await supabase
                .from('campaign_players')
                .select('campaign_id, campaigns(*)')
                .eq('player_id', user.id);

            const dm = (dmCampaigns || []).map(c => ({ ...c, is_dm: true }));
            const player = (playerCampaigns || []).map(cp => ({
                ...cp.campaigns,
                is_dm: false
            }));

            setCampaigns([...dm, ...player]);
        } catch (error) {
            console.error('Error loading campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const createCampaign = async () => {
        if (!user || !newCampaignName) return;

        try {
            const { data, error } = await supabase
                .from('campaigns')
                .insert({
                    name: newCampaignName,
                    description: newCampaignDesc,
                    dm_id: user.id
                })
                .select()
                .single();

            if (error) {
                alert('Campaign error: ' + error.message);
                console.error('Campaign insert error:', error);
                return;
            }

            // Create initial campaign state
            const { error: stateError } = await supabase
                .from('campaign_state')
                .insert({ campaign_id: data.id });

            if (stateError) {
                alert('State error: ' + stateError.message);
                console.error('State insert error:', stateError);
            }

            setShowCreateModal(false);
            setNewCampaignName('');
            setNewCampaignDesc('');
            loadCampaigns();
        } catch (error: any) {
            alert('Error: ' + error.message);
            console.error('Error creating campaign:', error);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        router.push('/auth/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
                <div className="text-white text-xl">Loading campaigns...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">My Campaigns</h1>
                        <p className="text-gray-400">Welcome back, {user?.user_metadata?.username || 'Adventurer'}!</p>
                    </div>
                    <button
                        onClick={logout}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Logout
                    </button>
                </div>

                {/* Create Campaign Button */}
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="mb-6 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors"
                >
                    + Create New Campaign
                </button>

                {/* Campaigns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            onClick={() => router.push(campaign.is_dm ? `/dm/${campaign.id}` : `/player/${campaign.id}`)}
                            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-yellow-500 cursor-pointer transition-all hover:shadow-xl"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xl font-bold text-white">{campaign.name}</h3>
                                {campaign.is_dm && (
                                    <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">DM</span>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm mb-4">{campaign.description || 'No description'}</p>
                            <div className="text-gray-500 text-xs">
                                Last played: {new Date(campaign.last_played_at).toLocaleDateString()}
                            </div>
                        </div>
                    ))}

                    {campaigns.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <p className="text-xl mb-2">No campaigns yet!</p>
                            <p className="text-sm">Create your first campaign or join one as a player.</p>
                        </div>
                    )}
                </div>

                {/* Create Campaign Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-6">Create New Campaign</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Name</label>
                                    <input
                                        type="text"
                                        value={newCampaignName}
                                        onChange={(e) => setNewCampaignName(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                                        placeholder="The Lost Mines of Phandelver"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                                    <textarea
                                        value={newCampaignDesc}
                                        onChange={(e) => setNewCampaignDesc(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                                        placeholder="A classic D&D adventure..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={createCampaign}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Create
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setNewCampaignName('');
                                        setNewCampaignDesc('');
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
        </div>
    );
}

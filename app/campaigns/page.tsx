'use client';

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface Campaign {
    id: string;
    name: string;
    description: string;
    dm_id: string;
    last_played_at: string;
    join_code?: string;
    player_count?: number;
    is_dm: boolean;
}

export default function CampaignsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newCampaignDesc, setNewCampaignDesc] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [joinError, setJoinError] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // holds campaign id to delete

    const router = useRouter();

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
            const player = (playerCampaigns || []).map((cp: any) => ({
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

    // Generate unique join code
    const generateJoinCode = (): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const createCampaign = async () => {
        if (!user || !newCampaignName) return;

        try {
            let attempts = 0;
            let success = false;
            let campaignData = null;

            while (attempts < 5 && !success) {
                const join_code = generateJoinCode();
                const { data, error } = await supabase
                    .from('campaigns')
                    .insert({
                        name: newCampaignName,
                        description: newCampaignDesc,
                        dm_id: user.id,
                        join_code: join_code
                    })
                    .select()
                    .single();

                if (!error) {
                    campaignData = data;
                    success = true;
                } else if (error.code !== '23505') {
                    toast.error('Campaign error', { description: error.message });
                    return;
                }
                attempts++;
            }

            if (!success || !campaignData) {
                toast.error('Failed to generate unique campaign code. Please try again.');
                return;
            }

            // Create initial campaign state
            const { error: stateError } = await supabase
                .from('campaign_state')
                .insert({ campaign_id: campaignData.id });

            if (stateError) {
                toast.error('State error', { description: stateError.message });
                console.error('State insert error:', stateError);
            }

            setShowCreateModal(false);
            setNewCampaignName('');
            setNewCampaignDesc('');
            toast.success('Campaign created!', { description: `Join code: ${campaignData.join_code}` });
            loadCampaigns();
        } catch (error: any) {
            toast.error('Error', { description: error.message });
        }
    };

    const joinCampaign = async () => {
        if (!user || !joinCode) {
            setJoinError('Please enter a campaign code');
            return;
        }

        setJoinLoading(true);
        setJoinError('');

        try {
            // Use a server-side RPC to bypass RLS for the lookup
            // This queries campaigns by join_code using a Postgres function
            // Fall back: query directly and handle RLS blocks gracefully
            const { data: campaign, error: findError } = await supabase
                .from('campaigns')
                .select('id, dm_id, name')
                .eq('join_code', joinCode.toUpperCase().trim())
                .maybeSingle();

            if (findError) {
                // RLS may be blocking — try the service role workaround via API
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/join-campaign', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token || ''}`
                    },
                    body: JSON.stringify({ joinCode: joinCode.toUpperCase().trim() })
                });
                const result = await res.json();

                if (!res.ok) {
                    setJoinError(result.error || 'Invalid campaign code');
                    return;
                }

                // Successfully joined via API
                setShowJoinModal(false);
                setJoinCode('');
                setJoinError('');
                toast.success(`Joined ${result.campaignName}!`, { description: 'Redirecting...' });
                setTimeout(() => router.push(`/player/${result.campaignId}`), 1000);
                return;
            }

            if (!campaign) {
                setJoinError('Invalid campaign code. Double-check and try again.');
                return;
            }

            if (campaign.dm_id === user.id) {
                setJoinError('You are the DM of this campaign!');
                return;
            }

            // Check if already joined
            const { data: existing } = await supabase
                .from('campaign_players')
                .select('id')
                .eq('campaign_id', campaign.id)
                .eq('player_id', user.id)
                .maybeSingle();

            if (existing) {
                setJoinError('You are already in this campaign!');
                return;
            }

            // Add player with a default character name
            const characterName = user.user_metadata?.username || user.email?.split('@')[0] || 'Adventurer';
            const { error: joinErr } = await supabase
                .from('campaign_players')
                .insert({
                    campaign_id: campaign.id,
                    player_id: user.id,
                    character_name: characterName
                });

            if (joinErr) {
                setJoinError('Failed to join: ' + joinErr.message);
                return;
            }

            setShowJoinModal(false);
            setJoinCode('');
            toast.success(`Joined ${campaign.name}!`, { description: 'You can now enter the campaign.' });
            loadCampaigns();
        } catch (error: any) {
            setJoinError('Error: ' + error.message);
        } finally {
            setJoinLoading(false);
        }
    };

    const deleteCampaign = async (campaignId: string) => {
        try {
            const { error } = await supabase
                .from('campaigns')
                .delete()
                .eq('id', campaignId);

            if (error) throw error;

            setDeleteConfirm(null);
            toast.success('Campaign deleted');
            loadCampaigns();
        } catch (error: any) {
            toast.error('Failed to delete campaign', { description: error.message });
        }
    };

    const copyJoinCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
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

                {/* Action Buttons */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setShowJoinModal(true)}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                    >
                        📝 Enter Campaign Code
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-lg transition-colors"
                    >
                        + Create New Campaign
                    </button>
                </div>

                {/* Campaigns Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((campaign) => (
                        <div
                            key={campaign.id}
                            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-yellow-500 transition-all hover:shadow-xl relative group"
                        >
                            <div
                                onClick={() => router.push(campaign.is_dm ? `/dm/${campaign.id}` : `/player/${campaign.id}`)}
                                className="cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-xl font-bold text-white">{campaign.name}</h3>
                                    <div className="flex items-center gap-2">
                                        {campaign.is_dm && (
                                            <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">DM</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-gray-400 text-sm mb-4">{campaign.description || 'No description'}</p>
                                <div className="text-gray-500 text-xs">
                                    Last played: {new Date(campaign.last_played_at).toLocaleDateString()}
                                </div>
                            </div>

                            {/* Show join code for DM campaigns */}
                            {campaign.is_dm && campaign.join_code && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-1">Join Code</p>
                                            <p className="text-2xl font-mono font-bold text-yellow-400 tracking-wider">
                                                {campaign.join_code}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyJoinCode(campaign.join_code!);
                                            }}
                                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                                        >
                                            {copiedCode === campaign.join_code ? '✓ Copied!' : '📋 Copy'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Delete button (DM only) */}
                            {campaign.is_dm && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirm(campaign.id);
                                    }}
                                    className="absolute top-3 right-3 p-1.5 bg-red-900/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Campaign"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
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
                                        onKeyDown={(e) => e.key === 'Enter' && createCampaign()}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-500 focus:outline-none"
                                        placeholder="The Lost Mines of Phandelver"
                                        autoFocus
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

                                <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-3">
                                    <p className="text-yellow-400 text-sm">
                                        💡 After creating, you'll get a unique join code to share with your players!
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={createCampaign}
                                    disabled={!newCampaignName}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
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

                {/* Join Campaign Modal */}
                {showJoinModal && (
                    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full border border-gray-700">
                            <h2 className="text-2xl font-bold text-white mb-6">Join Campaign</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Campaign Join Code</label>
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => {
                                            setJoinCode(e.target.value.toUpperCase());
                                            setJoinError('');
                                        }}
                                        onKeyDown={(e) => e.key === 'Enter' && joinCampaign()}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:border-green-500 focus:outline-none uppercase"
                                        placeholder="ABC123"
                                        maxLength={6}
                                        autoFocus
                                    />
                                </div>

                                {joinError && (
                                    <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
                                        <p className="text-red-400 text-sm">{joinError}</p>
                                    </div>
                                )}

                                <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
                                    <p className="text-blue-400 text-sm">
                                        💡 Ask your DM for the 6-character campaign code!
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={joinCampaign}
                                    disabled={!joinCode || joinCode.length !== 6 || joinLoading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    {joinLoading ? 'Joining...' : 'Join Campaign'}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowJoinModal(false);
                                        setJoinCode('');
                                        setJoinError('');
                                    }}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {deleteConfirm && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-800 rounded-lg p-8 max-w-sm w-full border border-red-700">
                            <h2 className="text-xl font-bold text-white mb-2">Delete Campaign?</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                This will permanently delete the campaign, all player data, maps, quests, and session history. <span className="text-red-400 font-bold">This cannot be undone.</span>
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => deleteCampaign(deleteConfirm)}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                                >
                                    Yes, Delete
                                </button>
                                <button
                                    onClick={() => setDeleteConfirm(null)}
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

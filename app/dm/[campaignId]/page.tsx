'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Map, Swords, Users, ScrollText, UserCircle, Package, Award } from 'lucide-react';

type TabId = 'maps' | 'encounters' | 'players' | 'quests' | 'npcs' | 'items' | 'feats';

const tabs = [
    { id: 'maps' as TabId, label: 'Maps', icon: Map },
    { id: 'encounters' as TabId, label: 'Encounters', icon: Swords },
    { id: 'players' as TabId, label: 'Players', icon: Users },
    { id: 'quests' as TabId, label: 'Quests', icon: ScrollText },
    { id: 'npcs' as TabId, label: 'NPCs', icon: UserCircle },
    { id: 'items' as TabId, label: 'Items', icon: Package },
    { id: 'feats' as TabId, label: 'Feats', icon: Award },
];

export default function DMCampaignPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClientComponentClient();

    const [activeTab, setActiveTab] = useState<TabId>('maps');
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaign();
    }, [params.campaignId]);

    const loadCampaign = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', params.campaignId)
                .eq('dm_id', user.id)
                .single();

            if (error || !data) {
                console.error('Not authorized or campaign not found');
                router.push('/campaigns');
                return;
            }

            setCampaign(data);
        } catch (error) {
            console.error('Error loading campaign:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
                <div className="text-white text-xl">Loading campaign...</div>
            </div>
        );
    }

    if (!campaign) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
                {/* Campaign Header */}
                <div className="p-4 border-b border-gray-700">
                    <button
                        onClick={() => router.push('/campaigns')}
                        className="text-gray-400 hover:text-white text-sm mb-2"
                    >
                        ← Back to Campaigns
                    </button>
                    <h2 className="text-xl font-bold text-white truncate">{campaign.name}</h2>
                    <span className="text-xs text-yellow-500 font-semibold">DUNGEON MASTER</span>
                </div>

                {/* Tabs */}
                <nav className="flex-1 p-4 space-y-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-yellow-600 text-white font-bold'
                                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <h1 className="text-3xl font-bold text-white mb-6 capitalize">{activeTab}</h1>

                    {/* Tab Content Placeholder */}
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
                        <p className="text-gray-400">
                            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} tab content coming soon...
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                            This feature is under construction 🚧
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

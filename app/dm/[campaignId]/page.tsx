'use client';

import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Map, Swords, Users, ScrollText, UserCircle, Package, Award } from 'lucide-react';
import MapsTab from '@/components/dm/MapsTab';
import EncountersTab from '@/components/dm/EncountersTab';
import PlayersTab from '@/components/dm/PlayersTab';
import QuestsTab from '@/components/dm/QuestsTab';
import NPCsTab from '@/components/dm/NPCsTab';
import ItemsTab from '@/components/dm/ItemsTab';
import DMFeatsTab from '@/components/dm/FeatsTab';

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
    // Using imported supabase client

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

    const renderTabContent = () => {
        const campaignId = params.campaignId as string;

        switch (activeTab) {
            case 'maps':
                return <MapsTab campaignId={campaignId} />;
            case 'encounters':
                return <EncountersTab campaignId={campaignId} />;
            case 'players':
                return <PlayersTab campaignId={campaignId} />;
            case 'quests':
                return <QuestsTab campaignId={campaignId} />;
            case 'npcs':
                return <NPCsTab campaignId={campaignId} />;
            case 'items':
                return <ItemsTab campaignId={campaignId} />;
            case 'feats':
                return <DMFeatsTab campaignId={campaignId} />;
            default:
                return <div className="text-gray-400">Tab not found</div>;
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

                    {/* Join Code Display */}
                    {campaign.join_code && (
                        <div className="mt-3 p-3 bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border border-yellow-600/50 rounded-lg">
                            <p className="text-xs text-yellow-300 mb-1 font-semibold">CAMPAIGN CODE</p>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-2xl font-mono font-bold text-yellow-400 tracking-wider">
                                    {campaign.join_code}
                                </p>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(campaign.join_code);
                                        alert('Join code copied!');
                                    }}
                                    className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors shrink-0"
                                    title="Copy join code"
                                >
                                    📋
                                </button>
                            </div>
                            <p className="text-xs text-yellow-300/70 mt-2">Share this code with players</p>
                        </div>
                    )}
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
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
}

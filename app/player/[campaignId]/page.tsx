'use client';

import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Map, User, Backpack, Users, ScrollText, Award } from 'lucide-react';
import MapTab from '@/components/player/MapTab';
import StatsTab from '@/components/player/StatsTab';
import InventoryTab from '@/components/player/InventoryTab';
import PartyTab from '@/components/player/PartyTab';
import QuestsTab from '@/components/player/QuestsTab';
import FeatsTab from '@/components/player/FeatsTab';
import CharacterSheet from '@/components/player/CharacterSheet';
import { DiceRoller } from '@/components/shared/DiceRoller';
import { CampaignProvider } from '@/context/CampaignContext';

type TabId = 'character' | 'map' | 'stats' | 'inventory' | 'party' | 'quests' | 'feats';

const tabs = [
    { id: 'character' as TabId, label: 'Character', icon: User },
    { id: 'map' as TabId, label: 'Map', icon: Map },
    { id: 'inventory' as TabId, label: 'Inventory', icon: Backpack },
    { id: 'party' as TabId, label: 'Party', icon: Users },
    { id: 'quests' as TabId, label: 'Quests', icon: ScrollText },
    { id: 'feats' as TabId, label: 'Feats', icon: Award },
];

export default function PlayerCampaignPage() {
    const params = useParams();
    const router = useRouter();
    // Using imported supabase client

    const [activeTab, setActiveTab] = useState<TabId>('character');
    const [campaign, setCampaign] = useState<any>(null);
    const [character, setCharacter] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaignAndCharacter();
    }, [params.campaignId]);

    const loadCampaignAndCharacter = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth/login');
                return;
            }

            // Load campaign
            const { data: campaignData } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', params.campaignId)
                .single();

            // Load player's character in this campaign
            const { data: characterData } = await supabase
                .from('campaign_players')
                .select('*')
                .eq('campaign_id', params.campaignId)
                .eq('player_id', user.id)
                .single();

            if (!campaignData || !characterData) {
                console.error('Campaign or character not found');
                router.push('/campaigns');
                return;
            }

            setCampaign(campaignData);
            setCharacter(characterData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderTabContent = () => {
        const campaignId = params.campaignId as string;

        if (!character) return <div className="text-gray-400">Character not found</div>;

        switch (activeTab) {
            case 'character':
                return <CharacterSheet
                    campaignPlayerId={character.id}
                    characterName={character.character_name}
                    characterClass={character.character_class || 'Adventurer'}
                    level={character.level || 1}
                />;
            case 'map':
                return <MapTab campaignId={campaignId} />;
            case 'stats':
                return <StatsTab
                    campaignPlayerId={character.id}
                    level={character.level || 1}
                    characterClass={character.character_class || 'Adventurer'}
                />;
            case 'inventory':
                return <InventoryTab campaignPlayerId={character.id} />;
            case 'party':
                return <PartyTab campaignId={campaignId} />;
            case 'quests':
                return <QuestsTab campaignId={campaignId} />;
            case 'feats':
                return <FeatsTab campaignPlayerId={character.id} campaignId={campaignId} />;
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

    if (!campaign || !character) {
        return null;
    }

    return (
        <CampaignProvider>
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
                        <p className="text-sm text-gray-400 truncate">{character.character_name}</p>
                        <span className="text-xs text-blue-500 font-semibold">Level {character.level || 1}</span>
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
                                        ? 'bg-blue-600 text-white font-bold'
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
                <DiceRoller />
            </div>
        </CampaignProvider>
    );
}

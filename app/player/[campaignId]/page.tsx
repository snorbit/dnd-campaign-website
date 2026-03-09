'use client';

import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Map, User, Backpack, Users, ScrollText, Award, BarChart3, Menu, X, Book, Sparkles } from 'lucide-react';
import MapTab from '@/components/player/MapTab';
import StatsTab from '@/components/player/StatsTab';
import InventoryTab from '@/components/player/InventoryTab';
import PartyTab from '@/components/player/PartyTab';
import QuestsTab from '@/components/player/QuestsTab';
import FeatsTab from '@/components/player/FeatsTab';
import JournalTab from '@/components/player/JournalTab';
import SpellsTab from '@/components/player/SpellsTab';
import CharacterSheet from '@/components/player/CharacterSheet';
import { AudioPlayer } from '@/components/shared/AudioPlayer';
import TimeWidget from '@/components/shared/TimeWidget';
import { DiceRoller } from '@/components/shared/DiceRoller';
import { CampaignProvider } from '@/context/CampaignContext';

type TabId = 'character' | 'map' | 'stats' | 'inventory' | 'spells' | 'party' | 'quests' | 'feats' | 'journal';

const tabs = [
    { id: 'character' as TabId, label: 'Character', icon: User },
    { id: 'map' as TabId, label: 'Map', icon: Map },
    { id: 'stats' as TabId, label: 'Stats', icon: BarChart3 },
    { id: 'inventory' as TabId, label: 'Inventory', icon: Backpack },
    { id: 'spells' as TabId, label: 'Spells', icon: Sparkles },
    { id: 'party' as TabId, label: 'Party', icon: Users },
    { id: 'quests' as TabId, label: 'Quests', icon: ScrollText },
    { id: 'feats' as TabId, label: 'Feats', icon: Award },
    { id: 'journal' as TabId, label: 'Journals', icon: Book },
];

export default function PlayerCampaignPage() {
    const params = useParams();
    const router = useRouter();
    // Using imported supabase client

    const [activeTab, setActiveTab] = useState<TabId>('character');
    const [campaign, setCampaign] = useState<any>(null);
    const [character, setCharacter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
            case 'spells':
                return <SpellsTab campaignPlayerId={character.id} />;
            case 'party':
                return <PartyTab campaignId={campaignId} />;
            case 'quests':
                return <QuestsTab campaignId={campaignId} />;
            case 'feats':
                return <FeatsTab campaignPlayerId={character.id} campaignId={campaignId} />;
            case 'journal':
                return <JournalTab campaignId={campaignId} playerId={character.player_id} />;
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
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col md:flex-row h-screen">
                {/* Mobile Header */}
                <div className="md:hidden bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center z-20 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white truncate">{campaign.name}</h2>
                        <span className="text-xs text-blue-500 font-semibold">{character.character_name}</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-gray-400 hover:text-white"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Sidebar */}
                <div className={`
                    ${isSidebarOpen ? 'flex' : 'hidden'} 
                    md:flex flex-col 
                    w-full md:w-64 shrink-0 
                    bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700 
                    absolute md:relative z-10 
                    top-[73px] md:top-0 h-[calc(100vh-73px)] md:h-full
                `}>
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
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setIsSidebarOpen(false);
                                    }}
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
                <div className={`flex-1 overflow-y-auto w-full ${isSidebarOpen ? 'hidden md:block' : 'block'}`}>
                    <div className="p-4 md:p-8">
                        <TimeWidget />
                        {renderTabContent()}
                    </div>
                </div>
                <DiceRoller />
                <AudioPlayer />
            </div>
        </CampaignProvider>
    );
}

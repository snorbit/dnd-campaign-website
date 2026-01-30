'use client';

import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Map, Swords, Users, ScrollText, UserCircle, Package, Award, BookOpen } from 'lucide-react';
import MapsTab from '@/components/dm/MapsTab';
import EncountersTab from '@/components/dm/EncountersTab';
import PlayersTab from '@/components/dm/PlayersTab';
import QuestsTab from '@/components/dm/QuestsTab';
import NPCsTab from '@/components/dm/NPCsTab';
import ItemsTab from '@/components/dm/ItemsTab';
import DMFeatsTab from '@/components/dm/FeatsTab';
import { DiceRoller } from '@/components/shared/DiceRoller';
import { CampaignProvider, useCampaign } from '@/context/CampaignContext';
import { Loader2 } from 'lucide-react';

type TabId = 'maps' | 'encounters' | 'players' | 'quests' | 'npcs' | 'items' | 'feats' | 'sessions';

const tabs = [
    { id: 'maps' as TabId, label: 'Maps', icon: Map },
    { id: 'encounters' as TabId, label: 'Encounters', icon: Swords },
    { id: 'players' as TabId, label: 'Players', icon: Users },
    { id: 'quests' as TabId, label: 'Quests', icon: ScrollText },
    { id: 'npcs' as TabId, label: 'NPCs', icon: UserCircle },
    { id: 'items' as TabId, label: 'Items', icon: Package },
    { id: 'feats' as TabId, label: 'Feats', icon: Award },
    { id: 'sessions' as TabId, label: 'Sessions', icon: BookOpen },
];

export default function DMCampaignPage() {
    const params = useParams();
    const router = useRouter();
    // Using imported supabase client

    const [activeTab, setActiveTab] = useState<TabId>('maps');
    const [campaign, setCampaign] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [importing, setImporting] = useState(false);

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

    const handleImportCampaign = async () => {
        if (!importText.trim()) {
            toast.warning('Please enter campaign text');
            return;
        }

        const importPromise = (async () => {
            const response = await fetch('/api/import-campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    campaignId: params.campaignId,
                    campaignText: importText
                })
            });

            if (!response.ok) {
                throw new Error('Failed to import campaign');
            }

            const result = await response.json();
            return result;
        })();

        setImporting(true);
        toast.promise(importPromise, {
            loading: 'Importing session and generating content...',
            success: (data) => {
                setShowImportModal(false);
                setImportText('');
                setTimeout(() => window.location.reload(), 2000);
                return 'Campaign imported successfully!';
            },
            error: 'Failed to import campaign. Please try again.',
        });

        try {
            await importPromise;
        } catch (error) {
            console.error('Error importing campaign:', error);
        } finally {
            setImporting(false);
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
            case 'sessions':
                return <div className="text-gray-300">
                    <h2 className="text-2xl font-bold text-white mb-4">📚 Session History</h2>
                    <p className="text-gray-400 mb-6">
                        View and review all your imported sessions. Each session contains the maps, quests, items, and encounters you generated.
                    </p>
                    <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                        <p className="text-gray-400 mb-4">No sessions imported yet</p>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all"
                        >
                            📥 Import Your First Session
                        </button>
                    </div>
                </div>;
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
        <CampaignProvider>
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
                                            toast.success('Join code copied!', { icon: '📋' });
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

                    {/* Import Session Button */}
                    <div className="p-4 border-t border-gray-700">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">📥</span>
                            <span>Import Session</span>
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                            Auto-generate maps, quests & more
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto relative">
                    {/* Global Sync Overlay for Context Actions */}
                    <SyncIndicator />
                    <div className="p-8">
                        {renderTabContent()}
                    </div>
                </div>

                {/* Import Campaign Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-white mb-2">📥 Import Session</h2>
                            <p className="text-gray-400 text-sm mb-4">
                                Paste your session description and we'll automatically generate maps, quests, items, and encounters!
                            </p>

                            <div className="bg-gray-900 rounded p-4 mb-4">
                                <p className="text-xs text-gray-500 mb-2">Example format:</p>
                                <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                                    {`Session 3: The Cursed Temple

The adventurers seek the Sun Medallion in the Temple of Solara.

Locations:
1. Desert Approach - Sandy dunes, ancient statues
2. Temple Entrance - Stone pillars, hieroglyphs
3. Grand Hall - Columns, murals, center altar
4. Inner Sanctum - Golden chamber, sun beams

Quests:
- Retrieve the Sun Medallion
- Decipher the ancient puzzle

Encounters:
- Sand Elementals (entrance, 3 enemies)
- Temple Guardians (grand hall, 4 golems)
- Corrupted Sun Priest (boss, sanctum)

Items:
- Ancient Scroll
- Sun Medallion (quest item)
- Healing Elixir x3`}
                                </pre>
                            </div>

                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder="Paste your campaign session text here..."
                                rows={15}
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none mb-4 font-mono text-sm"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={handleImportCampaign}
                                    disabled={importing || !importText.trim()}
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {importing ? (
                                        <>
                                            <span className="animate-spin">⚙️</span>
                                            <span>Generating Campaign...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>🎨</span>
                                            <span>Generate Campaign</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setImportText('');
                                    }}
                                    disabled={importing}
                                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>

                            {importing && (
                                <div className="mt-4 p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
                                    <p className="text-purple-300 text-sm font-semibold mb-2">⏳ This may take a few minutes...</p>
                                    <p className="text-gray-400 text-xs">
                                        Parsing campaign text, generating maps for each location and travel paths, creating quests, items, and encounters...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <DiceRoller />
            </div>
        </CampaignProvider>
    );
}

function SyncIndicator() {
    const { isSyncing, connectionStatus } = useCampaign();

    if (!isSyncing && connectionStatus === 'connected') return null;

    return (
        <div className="fixed top-4 right-8 z-[70] pointer-events-none">
            {isSyncing ? (
                <div className="bg-blue-600/90 text-white px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                    <Loader2 size={14} className="animate-spin" />
                    <span>Syncing to DB...</span>
                </div>
            ) : connectionStatus === 'error' ? (
                <div className="bg-red-600/90 text-white px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 text-xs font-bold">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span>Connection Lost</span>
                </div>
            ) : null}
        </div>
    );
}

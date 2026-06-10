'use client';

import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { Map, Swords, Users, ScrollText, UserCircle, Package, Award, BookOpen, Menu, X, Coins, Edit3, Music, Calendar } from 'lucide-react';
import MapsTab from '@/components/dm/MapsTab';
import EncountersTab from '@/components/dm/EncountersTab';
import PlayersTab from '@/components/dm/PlayersTab';
import QuestsTab from '@/components/dm/QuestsTab';
import NPCsTab from '@/components/dm/NPCsTab';
import ItemsTab from '@/components/dm/ItemsTab';
import DMFeatsTab from '@/components/dm/FeatsTab';
import SessionsTab from '@/components/dm/SessionsTab';
import LootGeneratorTab from '@/components/dm/LootGeneratorTab';
import ScratchpadTab from '@/components/dm/ScratchpadTab';
import AudioTab from '@/components/dm/AudioTab';
import TimeTab from '@/components/dm/TimeTab';
import JournalsTab from '@/components/dm/JournalsTab';
import HomebrewTab from '@/components/dm/HomebrewTab';
import { AudioPlayer } from '@/components/shared/AudioPlayer';
import { DiceRoller } from '@/components/shared/DiceRoller';
import { LiveChat } from '@/components/shared/LiveChat';
import { CampaignProvider, useCampaign } from '@/context/CampaignContext';
import { Loader2 } from 'lucide-react';

type TabId = 'maps' | 'encounters' | 'players' | 'quests' | 'npcs' | 'items' | 'feats' | 'sessions' | 'loot' | 'scratchpad' | 'audio' | 'time' | 'journals' | 'homebrew';

const tabs = [
    { id: 'maps' as TabId, label: 'Maps', icon: Map },
    { id: 'encounters' as TabId, label: 'Encounters', icon: Swords },
    { id: 'players' as TabId, label: 'Players', icon: Users },
    { id: 'quests' as TabId, label: 'Quests', icon: ScrollText },
    { id: 'npcs' as TabId, label: 'NPCs', icon: UserCircle },
    { id: 'items' as TabId, label: 'Items', icon: Package },
    { id: 'loot' as TabId, label: 'Loot Gen', icon: Coins },
    { id: 'homebrew' as TabId, label: 'Homebrew', icon: Award },
    { id: 'time' as TabId, label: 'Time & Weather', icon: Calendar },
    { id: 'journals' as TabId, label: 'Journals', icon: BookOpen },
    { id: 'audio' as TabId, label: 'Audio', icon: Music },
    { id: 'scratchpad' as TabId, label: 'Scratchpad', icon: Edit3 },
    { id: 'feats' as TabId, label: 'Feats', icon: Award },
    { id: 'sessions' as TabId, label: 'Sessions', icon: BookOpen },
];

interface DMCampaign {
    id: string;
    name: string;
    dm_id: string;
    join_code?: string;
}

interface ReviewLocation {
    name: string;
    description: string;
    order: number;
    selected?: boolean;
}

interface ReviewQuest {
    name: string;
    description: string;
    reward?: string;
    selected?: boolean;
}

interface ReviewItem {
    name: string;
    quantity: number;
    selected?: boolean;
}

interface ReviewNPC {
    name: string;
    race: string;
    role: string;
    notes: string;
    selected?: boolean;
}

interface ReviewMonster {
    name: string;
    count: number;
    hp?: number;
    ac?: number;
    difficulty?: number;
}

interface ReviewEncounter {
    name: string;
    location: string;
    difficulty: number;
    monsters: ReviewMonster[];
    selected?: boolean;
}

interface SessionImportReview {
    title: string;
    description: string;
    locations: ReviewLocation[];
    quests: ReviewQuest[];
    items: ReviewItem[];
    npcs: ReviewNPC[];
    encounters: ReviewEncounter[];
}

type ReviewListKey = 'locations' | 'quests' | 'items' | 'npcs' | 'encounters';

export default function DMCampaignPage() {
    const params = useParams();
    const router = useRouter();
    // Using imported supabase client

    const [activeTab, setActiveTab] = useState<TabId>('maps');
    const [campaign, setCampaign] = useState<DMCampaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [importing, setImporting] = useState(false);
    const [previewingImport, setPreviewingImport] = useState(false);
    const [importStep, setImportStep] = useState<'paste' | 'review'>('paste');
    const [importReview, setImportReview] = useState<SessionImportReview | null>(null);
    const [importCounts, setImportCounts] = useState<{ maps: number; quests: number; items: number; npcs: number; encounters: number; monsters: number } | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [sessionRefreshKey, setSessionRefreshKey] = useState(0);
    const [loadError, setLoadError] = useState<string | null>(null);

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
                setLoadError('Campaign not found, or you do not have DM access to it.');
                return;
            }

            setCampaign(data);
        } catch (error) {
            console.error('Error loading campaign:', error);
            setLoadError('Could not load this campaign. Check your connection and try again.');
        } finally {
            setLoading(false);
        }
    };

    const getAccessToken = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            throw new Error('Not authenticated. Please log in again.');
        }
        return session.access_token;
    };

    const handlePreviewImport = async () => {
        if (!importText.trim()) {
            toast.warning('Please enter campaign text');
            return;
        }

        const importPromise = (async () => {
            const token = await getAccessToken();

            const response = await fetch('/api/import-campaign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'preview',
                    campaignId: params.campaignId,
                    campaignText: importText
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to import campaign');
            }

            return await response.json();
        })();

        setPreviewingImport(true);
        toast.promise(importPromise, {
            loading: 'Reading session script...',
            description: 'Sorting quests, NPCs, items, encounters, and locations into a review draft.',
            success: (data) => {
                setImportReview(markReviewSelected(data.review));
                setImportCounts(data.generated || null);
                setImportStep('review');
                return 'Review draft ready. Check it before saving.';
            },
            error: (err: Error) => `Review failed: ${err.message}`,
        });

        try {
            await importPromise;
        } catch (error) {
            console.error('Error previewing session import:', error);
        } finally {
            setPreviewingImport(false);
        }
    };

    const handleImportCampaign = async () => {
        if (!importReview) {
            toast.warning('Generate a review first');
            return;
        }

        const reviewedContent = stripUnselectedReview(importReview);

        const importPromise = (async () => {
            const token = await getAccessToken();

            const response = await fetch('/api/import-campaign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    action: 'save-reviewed',
                    campaignId: params.campaignId,
                    campaignText: importText,
                    review: reviewedContent,
                })
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to import campaign');
            }

            return await response.json();
        })();

        setImporting(true);
        toast.promise(importPromise, {
            loading: 'Saving reviewed session...',
            description: 'Only the checked content is being added to the campaign.',
            success: (data) => {
                resetImportModal();
                setActiveTab('sessions');
                setSessionRefreshKey(prev => prev + 1);
                return data?.summary || 'Session imported successfully.';
            },
            error: (err: Error) => `Import failed: ${err.message}`,
        });

        try {
            await importPromise;
        } catch (error) {
            console.error('Error importing reviewed campaign:', error);
        } finally {
            setImporting(false);
        }
    };

    const resetImportModal = () => {
        setShowImportModal(false);
        setImportText('');
        setImportStep('paste');
        setImportReview(null);
        setImportCounts(null);
    };

    const updateReviewItem = <K extends ReviewListKey>(
        section: K,
        index: number,
        updates: Partial<SessionImportReview[K][number]>
    ) => {
        setImportReview(prev => {
            if (!prev) return prev;
            const list = prev[section];
            if (!Array.isArray(list)) return prev;
            return {
                ...prev,
                [section]: list.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item),
            };
        });
    };

    const updateReviewField = (field: 'title' | 'description', value: string) => {
        setImportReview(prev => prev ? { ...prev, [field]: value } : prev);
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
            case 'loot':
                return <LootGeneratorTab campaignId={campaignId} />;
            case 'time':
                return <TimeTab campaignId={campaignId} />;
            case 'journals':
                return <JournalsTab campaignId={campaignId} />;
            case 'audio':
                return <AudioTab campaignId={campaignId} />;
            case 'scratchpad':
                return <ScratchpadTab campaignId={campaignId} />;
            case 'feats':
                return <DMFeatsTab campaignId={campaignId} />;
            case 'sessions':
                return <SessionsTab campaignId={campaignId} onImportClick={() => setShowImportModal(true)} refreshKey={sessionRefreshKey} />;
            case 'homebrew':
                return <HomebrewTab campaignId={campaignId} />;
            default:
                return <div className="text-gray-400">Tab not found</div>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 size={48} className="text-yellow-500 animate-spin" />
                    <div>
                        <div className="text-white text-xl font-bold">Loading Campaign</div>
                        <div className="text-gray-400 text-sm mt-1">Preparing your dungeon...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (loadError || !campaign) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-gray-800 border border-gray-700 rounded-lg p-6 text-center">
                    <h1 className="text-xl font-bold text-white mb-2">Campaign Unavailable</h1>
                    <p className="text-gray-400 text-sm mb-5">{loadError || 'Campaign data was not found.'}</p>
                    <button
                        onClick={() => router.push('/campaigns')}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold"
                    >
                        Back to Campaigns
                    </button>
                </div>
            </div>
        );
    }

    return (
        <CampaignProvider campaignId={params.campaignId as string}>
            <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col md:flex-row h-screen">
                {/* Mobile Header */}
                <div className="md:hidden bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center z-20 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-white truncate">{campaign.name}</h2>
                        <span className="text-xs text-yellow-500 font-semibold">DUNGEON MASTER</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="text-gray-400 hover:text-white"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                <div className={`
                    ${isSidebarOpen ? 'flex' : 'hidden'} 
                    md:flex flex-col 
                    w-full md:w-64 shrink-0 
                    bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700 
                    absolute md:relative z-10 
                    top-[73px] md:top-0 h-[calc(100vh-73px)] md:h-full
                    overflow-y-auto
                `}>
                    {/* Campaign Header */}
                    <div className="p-4 border-b border-gray-700">
                        <button
                            onClick={() => router.push('/campaigns')}
                            className="text-gray-400 hover:text-white text-sm mb-2"
                        >
                            Back to Campaigns
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
                                            navigator.clipboard.writeText(campaign.join_code!);
                                            toast.success('Join code copied!');
                                        }}
                                        className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors shrink-0"
                                        title="Copy join code"
                                    >
                                        Copy
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
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        setIsSidebarOpen(false);
                                    }}
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
                            <span>Import Session</span>
                        </button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                            Review quests, NPCs, items, encounters, and locations before saving
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className={`flex-1 overflow-y-auto relative ${isSidebarOpen ? 'hidden md:block' : 'block'}`}>
                    {/* Global Sync Overlay for Context Actions */}
                    <SyncIndicator />
                    <div className="p-4 md:p-8">
                        {renderTabContent()}
                    </div>
                </div>

                {/* Import Campaign Modal */}
                {showImportModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                        <div className="bg-gray-800 rounded-lg p-6 max-w-5xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-start justify-between gap-4 mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold text-white mb-2">Import Session</h2>
                                    <p className="text-gray-400 text-sm">
                                        First the website makes a review draft. Then you approve what should be saved.
                                    </p>
                                </div>
                                <div className="flex rounded-lg border border-gray-700 bg-gray-900 p-1 text-xs">
                                    <span className={`rounded px-3 py-1 ${importStep === 'paste' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>1. Paste</span>
                                    <span className={`rounded px-3 py-1 ${importStep === 'review' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>2. Review</span>
                                </div>
                            </div>

                            {importStep === 'paste' ? (
                                <>
                                    <div className="bg-gray-900 rounded p-4 mb-4">
                                        <p className="text-xs text-gray-500 mb-2">Best format for your sessions:</p>
                                        <pre className="text-xs text-gray-400 whitespace-pre-wrap">
                                            {`### QUEST HOOK: REVIEW THE LEDGER
**DM**: Quest Card
- **Name**: Review the Ledger
- **Hook**: Death keeps strict accounts.
- **Objective**: Find the Audit records.
- **Reward**: A lead to the archive.

### INTERACTION: MAYOR ELDRIN

## ENCOUNTER: THE RUSHING RIVER AMBUSH
### COMBAT NOTES
- **Goblins (4)**: Longbows
- **Hulking Worg**: Knocks players into the river

## THE AUDITOR'S TREASURY
**DM**: Loot Cache
- **Coin**: 120 gp, 180 sp
- **Potions**: 2 potions of healing`}
                                        </pre>
                                    </div>

                                    <textarea
                                        value={importText}
                                        onChange={(e) => setImportText(e.target.value)}
                                        placeholder="Paste your session script here..."
                                        rows={16}
                                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none mb-4 font-mono text-sm"
                                    />

                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        <button
                                            onClick={handlePreviewImport}
                                            disabled={previewingImport || !importText.trim()}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            {previewingImport ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    <span>Building Review...</span>
                                                </>
                                            ) : (
                                                <span>Review Session</span>
                                            )}
                                        </button>
                                        <button
                                            onClick={resetImportModal}
                                            disabled={previewingImport}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : importReview ? (
                                <>
                                    {importCounts && (
                                        <div className="mb-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-6">
                                            <ReviewCount label="Maps" value={importCounts.maps} />
                                            <ReviewCount label="Quests" value={importCounts.quests} />
                                            <ReviewCount label="NPCs" value={importCounts.npcs} />
                                            <ReviewCount label="Items" value={importCounts.items} />
                                            <ReviewCount label="Encounters" value={importCounts.encounters} />
                                            <ReviewCount label="Monsters" value={importCounts.monsters} />
                                        </div>
                                    )}

                                    <div className="mb-4 grid gap-3 sm:grid-cols-2">
                                        <label className="text-xs text-gray-300">
                                            Session Title
                                            <input
                                                value={importReview.title}
                                                onChange={(e) => updateReviewField('title', e.target.value)}
                                                className="mt-1 w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </label>
                                        <label className="text-xs text-gray-300">
                                            Short Summary
                                            <input
                                                value={importReview.description}
                                                onChange={(e) => updateReviewField('description', e.target.value)}
                                                className="mt-1 w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                                            />
                                        </label>
                                    </div>

                                    <div className="space-y-4">
                                        <ReviewSection title="Locations / Maps" helper="Checked locations will be used for session map jobs.">
                                            {importReview.locations.map((location, index) => (
                                                <ReviewRow key={`location-${index}`} checked={!!location.selected} onToggle={(checked) => updateReviewItem('locations', index, { selected: checked })}>
                                                    <input value={location.name} onChange={(e) => updateReviewItem('locations', index, { name: e.target.value })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm font-semibold text-white focus:border-purple-500 focus:outline-none" />
                                                    <textarea value={location.description} onChange={(e) => updateReviewItem('locations', index, { description: e.target.value })} rows={2} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                                                </ReviewRow>
                                            ))}
                                        </ReviewSection>

                                        <ReviewSection title="Quests" helper="Checked quests become active quest cards.">
                                            {importReview.quests.map((quest, index) => (
                                                <ReviewRow key={`quest-${index}`} checked={!!quest.selected} onToggle={(checked) => updateReviewItem('quests', index, { selected: checked })}>
                                                    <input value={quest.name} onChange={(e) => updateReviewItem('quests', index, { name: e.target.value })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm font-semibold text-white focus:border-purple-500 focus:outline-none" />
                                                    <textarea value={quest.description} onChange={(e) => updateReviewItem('quests', index, { description: e.target.value })} rows={2} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                                                    <input value={quest.reward || ''} onChange={(e) => updateReviewItem('quests', index, { reward: e.target.value })} placeholder="Reward" className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                                                </ReviewRow>
                                            ))}
                                        </ReviewSection>

                                        <ReviewSection title="NPCs" helper="Checked NPCs are added to the NPC tab.">
                                            {importReview.npcs.map((npc, index) => (
                                                <ReviewRow key={`npc-${index}`} checked={!!npc.selected} onToggle={(checked) => updateReviewItem('npcs', index, { selected: checked })}>
                                                    <div className="grid gap-2 sm:grid-cols-3">
                                                        <input value={npc.name} onChange={(e) => updateReviewItem('npcs', index, { name: e.target.value })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm font-semibold text-white focus:border-purple-500 focus:outline-none" />
                                                        <input value={npc.race} onChange={(e) => updateReviewItem('npcs', index, { race: e.target.value })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                                                        <input value={npc.role} onChange={(e) => updateReviewItem('npcs', index, { role: e.target.value })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                                                    </div>
                                                    <textarea value={npc.notes} onChange={(e) => updateReviewItem('npcs', index, { notes: e.target.value })} rows={2} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                                                </ReviewRow>
                                            ))}
                                        </ReviewSection>

                                        <ReviewSection title="Items" helper="Checked items are added to the item list.">
                                            {importReview.items.map((item, index) => (
                                                <ReviewRow key={`item-${index}`} checked={!!item.selected} onToggle={(checked) => updateReviewItem('items', index, { selected: checked })}>
                                                    <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                                                        <input value={item.name} onChange={(e) => updateReviewItem('items', index, { name: e.target.value })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm font-semibold text-white focus:border-purple-500 focus:outline-none" />
                                                        <input type="number" min={1} value={item.quantity} onChange={(e) => updateReviewItem('items', index, { quantity: Math.max(1, Number(e.target.value) || 1) })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                                                    </div>
                                                </ReviewRow>
                                            ))}
                                        </ReviewSection>

                                        <ReviewSection title="Encounters" helper="Checked encounters are added as planned encounters.">
                                            {importReview.encounters.map((encounter, index) => (
                                                <ReviewRow key={`encounter-${index}`} checked={!!encounter.selected} onToggle={(checked) => updateReviewItem('encounters', index, { selected: checked })}>
                                                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_100px]">
                                                        <input value={encounter.name} onChange={(e) => updateReviewItem('encounters', index, { name: e.target.value })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm font-semibold text-white focus:border-purple-500 focus:outline-none" />
                                                        <input value={encounter.location} onChange={(e) => updateReviewItem('encounters', index, { location: e.target.value })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                                                        <input type="number" min={1} value={encounter.difficulty} onChange={(e) => updateReviewItem('encounters', index, { difficulty: Math.max(1, Number(e.target.value) || 1) })} className="w-full rounded border border-gray-600 bg-gray-700 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        Monsters: {encounter.monsters.map(monster => `${monster.count} ${monster.name}${monster.hp ? ` HP ${monster.hp}` : ''}${monster.ac ? ` AC ${monster.ac}` : ''}`).join(', ') || 'None'}
                                                    </p>
                                                </ReviewRow>
                                            ))}
                                        </ReviewSection>
                                    </div>

                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                        <button
                                            onClick={handleImportCampaign}
                                            disabled={importing}
                                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            {importing ? (
                                                <>
                                                    <Loader2 size={18} className="animate-spin" />
                                                    <span>Saving Session...</span>
                                                </>
                                            ) : (
                                                <span>Save Checked Content</span>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setImportStep('paste')}
                                            disabled={importing}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={resetImportModal}
                                            disabled={importing}
                                            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700 text-white rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    {importing && (
                                        <div className="mt-4 p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
                                            <p className="text-purple-300 text-sm font-semibold mb-2">Saving your approved session content...</p>
                                            <p className="text-gray-500 text-xs">
                                                The checked locations and encounters may still create map jobs, so this can take a little while.
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : null}
                        </div>
                    </div>
                )}
                <DiceRoller />
                <AudioPlayer campaignId={params.campaignId as string} />
                <LiveChat campaignId={params.campaignId as string} currentUserId={campaign.dm_id} currentUserName="DUNGEON MASTER" isDm={true} />
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

function ReviewCount({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-3 text-center">
            <div className="text-lg font-bold text-white">{value}</div>
            <div className="text-gray-500">{label}</div>
        </div>
    );
}

function ReviewSection({ title, helper, children }: { title: string; helper: string; children: ReactNode }) {
    return (
        <section className="rounded-lg border border-gray-700 bg-gray-900 p-4">
            <div className="mb-3">
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs text-gray-500">{helper}</p>
            </div>
            <div className="space-y-3">
                {children}
            </div>
        </section>
    );
}

function ReviewRow({ checked, onToggle, children }: { checked: boolean; onToggle: (checked: boolean) => void; children: ReactNode }) {
    return (
        <div className={`rounded-lg border p-3 transition-colors ${checked ? 'border-gray-700 bg-gray-800' : 'border-gray-800 bg-gray-950 opacity-60'}`}>
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-300">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => onToggle(event.target.checked)}
                    className="h-4 w-4"
                />
                Save this
            </label>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    );
}

function markReviewSelected(review: SessionImportReview): SessionImportReview {
    return {
        ...review,
        locations: review.locations.map(item => ({ ...item, selected: true })),
        quests: review.quests.map(item => ({ ...item, selected: true })),
        items: review.items.map(item => ({ ...item, selected: true })),
        npcs: review.npcs.map(item => ({ ...item, selected: true })),
        encounters: review.encounters.map(item => ({ ...item, selected: true })),
    };
}

function stripUnselectedReview(review: SessionImportReview): SessionImportReview {
    return {
        title: review.title,
        description: review.description,
        locations: review.locations.filter(item => item.selected).map(({ selected, ...item }) => item),
        quests: review.quests.filter(item => item.selected).map(({ selected, ...item }) => item),
        items: review.items.filter(item => item.selected).map(({ selected, ...item }) => item),
        npcs: review.npcs.filter(item => item.selected).map(({ selected, ...item }) => item),
        encounters: review.encounters.filter(item => item.selected).map(({ selected, ...item }) => item),
    };
}

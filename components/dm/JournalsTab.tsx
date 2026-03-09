'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Book, Edit3, Plus, Trash2, Save, Globe, Lock, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface JournalsTabProps {
    campaignId: string;
}

interface PlayerInfo {
    id: string;
    character_name: string;
    player_id: string;
}

interface Journal {
    id: string;
    title: string;
    content: string;
    is_public: boolean;
    image_url: string | null;
    updated_at: string;
    player_id: string; // To know whose journal this is
}

export default function JournalsTab({ campaignId }: JournalsTabProps) {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [players, setPlayers] = useState<PlayerInfo[]>([]);
    const [activeJournal, setActiveJournal] = useState<Journal | null>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editImageUrl, setEditImageUrl] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [editPlayerId, setEditPlayerId] = useState<string>(''); // For creating new journals

    useEffect(() => {
        loadData();
    }, [campaignId]);

    const loadData = async () => {
        try {
            setLoading(true);

            // Load players
            const { data: playersData, error: playersError } = await supabase
                .from('campaign_players')
                .select('id, character_name, player_id')
                .eq('campaign_id', campaignId);

            if (playersError) throw playersError;
            setPlayers(playersData || []);

            // Load journals
            const { data: journalsData, error: journalsError } = await supabase
                .from('player_journals')
                .select('*')
                .eq('campaign_id', campaignId)
                .order('updated_at', { ascending: false });

            if (journalsError) throw journalsError;
            setJournals(journalsData || []);

            if (journalsData && journalsData.length > 0 && !activeJournal) {
                openJournal(journalsData[0]);
            }
        } catch (error) {
            console.error('Error loading journals data:', error);
            toast.error('Failed to load journals');
        } finally {
            setLoading(false);
        }
    };

    const openJournal = (journal: Journal) => {
        setActiveJournal(journal);
        setEditTitle(journal.title);
        setEditContent(journal.content || '');
        setEditImageUrl(journal.image_url || '');
        setIsPublic(journal.is_public);
        setEditPlayerId(journal.player_id);
    };

    const handleCreateNew = () => {
        const firstPlayerId = players.length > 0 ? players[0].player_id : '';
        const newJournal: any = {
            id: 'new',
            title: 'New DM Note',
            content: '',
            image_url: '',
            is_public: false,
            player_id: firstPlayerId
        };
        openJournal(newJournal);
    };

    const handleSave = async () => {
        if (!editTitle.trim()) {
            toast.error("Title cannot be empty");
            return;
        }

        if (!editPlayerId && !isPublic) {
            toast.error("Private notes must be assigned to a player");
            return;
        }

        setSaving(true);
        try {
            if (activeJournal?.id === 'new') {
                const { data, error } = await supabase
                    .from('player_journals')
                    .insert([{
                        campaign_id: campaignId,
                        player_id: editPlayerId,
                        title: editTitle,
                        content: editContent,
                        image_url: editImageUrl || null,
                        is_public: isPublic
                    }])
                    .select()
                    .single();

                if (error) throw error;
                toast.success('Journal created');
                setJournals([data, ...journals]);
                setActiveJournal(data);
            } else {
                const { data, error } = await supabase
                    .from('player_journals')
                    .update({
                        title: editTitle,
                        content: editContent,
                        image_url: editImageUrl || null,
                        is_public: isPublic,
                        player_id: editPlayerId, // In case DM changes who it belongs to
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', activeJournal?.id)
                    .select()
                    .single();

                if (error) throw error;
                toast.success('Journal saved');
                setJournals(journals.map(j => j.id === data.id ? data : j));
                setActiveJournal(data);
            }
        } catch (error) {
            console.error('Error saving journal:', error);
            toast.error('Failed to save journal');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (id === 'new') {
            setActiveJournal(journals.length > 0 ? journals[0] : null);
            return;
        }

        if (!confirm('Are you sure you want to delete this specific journal?')) return;

        try {
            const { error } = await supabase
                .from('player_journals')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Journal deleted');
            const updatedJournals = journals.filter(j => j.id !== id);
            setJournals(updatedJournals);

            if (activeJournal?.id === id) {
                if (updatedJournals.length > 0) openJournal(updatedJournals[0]);
                else setActiveJournal(null);
            }
        } catch (error) {
            console.error('Error deleting journal:', error);
            toast.error('Failed to delete journal');
        }
    };

    const getPlayerName = (pid: string) => {
        const p = players.find(p => p.player_id === pid);
        return p ? p.character_name : 'Unknown Player';
    };

    const filteredJournals = journals.filter(j =>
        selectedPlayerId === 'all' ? true : j.player_id === selectedPlayerId
    );

    if (loading) {
        return <div className="text-gray-400">Loading journals...</div>;
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] max-h-[800px] border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
            {/* Left Sidebar - Journal List */}
            <div className="w-1/3 min-w-[250px] max-w-[350px] border-r border-gray-700 bg-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Book size={18} className="text-blue-400" />
                            Campaign Journals
                        </h3>
                        <button
                            onClick={handleCreateNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded transition shadow-sm"
                            title="New Journal Entry"
                        >
                            <Plus size={16} />
                        </button>
                    </div>
                    <select
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                        <option value="all">All Journals (Public & Private)</option>
                        {players.map(p => (
                            <option key={p.player_id} value={p.player_id}>
                                {p.character_name}'s Journals
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeJournal?.id === 'new' && (
                        <div className="p-3 bg-blue-600/20 border-l-2 border-blue-500 cursor-pointer">
                            <h4 className="font-medium text-white truncate text-sm">{editTitle || 'New Entry'}</h4>
                            <p className="text-xs text-blue-400 mt-1">Unsaved entry</p>
                        </div>
                    )}

                    {filteredJournals.length === 0 && activeJournal?.id !== 'new' && (
                        <div className="p-6 text-center text-gray-500 space-y-2">
                            <Book size={32} className="mx-auto opacity-20" />
                            <p className="text-sm">No journal entries found.</p>
                        </div>
                    )}

                    {filteredJournals.map(journal => {
                        const isActive = activeJournal?.id === journal.id;
                        return (
                            <div
                                key={journal.id}
                                onClick={() => openJournal(journal)}
                                className={`p-3 border-b border-gray-700/50 cursor-pointer group transition-colors ${isActive ? 'bg-gray-700 border-l-2 border-l-blue-500' : 'hover:bg-gray-700/50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0 pr-2">
                                        <h4 className={`font-medium truncate text-sm flex items-center gap-2 ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                            {journal.title}
                                            {journal.image_url && <ImageIcon size={12} className="text-purple-400 shrink-0" />}
                                        </h4>
                                        <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-2 flex-wrap">
                                            {journal.is_public ? (
                                                <span className="flex items-center gap-1 text-green-400/80 bg-green-900/30 px-1.5 py-0.5 rounded"><Globe size={10} /> Public</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-gray-400 bg-gray-900/50 px-1.5 py-0.5 rounded"><Lock size={10} /> Private</span>
                                            )}
                                            <span className="text-yellow-500/80 truncate">By {getPlayerName(journal.player_id)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(journal.id, e)}
                                        className={`text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Side - Editor */}
            <div className="flex-1 flex flex-col bg-gray-900">
                {activeJournal ? (
                    <>
                        {/* Editor Header */}
                        <div className="p-4 border-b border-gray-700 bg-gray-800/50 space-y-4">
                            <div className="flex flex-wrap gap-4 justify-between items-start">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b border-blue-500 flex-1 min-w-[200px]"
                                    placeholder="Journal Title"
                                />
                                <div className="flex items-center gap-4 shrink-0">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-500 transition">
                                        <input
                                            type="checkbox"
                                            checked={isPublic}
                                            onChange={(e) => setIsPublic(e.target.checked)}
                                            className="rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                        />
                                        {isPublic ? (
                                            <span className="flex items-center gap-1 text-green-400 font-medium"><Globe size={14} /> Global Lore</span>
                                        ) : (
                                            <span className="flex items-center gap-1"><Lock size={14} /> Private Note</span>
                                        )}
                                    </label>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-6 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-colors"
                                    >
                                        <Save size={16} />
                                        {saving ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>

                            {/* Options Row */}
                            <div className="flex gap-4 items-center">
                                <div className="flex-1 flex items-center gap-2 bg-gray-900/50 p-2 rounded border border-gray-700/50">
                                    <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Owner:</span>
                                    <select
                                        value={editPlayerId}
                                        onChange={(e) => setEditPlayerId(e.target.value)}
                                        className="w-full bg-transparent text-sm text-yellow-500 font-medium focus:outline-none cursor-pointer"
                                    >
                                        <option value="" disabled>Select Player...</option>
                                        {players.map(p => (
                                            <option key={p.player_id} value={p.player_id} className="bg-gray-800 text-white">
                                                {p.character_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1 flex items-center gap-2 bg-gray-900/50 p-2 rounded border border-gray-700/50 focus-within:border-blue-500 transition">
                                    <ImageIcon size={16} className="text-purple-400 shrink-0" />
                                    <input
                                        type="text"
                                        value={editImageUrl}
                                        onChange={(e) => setEditImageUrl(e.target.value)}
                                        className="w-full bg-transparent text-sm text-gray-300 focus:outline-none placeholder-gray-600"
                                        placeholder="Add external image URL (optional)"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Editor Body */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            <div className="flex-1 p-4 overflow-y-auto">
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full h-full min-h-[300px] bg-transparent text-gray-300 resize-none focus:outline-none placeholder-gray-600 leading-relaxed font-serif text-lg"
                                    placeholder="Write the lore, handouts, or notes here..."
                                />
                            </div>

                            {/* Image Preview Panel */}
                            {editImageUrl && (
                                <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-gray-700 bg-gray-800/30 p-4 overflow-y-auto flex flex-col items-center">
                                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3 block w-full text-center">Image Handout Attached</span>
                                    <img
                                        src={editImageUrl}
                                        alt="Journal Handout"
                                        className="max-w-full rounded border border-gray-700 shadow-xl"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; // Prevent looping
                                            target.src = 'https://placehold.co/400x300/1f2937/a1a1aa?text=Image+Not+Found';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <Edit3 size={48} className="opacity-20" />
                        <p>Select a player's journal entry or create a new handout.</p>
                        <button
                            onClick={handleCreateNew}
                            className="px-6 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-medium rounded-lg transition border border-blue-500/30"
                        >
                            Create Journal Entry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

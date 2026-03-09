'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Book, Edit3, Plus, Trash2, Save, Globe, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface JournalTabProps {
    campaignId: string;
    playerId: string;
}

interface Journal {
    id: string;
    title: string;
    content: string;
    is_public: boolean;
    updated_at: string;
}

export default function JournalTab({ campaignId, playerId }: JournalTabProps) {
    const [journals, setJournals] = useState<Journal[]>([]);
    const [activeJournal, setActiveJournal] = useState<Journal | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    useEffect(() => {
        loadJournals();
    }, [campaignId, playerId]);

    const loadJournals = async () => {
        try {
            const { data, error } = await supabase
                .from('player_journals')
                .select('*')
                .eq('campaign_id', campaignId)
                .eq('player_id', playerId)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setJournals(data || []);

            // Auto open first journal or reset
            if (data && data.length > 0 && !activeJournal) {
                openJournal(data[0]);
            }
        } catch (error) {
            console.error('Error loading journals:', error);
            toast.error('Failed to load journals');
        } finally {
            setLoading(false);
        }
    };

    const openJournal = (journal: Journal) => {
        setActiveJournal(journal);
        setEditTitle(journal.title);
        setEditContent(journal.content || '');
        setIsPublic(journal.is_public);
    };

    const handleCreateNew = () => {
        const newJournal: any = {
            id: 'new',
            title: 'New Entry',
            content: '',
            is_public: false
        };
        openJournal(newJournal);
    };

    const handleSave = async () => {
        if (!editTitle.trim()) {
            toast.error("Title cannot be empty");
            return;
        }

        setSaving(true);
        try {
            if (activeJournal?.id === 'new') {
                const { data, error } = await supabase
                    .from('player_journals')
                    .insert([{
                        campaign_id: campaignId,
                        player_id: playerId,
                        title: editTitle,
                        content: editContent,
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
                        is_public: isPublic,
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

    if (loading) {
        return <div className="text-gray-400">Loading journals...</div>;
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] max-h-[800px] border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
            {/* Left Sidebar - Journal List */}
            <div className="w-1/3 min-w-[200px] max-w-[300px] border-r border-gray-700 bg-gray-800 flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Book size={18} className="text-blue-400" />
                        Journals
                    </h3>
                    <button
                        onClick={handleCreateNew}
                        className="text-gray-400 hover:text-white p-1 hover:bg-gray-700 rounded transition"
                        title="New Journal Entry"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeJournal?.id === 'new' && (
                        <div className="p-3 bg-blue-600/20 border-l-2 border-blue-500 cursor-pointer">
                            <h4 className="font-medium text-white truncate text-sm">{editTitle || 'New Entry'}</h4>
                            <p className="text-xs text-blue-400 mt-1">Unsaved entry</p>
                        </div>
                    )}

                    {journals.length === 0 && activeJournal?.id !== 'new' && (
                        <div className="p-6 text-center text-gray-500 space-y-2">
                            <Book size={32} className="mx-auto opacity-20" />
                            <p className="text-sm">No journal entries yet.</p>
                        </div>
                    )}

                    {journals.map(journal => {
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
                                        <h4 className={`font-medium truncate text-sm ${isActive ? 'text-white' : 'text-gray-300'}`}>
                                            {journal.title}
                                        </h4>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                            {journal.is_public ? <Globe size={10} className="text-green-400" /> : <Lock size={10} className="text-gray-400" />}
                                            {new Date(journal.updated_at).toLocaleDateString()}
                                        </p>
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
                        <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex flex-wrap gap-4 justify-between items-center">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="bg-transparent text-xl font-bold text-white focus:outline-none focus:border-b border-blue-500 flex-1 min-w-[200px]"
                                placeholder="Journal Title"
                            />
                            <div className="flex items-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        className="rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
                                    />
                                    {isPublic ? (
                                        <span className="flex items-center gap-1 text-green-400"><Globe size={14} /> Public Lore</span>
                                    ) : (
                                        <span className="flex items-center gap-1"><Lock size={14} /> Private Notes</span>
                                    )}
                                </label>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                                >
                                    <Save size={16} />
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 p-4">
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full h-full bg-transparent text-gray-300 resize-none focus:outline-none placeholder-gray-600 leading-relaxed"
                                placeholder="Write your journal entry here..."
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <Edit3 size={48} className="opacity-20" />
                        <p>Select a journal entry or create a new one.</p>
                        <button
                            onClick={handleCreateNew}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition border border-gray-700"
                        >
                            Create Journal
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

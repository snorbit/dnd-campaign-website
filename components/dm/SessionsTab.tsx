'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SkeletonList } from '@/components/shared/ui/SkeletonList';
import { BookOpen, MapPin, ScrollText, Package, Swords, Calendar, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface CampaignSession {
    id: string;
    title: string;
    description: string;
    maps_generated: number;
    quests_created: number;
    items_added: number;
    encounters_created: number;
    created_at: string;
    session_text?: string;
}

interface SessionsTabProps {
    campaignId: string;
    onImportClick: () => void;
}

export default function SessionsTab({ campaignId, onImportClick }: SessionsTabProps) {
    const [sessions, setSessions] = useState<CampaignSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        loadSessions();
    }, [campaignId]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('campaign_sessions')
                .select('id, title, description, maps_generated, quests_created, items_added, encounters_created, created_at')
                .eq('campaign_id', campaignId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error('Error loading sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteSession = async (sessionId: string, title: string) => {
        if (!confirm(`Delete session "${title}"? This won't remove maps/quests already created.`)) return;
        try {
            const { error } = await supabase.from('campaign_sessions').delete().eq('id', sessionId);
            if (error) throw error;
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            toast.success('Session deleted');
        } catch (err) {
            console.error('Error deleting session:', err);
            toast.error('Failed to delete session');
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-AU', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return <SkeletonList count={3} />;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BookOpen className="text-yellow-400" size={28} />
                    <h2 className="text-2xl font-bold text-white">Session History</h2>
                </div>
                <button
                    onClick={onImportClick}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all flex items-center gap-2 text-sm"
                >
                    <span>📥</span>
                    Import New Session
                </button>
            </div>

            {sessions.length === 0 ? (
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-16 text-center">
                    <BookOpen size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-400 text-lg mb-2">No sessions imported yet</p>
                    <p className="text-gray-500 text-sm mb-6">
                        Import your first session to auto-generate maps, quests, encounters, and items.
                    </p>
                    <button
                        onClick={onImportClick}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-lg transition-all"
                    >
                        📥 Import Your First Session
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors"
                        >
                            {/* Session Header Row */}
                            <div
                                className="flex items-start justify-between p-4 cursor-pointer"
                                onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                            >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="mt-0.5 text-gray-400">
                                        {expandedId === session.id
                                            ? <ChevronDown size={18} />
                                            : <ChevronRight size={18} />
                                        }
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold truncate">{session.title}</h3>
                                        {session.description && (
                                            <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                                                {session.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                            <Calendar size={12} />
                                            <span>{formatDate(session.created_at)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats badges */}
                                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                                    <StatBadge icon={<MapPin size={12} />} value={session.maps_generated} color="text-blue-400" />
                                    <StatBadge icon={<ScrollText size={12} />} value={session.quests_created} color="text-green-400" />
                                    <StatBadge icon={<Package size={12} />} value={session.items_added} color="text-yellow-400" />
                                    <StatBadge icon={<Swords size={12} />} value={session.encounters_created} color="text-red-400" />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteSession(session.id, session.title); }}
                                        className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors ml-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Expanded detail */}
                            {expandedId === session.id && (
                                <div className="border-t border-gray-700 px-4 pb-4 pt-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <DetailCard
                                            icon={<MapPin size={16} className="text-blue-400" />}
                                            label="Maps Generated"
                                            value={session.maps_generated}
                                            color="border-blue-800"
                                        />
                                        <DetailCard
                                            icon={<ScrollText size={16} className="text-green-400" />}
                                            label="Quests Created"
                                            value={session.quests_created}
                                            color="border-green-800"
                                        />
                                        <DetailCard
                                            icon={<Package size={16} className="text-yellow-400" />}
                                            label="Items Added"
                                            value={session.items_added}
                                            color="border-yellow-800"
                                        />
                                        <DetailCard
                                            icon={<Swords size={16} className="text-red-400" />}
                                            label="Encounters"
                                            value={session.encounters_created}
                                            color="border-red-800"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function StatBadge({ icon, value, color }: { icon: React.ReactNode; value: number; color: string }) {
    return (
        <div className={`flex items-center gap-1 text-xs ${color} bg-gray-700/50 px-2 py-1 rounded`}>
            {icon}
            <span className="font-mono font-bold">{value}</span>
        </div>
    );
}

function DetailCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
    return (
        <div className={`bg-gray-900 rounded-lg border ${color} p-3 text-center`}>
            <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
        </div>
    );
}

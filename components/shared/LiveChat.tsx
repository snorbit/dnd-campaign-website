'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageSquare, X, Send, EyeOff, User } from 'lucide-react';
import styles from './LiveChat.module.css';

interface ChatMessage {
    id: string;
    sender_id: string;
    sender_name: string;
    message: string;
    is_whisper: boolean;
    target_player_id: string | null;
    message_type: 'text' | 'roll' | 'system';
    roll_data?: any;
    created_at: string;
}

interface Player {
    id: string; // auth user id
    character_name: string;
}

interface LiveChatProps {
    campaignId: string;
    currentUserId: string;
    currentUserName: string;
    isDm?: boolean;
}

export const LiveChat: React.FC<LiveChatProps> = ({ campaignId, currentUserId, currentUserName, isDm }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [targetPlayer, setTargetPlayer] = useState<string>('all');
    const [players, setPlayers] = useState<Player[]>([]);
    const [unread, setUnread] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadPlayers();
        loadHistory();

        // Subscribe to real-time chat inserts
        const channel = supabase.channel(`campaign_chat_${campaignId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'campaign_chat',
                    filter: `campaign_id=eq.${campaignId}`
                },
                (payload) => {
                    const newMsg = payload.new as ChatMessage;

                    // Filter out whispers not meant for us
                    if (newMsg.is_whisper) {
                        if (newMsg.sender_id !== currentUserId && newMsg.target_player_id !== currentUserId && !isDm) {
                            return; // skip
                        }
                    }

                    setMessages(prev => [...prev, newMsg]);
                    if (!isOpen) {
                        setUnread(prev => prev + 1);
                    }
                }
            )
            .subscribe();

        // Also listen for roll broadcasts because dice state isn't synced to DB if DB push failed
        // We can create a fake message in memory just in case the migration hasn't been run yet
        const diceChannel = supabase.channel(`dice-rolls-${campaignId}`)
            .on('broadcast', { event: 'new-roll' }, (payload) => {
                const roll = payload.payload;
                // Add a local temporary message if it's not our own (if it's our own, it's already saved)
                if (roll.rolledBy !== currentUserName) {
                    const fakeMsg: ChatMessage = {
                        id: roll.id || crypto.randomUUID(),
                        sender_id: '',
                        sender_name: roll.rolledBy,
                        message: `Rolled ${roll.formula}: ${roll.total}`,
                        is_whisper: false,
                        target_player_id: null,
                        message_type: 'roll',
                        created_at: new Date().toISOString()
                    };
                    setMessages(prev => [...prev, fakeMsg]);
                    if (!isOpen) setUnread(prev => prev + 1);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(diceChannel);
        };
    }, [campaignId, currentUserId, isDm, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setUnread(0);
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadPlayers = async () => {
        const { data, error } = await supabase
            .from('campaign_players')
            .select('player_id, character_name, user:profiles!player_id(name)')
            .eq('campaign_id', campaignId);

        if (!error && data) {
            const parsed = data.map(d => ({
                id: d.player_id,
                character_name: d.character_name || (d.user as any)?.name || 'Unknown'
            }));
            setPlayers(parsed.filter(p => p.id !== currentUserId));
        }
    };

    const loadHistory = async () => {
        let query = supabase
            .from('campaign_chat')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: true })
            .limit(100);

        const { data, error } = await query;
        if (!error && data) {
            // Further filter whispers client-side in case RLS fails or is incomplete
            const filtered = data.filter(m => {
                if (!m.is_whisper) return true;
                if (m.sender_id === currentUserId) return true;
                if (m.target_player_id === currentUserId) return true;
                if (isDm) return true;
                return false;
            });
            setMessages(filtered);
        } else {
            console.error('Failed to load chat history. Ensure 008_campaign_chat.sql is pushed!', error);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const isWhisper = targetPlayer !== 'all';
        const msg = newMessage;
        setNewMessage('');

        const newChat = {
            campaign_id: campaignId,
            sender_id: currentUserId,
            sender_name: currentUserName,
            message: msg,
            is_whisper: isWhisper,
            target_player_id: isWhisper ? targetPlayer : null,
            message_type: 'text'
        };

        const { error } = await supabase
            .from('campaign_chat')
            .insert(newChat);

        if (error) {
            console.error('Error sending message:', error);
            // Fallback for if table doesnt exist yet
            const tempMsg: ChatMessage = {
                id: crypto.randomUUID(),
                ...newChat,
                created_at: new Date().toISOString()
            } as any;
            setMessages(prev => [...prev, tempMsg]);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-50 rounded-full bg-black/80 p-3 border-2 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:scale-105 transition-all"
            >
                <MessageSquare className="text-blue-400" size={24} />
                {unread > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col w-80 sm:w-96 glass rounded-2xl border border-blue-500/30 shadow-2xl overflow-hidden max-h-[70vh] animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/60">
                <div className="flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-400" />
                    <h3 className="font-bold text-white tracking-wide">Live Chat</h3>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                    <X size={20} />
                </button>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 bg-black/40 ${styles.scrollArea}`}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2 opacity-50">
                        <MessageSquare size={32} />
                        <p className="text-xs uppercase tracking-widest">No messages yet...</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_id === currentUserId || msg.sender_name === currentUserName;
                        return (
                            <div key={msg.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-gray-400 font-bold mb-0.5 px-1 truncate max-w-[80%] flex items-center gap-1">
                                    {msg.is_whisper && <EyeOff size={10} className="text-orange-400" />}
                                    {msg.sender_name}
                                </span>
                                <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm
                                    ${msg.message_type === 'roll' ? 'bg-fantasy-gold/20 text-fantasy-gold border border-fantasy-gold/30' :
                                        msg.is_whisper ? 'bg-orange-500/20 text-orange-100 border border-orange-500/30' :
                                            isMe ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-100'}
                                `}>
                                    {msg.message}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/60 flex flex-col gap-2">
                <div className="flex items-center text-xs gap-2">
                    <label className="text-gray-400 font-semibold uppercase tracking-wider text-[10px]">To:</label>
                    <select
                        value={targetPlayer}
                        onChange={e => setTargetPlayer(e.target.value)}
                        className="bg-transparent border-none text-blue-400 outline-none cursor-pointer"
                    >
                        <option value="all" className="bg-gray-800">Everyone</option>
                        {players.map(p => (
                            <option key={p.id} value={p.id} className="bg-gray-800">{p.character_name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Send a message..."
                        className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>
        </div>
    );
};

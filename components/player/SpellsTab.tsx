'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, BookOpen, Plus, Loader2, Sparkles, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface SpellsTabProps {
    campaignPlayerId: string;
}

interface PlayerSpell {
    id: string;
    spell_name: string;
    spell_level: string;
    slug: string;
    school: string;
    components: string;
    prepared: boolean;
}

interface Open5eSpell {
    slug: string;
    name: string;
    desc: string;
    higher_level: string;
    page: string;
    range: string;
    components: string;
    material: string;
    ritual: string;
    duration: string;
    concentration: string;
    casting_time: string;
    level: string;
    level_int: number;
    school: string;
    dnd_class: string;
    archetype: string;
    circles: string;
}

export default function SpellsTab({ campaignPlayerId }: SpellsTabProps) {
    // State for player's spellbook
    const [mySpells, setMySpells] = useState<PlayerSpell[]>([]);
    const [loadingSpells, setLoadingSpells] = useState(true);

    // State for Open5e API Search
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Open5eSpell[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [selectedSpell, setSelectedSpell] = useState<Open5eSpell | null>(null);

    // Filter state
    const [activeLevelFilter, setActiveLevelFilter] = useState<string>('All');

    useEffect(() => {
        loadMySpells();
    }, [campaignPlayerId]);

    const loadMySpells = async () => {
        try {
            const { data, error } = await supabase
                .from('player_spells')
                .select('*')
                .eq('campaign_player_id', campaignPlayerId)
                .order('spell_level', { ascending: true })
                .order('spell_name', { ascending: true });

            if (error) throw error;
            setMySpells(data || []);
        } catch (error) {
            console.error('Error loading spells:', error);
            toast.error('Failed to load spellbook');
        } finally {
            setLoadingSpells(false);
        }
    };

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        setHasSearched(true);
        setSelectedSpell(null);

        try {
            // Using SRD Open5e API
            const response = await fetch(`https://api.open5e.com/spells/?search=${encodeURIComponent(searchQuery)}&limit=20`);
            const data = await response.json();
            setSearchResults(data.results || []);
        } catch (error) {
            console.error('Error searching Open5e:', error);
            toast.error('Failed to search spell database');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddSpell = async (spell: Open5eSpell) => {
        // Prevent duplicates
        if (mySpells.some(s => s.slug === spell.slug)) {
            toast.info('This spell is already in your spellbook.');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('player_spells')
                .insert([{
                    campaign_player_id: campaignPlayerId,
                    spell_name: spell.name,
                    spell_level: spell.level,
                    slug: spell.slug,
                    school: spell.school,
                    components: spell.components,
                    prepared: false
                }])
                .select()
                .single();

            if (error) throw error;

            toast.success(`${spell.name} added to spellbook!`);
            setMySpells(prev => [...prev, data].sort((a, b) => {
                if (a.spell_level !== b.spell_level) return a.spell_level.localeCompare(b.spell_level);
                return a.spell_name.localeCompare(b.spell_name);
            }));
            setSelectedSpell(null); // Return to book
        } catch (error) {
            console.error('Error adding spell:', error);
            toast.error('Failed to add spell');
        }
    };

    const handleTogglePrepared = async (spellId: string, currentState: boolean) => {
        try {
            const { error } = await supabase
                .from('player_spells')
                .update({ prepared: !currentState })
                .eq('id', spellId);

            if (error) throw error;

            setMySpells(prev => prev.map(s =>
                s.id === spellId ? { ...s, prepared: !currentState } : s
            ));
        } catch (error) {
            console.error('Error toggling prepared state:', error);
            toast.error('Failed to update spell');
        }
    };

    const handleRemoveSpell = async (spellId: string) => {
        if (!confirm('Forget this spell from your spellbook?')) return;

        try {
            const { error } = await supabase
                .from('player_spells')
                .delete()
                .eq('id', spellId);

            if (error) throw error;

            setMySpells(prev => prev.filter(s => s.id !== spellId));
            toast.success('Spell forgotten');
        } catch (error) {
            console.error('Error removing spell:', error);
            toast.error('Failed to remove spell');
        }
    };

    // Calculate unique spell levels for filtering
    const spellLevels = ['All', ...Array.from(new Set(mySpells.map(s => s.spell_level)))].sort();

    const filteredSpells = activeLevelFilter === 'All'
        ? mySpells
        : mySpells.filter(s => s.spell_level === activeLevelFilter);

    // Grouping helper for display
    const groupedSpells = filteredSpells.reduce((acc, spell) => {
        const lvl = spell.spell_level;
        if (!acc[lvl]) acc[lvl] = [];
        acc[lvl].push(spell);
        return acc;
    }, {} as Record<string, PlayerSpell[]>);


    if (loadingSpells) {
        return <div className="text-gray-400">Loading your spellbook...</div>;
    }

    return (
        <div className="flex h-[calc(100vh-12rem)] max-h-[800px] border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
            {/* Left Side - Spellbook */}
            <div className="flex-1 border-r border-gray-700 flex flex-col min-w-[300px]">
                <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2 text-lg">
                        <BookOpen size={20} className="text-purple-400" />
                        My Spellbook
                    </h3>
                    <div className="bg-gray-900 px-3 py-1 rounded-full border border-gray-700">
                        <span className="text-xs font-bold text-gray-300">
                            {mySpells.filter(s => s.prepared).length} Prepared
                        </span>
                    </div>
                </div>

                {/* Filters */}
                {mySpells.length > 0 && (
                    <div className="p-2 border-b border-gray-700 bg-gray-800/50 overflow-x-auto whitespace-nowrap hide-scrollbar">
                        <div className="flex gap-2">
                            {spellLevels.map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setActiveLevelFilter(lvl)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${activeLevelFilter === lvl
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-gray-900 text-gray-400 hover:text-gray-200 border border-gray-700'
                                        }`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {mySpells.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
                            <Sparkles size={48} className="opacity-20 text-purple-400" />
                            <p>Your spellbook is empty.</p>
                            <p className="text-sm">Search for spells on the right to add them!</p>
                        </div>
                    ) : (
                        Object.keys(groupedSpells).sort().map(level => (
                            <div key={level} className="space-y-3">
                                <h4 className="text-yellow-500 font-serif font-bold border-b border-gray-800 pb-1">
                                    {level}
                                </h4>
                                <div className="grid gap-2">
                                    {groupedSpells[level].map(spell => (
                                        <div key={spell.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 flex justify-between items-center group">
                                            <div>
                                                <h5 className="font-bold text-white text-sm">{spell.spell_name}</h5>
                                                <p className="text-xs text-gray-500">{spell.school} • {spell.components}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => handleTogglePrepared(spell.id, spell.prepared)}
                                                    className={`px-2 py-1 flex items-center gap-1 rounded text-xs font-medium border transition-colors ${spell.prepared
                                                            ? 'bg-purple-900/40 border-purple-500/50 text-purple-300 hover:bg-purple-900/60'
                                                            : 'bg-gray-900 border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                                                        }`}
                                                >
                                                    {spell.prepared ? <Check size={12} /> : null}
                                                    {spell.prepared ? 'Prepared' : 'Prepare'}
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveSpell(spell.id)}
                                                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Forget Spell"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Side - SRD Search & Details */}
            <div className="w-2/5 min-w-[350px] bg-gray-900 flex flex-col relative">
                {selectedSpell ? (
                    // Spell Details View
                    <div className="flex-1 flex flex-col max-h-full">
                        <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-start sticky top-0 z-10 shadow-sm">
                            <div>
                                <button
                                    onClick={() => setSelectedSpell(null)}
                                    className="text-gray-400 hover:text-white text-xs mb-2 flex items-center gap-1 transition-colors"
                                >
                                    ← Back to search
                                </button>
                                <h3 className="text-xl font-bold text-white font-serif">{selectedSpell.name}</h3>
                                <p className="text-sm text-purple-400 italic">
                                    {selectedSpell.level} • {selectedSpell.school}
                                </p>
                            </div>
                            <button
                                onClick={() => handleAddSpell(selectedSpell)}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-md transition-all whitespace-nowrap"
                            >
                                <Plus size={16} />
                                Add Spell
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm text-gray-300">
                            <div className="grid grid-cols-2 gap-4 border-b border-gray-800 pb-4">
                                <div>
                                    <span className="font-bold text-gray-400 block mb-1">Casting Time</span>
                                    {selectedSpell.casting_time}
                                </div>
                                <div>
                                    <span className="font-bold text-gray-400 block mb-1">Range</span>
                                    {selectedSpell.range}
                                </div>
                                <div>
                                    <span className="font-bold text-gray-400 block mb-1">Components</span>
                                    {selectedSpell.components} {selectedSpell.material && `(${selectedSpell.material})`}
                                </div>
                                <div>
                                    <span className="font-bold text-gray-400 block mb-1">Duration</span>
                                    {selectedSpell.concentration === "yes" ? "Concentration, " : ""}{selectedSpell.duration}
                                </div>
                            </div>

                            <div className="prose prose-invert max-w-none prose-sm leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: selectedSpell.desc.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }}
                            />

                            {selectedSpell.higher_level && (
                                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                                    <h5 className="font-bold text-white mb-2 font-serif text-base">At Higher Levels</h5>
                                    <div dangerouslySetInnerHTML={{ __html: selectedSpell.higher_level }} />
                                </div>
                            )}

                            <div className="pt-4 mt-8 border-t border-gray-800 text-xs text-gray-600 flex justify-between">
                                <span>Classes: {selectedSpell.dnd_class}</span>
                                <span>{selectedSpell.page}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Search View
                    <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-gray-700 bg-gray-800">
                            <h3 className="text-white font-bold mb-3">Add Spells (SRD Database)</h3>
                            <form onSubmit={handleSearch} className="relative flex items-center">
                                <Search size={16} className="absolute left-3 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for spells (e.g. Fireball)..."
                                    className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-9 pr-24 py-2 focus:outline-none focus:border-purple-500 text-sm transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={isSearching || !searchQuery.trim()}
                                    className="absolute right-2 top-1.5 bottom-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 px-3 rounded text-xs font-bold text-white transition-colors"
                                >
                                    {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
                                </button>
                            </form>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {!hasSearched && !isSearching && (
                                <div className="h-full flex flex-col justify-center items-center text-gray-500 space-y-3">
                                    <Search size={32} className="opacity-30" />
                                    <p className="text-sm text-center max-w-[250px]">
                                        Search the Open5e database to add spells from the Systems Reference Document to your spellbook.
                                    </p>
                                </div>
                            )}

                            {hasSearched && !isSearching && searchResults.length === 0 && (
                                <div className="text-center text-gray-400 mt-8 text-sm">
                                    No spells found matching "{searchQuery}"
                                </div>
                            )}

                            <div className="space-y-2">
                                {searchResults.map(spell => (
                                    <div
                                        key={spell.slug}
                                        onClick={() => setSelectedSpell(spell)}
                                        className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg border border-gray-700 cursor-pointer transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-bold text-white text-sm">{spell.name}</h4>
                                            <span className="text-xs font-serif text-purple-400">{spell.level}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 line-clamp-1">
                                            {spell.school} • {spell.casting_time} • {spell.range}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

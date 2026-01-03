"use client";

import { useCampaign } from "@/context/CampaignContext";
import WorldCounter from "@/components/WorldCounter";
import MapComponent from "@/components/MapComponent";
import Tabs from "@/components/Tabs";
import { Shield, Backpack, Users, Skull, Scroll, ScrollText, Heart, Zap, Plus, Trash2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PlayerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { players, encounters, quests, updatePlayer } = useCampaign();
    const player = players.find(p => p.id === params.id);
    const otherPlayers = players.filter(p => p.id !== params.id);

    // Form inputs state
    const [itemInput, setItemInput] = useState("");
    const [spellInput, setSpellInput] = useState("");

    // Auth Check
    useEffect(() => {
        if (players.length > 0 && player) {
            if (player.password) {
                const isAuth = localStorage.getItem(`auth-${player.id}`);
                if (!isAuth) {
                    router.push('/login');
                }
            }
        }
    }, [player, players, router]);

    if (!player) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center text-fantasy-muted font-serif p-4 text-center">
                <div className="mb-4 text-2xl animate-pulse">Summoning hero data...</div>
            </div>
        );
    }

    // --- Handlers ---

    const updateHP = (val: number, type: 'current' | 'temp') => {
        if (!player) return;
        const newHp = { ...player.hp, [type]: val };
        updatePlayer(player.id, { hp: newHp });
    };

    const addItem = () => {
        if (!itemInput.trim() || !player) return;
        const newEquip = [...player.equipment, itemInput.trim()];
        updatePlayer(player.id, { equipment: newEquip });
        setItemInput("");
    };

    const removeItem = (index: number) => {
        if (!player) return;
        const newEquip = player.equipment.filter((_, i) => i !== index);
        updatePlayer(player.id, { equipment: newEquip });
    };

    const addSpell = () => {
        if (!spellInput.trim() || !player) return;
        const newSpells = [...player.spells, spellInput.trim()];
        updatePlayer(player.id, { spells: newSpells });
        setSpellInput("");
    };

    const removeSpell = (index: number) => {
        if (!player) return;
        const newSpells = player.spells.filter((_, i) => i !== index);
        updatePlayer(player.id, { spells: newSpells });
    };


    // --- Tabs ---

    const StatsTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* HP Section */}
            <div className="grid grid-cols-2 gap-4">
                {/* Current HP */}
                <div className="glass p-4 rounded-xl text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-red-500/10 group-hover:bg-red-500/20 transition-colors pointer-events-none" />
                    <div className="relative z-10">
                        <div className="mb-2 text-xs uppercase tracking-widest text-fantasy-muted flex items-center justify-center gap-2">
                            <Heart size={12} className="text-red-500" /> HP
                        </div>
                        <div className="flex items-center justify-center gap-1">
                            <input
                                type="number"
                                className="bg-transparent border-b border-white/20 text-4xl font-serif font-bold text-white text-center w-20 focus:outline-none focus:border-fantasy-gold"
                                value={player.hp.current}
                                onChange={(e) => updateHP(parseInt(e.target.value) || 0, 'current')}
                            />
                            <span className="text-lg text-fantasy-muted/60 pt-2">/ {player.hp.max}</span>
                        </div>
                    </div>
                </div>

                {/* Temp HP */}
                <div className="glass p-4 rounded-xl text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors pointer-events-none" />
                    <div className="relative z-10">
                        <div className="mb-2 text-xs uppercase tracking-widest text-fantasy-muted flex items-center justify-center gap-2">
                            <Shield size={12} className="text-blue-400" /> Temp HP
                        </div>
                        <input
                            type="number"
                            className="bg-transparent border-b border-white/20 text-4xl font-serif font-bold text-blue-400 text-center w-full focus:outline-none focus:border-blue-400"
                            value={player.hp.temp}
                            onChange={(e) => updateHP(parseInt(e.target.value) || 0, 'temp')}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="glass p-6 rounded-xl">
                <h3 className="mb-4 text-sm font-bold uppercase text-fantasy-gold tracking-[0.2em] border-b border-white/5 pb-2">
                    Ability Scores
                </h3>
                <div className="grid grid-cols-3 gap-3">
                    {Object.entries(player.stats).map(([stat, value]) => (
                        <div key={stat} className="flex flex-col items-center rounded-lg bg-black/40 border border-white/5 p-3 hover:border-fantasy-gold/30 transition-colors">
                            <span className="text-[10px] uppercase text-fantasy-muted font-bold tracking-wider mb-1">{stat}</span>
                            <span className="text-xl font-serif font-bold text-white">{value}</span>
                            <span className="text-xs text-fantasy-gold/80">
                                {Math.floor((value - 10) / 2) >= 0 ? '+' : ''}{Math.floor((value - 10) / 2)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const InventoryTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass p-5 rounded-xl">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-fantasy-gold tracking-widest">
                    <Backpack size={16} /> Equipment
                </h3>

                {/* Input Area */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="New item..."
                        className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-fantasy-gold"
                        value={itemInput}
                        onChange={(e) => setItemInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem()}
                    />
                    <button
                        onClick={addItem}
                        className="bg-fantasy-gold/20 hover:bg-fantasy-gold/40 text-fantasy-gold p-2 rounded transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                <ul className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {player.equipment.map((item, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 rounded bg-black/20 p-2 text-sm border border-white/5 hover:bg-white/5 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-fantasy-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>
                                <span className="text-fantasy-text/90">{item}</span>
                            </div>
                            <button
                                onClick={() => removeItem(i)}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-900/40 p-1.5 rounded transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="glass p-5 rounded-xl">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase text-blue-400 tracking-widest">
                    <Zap size={16} /> Spells
                </h3>

                {/* Input Area */}
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="New spell..."
                        className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-400"
                        value={spellInput}
                        onChange={(e) => setSpellInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSpell()}
                    />
                    <button
                        onClick={addSpell}
                        className="bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 p-2 rounded transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>

                {player.spells.length === 0 ? (
                    <p className="text-sm italic text-fantasy-muted text-center py-4">No arcane knowledge...</p>
                ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {player.spells.map((spell, i) => (
                            <div key={i} className="rounded bg-blue-900/10 p-2 px-3 text-sm border border-blue-500/20 text-blue-200 hover:bg-blue-900/20 transition-colors flex items-center justify-between group">
                                <span>{spell}</span>
                                <button
                                    onClick={() => removeSpell(i)}
                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-900/40 p-1 rounded transition-all"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const PartyTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="glass p-5 rounded-xl space-y-4">
                <h3 className="text-sm font-bold uppercase text-fantasy-gold tracking-widest text-center border-b border-white/5 pb-2">
                    Allies
                </h3>
                {otherPlayers.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg bg-black/20 p-3 border border-white/5 hover:border-fantasy-gold/30 transition-all">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-fantasy-muted/20 flex items-center justify-center font-serif font-bold text-xs text-fantasy-gold border border-fantasy-gold/20">
                                {p.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-bold text-sm text-fantasy-text">{p.name}</div>
                                <div className="text-[10px] uppercase text-fantasy-muted">{p.race} {p.class}</div>
                            </div>
                        </div>
                        <div className={`text-xs font-bold px-2 py-1 rounded bg-black/40 border ${p.hp.current < p.hp.max / 2 ? 'text-red-400 border-red-500/30' : 'text-green-400 border-green-500/30'}`}>
                            {p.hp.current}/{p.hp.max} HP
                        </div>
                    </div>
                ))}
            </div>

            {encounters.length > 0 && (
                <div className="glass p-5 rounded-xl space-y-3 border-red-900/30">
                    <h3 className="text-sm font-bold uppercase text-red-500 tracking-widest text-center flex items-center justify-center gap-2 pb-2">
                        <Skull size={16} /> Threats
                    </h3>
                    {encounters.map(monster => (
                        <div key={monster.id} className="flex items-center justify-between rounded bg-red-950/10 p-3 border-l-2 border-red-600 hover:bg-red-950/20 transition-colors">
                            <div>
                                <div className="font-bold text-red-200 text-sm">{monster.name}</div>
                                <div className="text-[10px] text-red-400/60 uppercase">{monster.type}</div>
                            </div>
                            <div className="text-sm font-bold text-red-500">
                                {monster.hp.current} HP
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );


    const QuestTab = () => (
        <div className="glass p-5 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase text-fantasy-gold tracking-widest border-b border-white/5 pb-2">
                <ScrollText size={16} /> Active Quests
            </h3>
            {quests.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-sm italic text-fantasy-muted">The path is clear...</p>
                    <p className="text-xs text-fantasy-muted/50 mt-1">Wait for your DM to assign tasks.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {quests.map(quest => (
                        <div key={quest.id} className={`relative overflow-hidden rounded-lg p-4 border transition-all ${quest.status === 'completed' ? 'bg-green-950/10 border-green-500/20 opacity-70' : 'bg-black/20 border-fantasy-gold/20 hover:border-fantasy-gold/50'}`}>
                            <div className="flex items-start justify-between mb-2">
                                <span className={`font-serif font-bold ${quest.status === 'completed' ? 'text-green-400 line-through' : 'text-fantasy-gold'}`}>{quest.title}</span>
                                {quest.status === 'completed' && <span className="text-[10px] uppercase font-bold bg-green-900/30 text-green-400 px-2 py-0.5 rounded border border-green-500/30">Complete</span>}
                            </div>
                            <p className="text-xs text-fantasy-muted leading-relaxed">{quest.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-fantasy-dark font-sans selection:bg-fantasy-gold/30">
            <WorldCounter />

            <main className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
                {/* Background Fx */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fantasy-gold/5 via-transparent to-transparent pointer-events-none" />

                {/* Left Area: Map */}
                <div className="flex-1 overflow-auto bg-black/50 p-4 lg:w-2/3 relative">
                    <div className="h-full flex flex-col gap-4 rounded-xl overflow-hidden border border-white/5 shadow-2xl relative">
                        <MapComponent />
                        {/* Overlay Title for Map */}
                        <div className="absolute top-4 left-4 pointer-events-none">
                            <h2 className="text-white/20 font-serif font-bold text-4xl uppercase tracking-widest drop-shadow-xl">The Realm</h2>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar: Character Sheet */}
                <div className="flex w-full flex-col border-l border-white/5 bg-black/40 backdrop-blur-xl lg:w-[420px] shadow-2xl z-20">
                    {/* Character Header */}
                    <div className="flex items-center gap-4 p-6 border-b border-white/5 bg-gradient-to-r from-fantasy-gold/10 to-transparent">
                        <div className="relative">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-fantasy-gold to-orange-600 p-[2px] shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                <div className="h-full w-full rounded-full bg-fantasy-dark flex items-center justify-center">
                                    <span className="font-serif text-2xl font-bold text-fantasy-gold">
                                        {player.name.substring(0, 1)}
                                    </span>
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-fantasy-bg border border-fantasy-muted flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                                {player.level}
                            </div>
                        </div>

                        <div>
                            <h1 className="text-2xl font-serif font-bold text-white leading-none mb-1 drop-shadow-md">{player.name}</h1>
                            <p className="text-xs text-fantasy-gold uppercase tracking-widest font-bold opacity-80">{player.race} {player.class}</p>
                        </div>
                    </div>

                    {/* Tabs Area */}
                    <div className="flex-1 overflow-hidden p-4">
                        <Tabs
                            tabs={[
                                { label: "Stats", content: <StatsTab /> },
                                { label: "Inv", content: <InventoryTab /> },
                                { label: "Party", content: <PartyTab /> },
                                { label: "Quests", content: <QuestTab /> },
                            ]}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

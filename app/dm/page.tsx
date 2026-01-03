"use client";

import React, { useState } from "react";
import { useCampaign } from "@/context/CampaignContext";
import WorldCounter from "@/components/WorldCounter";
import MapComponent from "@/components/MapComponent";
import { Copy, Plus, Minus, Send, Sparkles, Skull, X, Leaf, ScrollText } from "lucide-react";
import { lookupMonster } from "@/utils/bestiary";

export default function DMPage() {
    const { world, map, players, encounters, quests, updateWorld, updateMap, setMapQueue, nextMap, updatePlayer, addEncounter, removeEncounter, updateEncounter, addQuest, updateQuest, seedDatabase } = useCampaign();
    const [mapInput, setMapInput] = useState("");
    const [sessionNote, setSessionNote] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [newQuestTitle, setNewQuestTitle] = useState("");

    const [availableSessions, setAvailableSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>("");

    // Load available sessions on mount
    React.useEffect(() => {
        const fetchSessions = async () => {
            try {
                const { listSessions } = await import("@/app/actions");
                const sessions = await listSessions();
                setAvailableSessions(sessions);
                if (sessions.length > 0 && !selectedSession) {
                    setSelectedSession(sessions[0]);
                }
            } catch (e) {
                console.error("Failed to list sessions", e);
            }
        };
        fetchSessions();
    }, []);

    const handleMapSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mapInput) updateMap(mapInput);
    };

    const handleLoadScript = async (filenameOverride?: string) => {
        const targetSession = filenameOverride || selectedSession;
        if (!targetSession) return;

        setIsGenerating(true);
        try {
            const { loadSessionScript } = await import("@/app/actions");
            const locations = await loadSessionScript(targetSession);

            if (locations.length > 0) {
                const queue = locations.map(loc => {
                    const cleanDesc = loc.description.slice(0, 300).replace(/[^\w\s]/gi, '');
                    const mapPrompt = encodeURIComponent(`d&d battlemap, top down, fantasy, 8k resolution, ${cleanDesc}`);
                    return {
                        title: loc.title,
                        description: loc.description,
                        url: `https://image.pollinations.ai/prompt/${mapPrompt}?nolog=true`
                    };
                });

                setMapQueue(queue);
                alert(`Loaded ${queue.length} scenes from ${targetSession}!`);
            } else {
                alert("No scenes found in script.");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to load script.");
        }
        setIsGenerating(false);
    };

    const handleSmartGenerate = async () => {
        if (!sessionNote) return;
        setIsGenerating(true);

        try {
            // MODE A: Full Script Parsing (detected by headers or read aloud markers)
            if (sessionNote.includes("## ") || sessionNote.includes("**Read Aloud")) {
                const { parseScript } = await import("@/utils/scriptParser");
                const locations = parseScript(sessionNote);

                if (locations.length > 0) {
                    const queue = locations.map(loc => {
                        const cleanDesc = loc.description.slice(0, 300).replace(/[^\w\s]/gi, '');
                        const mapPrompt = encodeURIComponent(`d&d battlemap, top down, fantasy, 8k resolution, ${cleanDesc}`);
                        return {
                            title: loc.title,
                            description: loc.description,
                            url: `https://image.pollinations.ai/prompt/${mapPrompt}?nolog=true`
                        };
                    });

                    setMapQueue(queue);
                    alert(`Parsed ${queue.length} scenes from text! Queue updated.`);
                    setIsGenerating(false);
                    return; // Stop here, don't do single map gen
                }
            }
        } catch (e) {
            console.error("Script parse error", e);
        }

        // MODE B: Single Map Generation (Fallback)
        // 1. Generate Map using Pollinations AI
        // specific keywords to ensure good style
        const mapPrompt = encodeURIComponent(`d&d battlemap, top down, fantasy, 8k resolution, ${sessionNote.slice(0, 200)}`);
        const aiMapUrl = `https://image.pollinations.ai/prompt/${mapPrompt}?nolog=true`;
        updateMap(aiMapUrl);

        // 2. Parse for Monsters
        // Simple logic: split words, check against bestiary
        const words = sessionNote.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
        const foundMonsters = new Set<string>();

        words.forEach(word => {
            const monster = lookupMonster(word, "enc");
            // If it returned a real match (not the generic unknown fallback for everything)
            // We check if the 'type' is NOT "Unknown" to treat it as an auto-match
            if (monster.type !== "Unknown") {
                if (!foundMonsters.has(monster.name)) {
                    addEncounter(monster);
                    foundMonsters.add(monster.name);
                }
            }
        });

        setIsGenerating(false);
    };

    const handleAddManualEncounter = () => {
        addEncounter({
            id: `custom-${Math.random()}`,
            name: "New Enemy",
            type: "Unknown",
            hp: { current: 10, max: 10 }
        });
    };

    return (
        <div className="min-h-screen bg-fantasy-dark pb-20">
            <WorldCounter />

            <main className="container mx-auto mt-8 grid gap-8 px-4 lg:grid-cols-3">
                {/* Left Column: Controls */}
                <div className="space-y-6 lg:col-span-1">

                    {/* Smart Session Creator */}
                    <section className="rounded-lg border border-fantasy-accent/30 bg-fantasy-bg p-6 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                            <Sparkles size={100} />
                        </div>
                        <h2 className="mb-2 text-xl font-bold text-fantasy-gold flex items-center gap-2">
                            <Sparkles size={20} /> Smart Session
                        </h2>

                        {/* Manual Input */}
                        <div className="mb-4">
                            <p className="text-xs text-fantasy-muted mb-2">Load from File</p>
                            <div className="flex gap-2">
                                <select
                                    value={selectedSession}
                                    onChange={(e) => setSelectedSession(e.target.value)}
                                    className="w-full bg-black/40 text-xs py-2 px-2 rounded border border-fantasy-muted/30 focus:border-fantasy-gold outline-none"
                                >
                                    {availableSessions.length > 0 ? (
                                        availableSessions.map(file => (
                                            <option key={file} value={file}>{file.replace('.md', '').replace(/_/g, ' ')}</option>
                                        ))
                                    ) : (
                                        <option value="">No scripts found - Defaulting to Session 1</option>
                                    )}
                                </select>
                            </div>
                            <button
                                onClick={() => handleLoadScript("Session_1_Full_Read_Off_Script.md")}
                                disabled={isGenerating}
                                className="mt-2 w-full text-[10px] text-fantasy-muted hover:text-white underline text-left"
                            >
                                (Debug) Force Load Session 1 File
                            </button>
                        </div>

                        <div className="my-4 border-t border-white/10 pt-4">
                            <p className="text-xs text-fantasy-muted mb-2">...OR Paste Script / Notes</p>
                            <textarea
                                value={sessionNote}
                                onChange={(e) => setSessionNote(e.target.value)}
                                placeholder="Paste your full '## Session' markdown script here to generate a queue, OR just type a scene description for a single map..."
                                className="w-full h-32 rounded border border-fantasy-muted/20 bg-black/40 p-3 text-xs focus:border-fantasy-gold focus:outline-none resize-none mb-3 font-mono"
                            />
                            <button
                                onClick={handleSmartGenerate}
                                disabled={isGenerating || !sessionNote}
                                className="w-full flex items-center justify-center gap-2 rounded bg-gradient-to-r from-fantasy-gold to-fantasy-accent px-4 py-2 font-bold text-fantasy-dark hover:brightness-110 disabled:opacity-50"
                            >
                                {isGenerating ? "Processing..." : "Generate from Text"} <Sparkles size={16} />
                            </button>
                        </div>
                    </section>

                    {/* Active Encounters */}
                    <section className="rounded-lg border border-fantasy-muted/20 bg-fantasy-bg p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-red-400 flex items-center gap-2">
                                <Skull size={20} /> Encounters
                            </h2>
                            <button onClick={handleAddManualEncounter} className="text-xs bg-white/10 p-1 rounded hover:bg-white/20">
                                <Plus size={14} /> Add
                            </button>
                        </div>

                        {encounters.length === 0 ? (
                            <div className="text-center py-6 text-fantasy-muted text-sm italic border-2 border-dashed border-fantasy-muted/10 rounded">
                                No active threats...
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {encounters.map(monster => (
                                    <div key={monster.id} className="group flex items-center justify-between rounded bg-black/20 p-2 border-l-2 border-red-500">
                                        <div className="flex-1 min-w-0">
                                            <input
                                                value={monster.name}
                                                onChange={(e) => updateEncounter(monster.id, { name: e.target.value })}
                                                className="bg-transparent font-bold text-sm w-full focus:outline-none"
                                            />
                                            <div className="text-xs text-fantasy-muted">{monster.type}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center bg-black/40 rounded px-1">
                                                <span className="text-xs text-red-400 mr-1">HP</span>
                                                <input
                                                    type="number"
                                                    value={monster.hp.current}
                                                    onChange={(e) => updateEncounter(monster.id, { hp: { ...monster.hp, current: parseInt(e.target.value) || 0 } })}
                                                    className="w-8 bg-transparent text-right text-sm focus:outline-none"
                                                />
                                                <span className="text-xs text-fantasy-muted mx-1">/</span>
                                                <span className="text-xs">{monster.hp.max}</span>
                                            </div>
                                            <button onClick={() => removeEncounter(monster.id)} className="text-fantasy-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* World Controls */}
                    <section className="rounded-lg border border-fantasy-muted/20 bg-fantasy-bg p-6 shadow-xl">
                        <h2 className="mb-4 text-xl font-bold text-fantasy-gold">World State</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-fantasy-muted">Day</span>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => updateWorld({ day: Math.max(1, world.day - 1) })} className="rounded bg-fantasy-bg/50 p-1 hover:bg-fantasy-accent/20"><Minus size={16} /></button>
                                    <span className="w-8 text-center font-mono">{world.day}</span>
                                    <button onClick={() => updateWorld({ day: world.day + 1 })} className="rounded bg-fantasy-bg/50 p-1 hover:bg-fantasy-accent/20"><Plus size={16} /></button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-fantasy-muted">Time</span>
                                <input
                                    type="text"
                                    value={world.time}
                                    onChange={(e) => updateWorld({ time: e.target.value })}
                                    className="w-24 rounded border border-fantasy-muted/20 bg-black/40 px-2 py-1 text-center text-sm focus:border-fantasy-gold focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-fantasy-muted">Session</span>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => updateWorld({ session: Math.max(1, world.session - 1) })} className="rounded bg-fantasy-bg/50 p-1 hover:bg-fantasy-accent/20"><Minus size={16} /></button>
                                    <span className="w-8 text-center font-mono">{world.session}</span>
                                    <button onClick={() => updateWorld({ session: world.session + 1 })} className="rounded bg-fantasy-bg/50 p-1 hover:bg-fantasy-accent/20"><Plus size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Map Manual Control */}
                    <section className="rounded-lg border border-fantasy-muted/20 bg-fantasy-bg p-6 shadow-xl">
                        <h2 className="mb-4 text-sm font-bold text-fantasy-muted uppercase">Manual Map Override</h2>
                        <form onSubmit={handleMapSubmit} className="flex gap-2 mb-2">
                            <input
                                type="text"
                                placeholder="Paste Image URL..."
                                value={mapInput}
                                onChange={(e) => setMapInput(e.target.value)}
                                className="flex-1 rounded border border-fantasy-muted/20 bg-black/40 px-3 py-2 text-sm focus:border-fantasy-gold focus:outline-none"
                            />
                            <button type="submit" className="rounded bg-fantasy-muted/20 px-3 py-2 hover:bg-fantasy-accent hover:text-fantasy-dark">
                                <Send size={16} />
                            </button>
                        </form>
                        <button
                            onClick={() => updateMap(map.url)}
                            className="w-full rounded border border-fantasy-gold/30 bg-fantasy-gold/10 py-1 text-xs text-fantasy-gold hover:bg-fantasy-gold hover:text-black transition-colors"
                        >
                            📡 Broadcast Current Map to Players
                        </button>
                    </section>

                    {/* Player Quick Edit */}
                    <section className="rounded-lg border border-fantasy-muted/20 bg-fantasy-bg p-6 shadow-xl">
                        <h2 className="mb-4 text-xl font-bold text-fantasy-gold">Players</h2>
                        <div className="space-y-3">
                            {players.map(player => (
                                <div key={player.id} className="flex items-center justify-between rounded bg-black/20 p-2">
                                    <span className="text-sm font-medium">{player.name}</span>
                                    <div className="flex items-center gap-2">
                                        <label className="cursor-pointer text-xs text-fantasy-muted hover:text-fantasy-gold flex items-center gap-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            updatePlayer(player.id, { token: reader.result as string });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                            {player.token ? "Change Token" : "Upload Token"}
                                        </label>
                                        <span className="text-xs text-fantasy-muted">HP:</span>
                                        <input
                                            type="number"
                                            value={player.hp.current}
                                            onChange={(e) => updatePlayer(player.id, { hp: { ...player.hp, current: parseInt(e.target.value) || 0 } })}
                                            className="w-12 rounded border border-fantasy-muted/20 bg-black/40 px-1 py-0.5 text-center text-xs focus:border-fantasy-gold focus:outline-none"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Quest Giver */}
                    <section className="rounded-lg border border-fantasy-muted/20 bg-fantasy-bg p-6 shadow-xl">
                        <h2 className="mb-4 text-xl font-bold text-fantasy-gold flex items-center gap-2">
                            <ScrollText size={20} /> Quest Giver
                        </h2>
                        <div className="mb-4 flex gap-2">
                            <input
                                type="text"
                                placeholder="Quest Title (e.g. Find the King)"
                                value={newQuestTitle}
                                onChange={(e) => setNewQuestTitle(e.target.value)}
                                className="flex-1 rounded border border-fantasy-muted/20 bg-black/40 px-3 py-2 text-sm focus:border-fantasy-gold focus:outline-none"
                            />
                            <button
                                onClick={() => {
                                    if (newQuestTitle) {
                                        addQuest({ id: `q-${Date.now()}`, title: newQuestTitle, description: "New Quest", status: 'active' });
                                        setNewQuestTitle("");
                                    }
                                }}
                                className="rounded bg-fantasy-accent px-3 py-2 text-fantasy-dark hover:brightness-110"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {quests.map(quest => (
                                <div key={quest.id} className={`flex items-center justify-between rounded p-2 text-sm ${quest.status === 'completed' ? 'bg-green-900/20 text-green-400 line-through' : 'bg-black/20 text-fantasy-text'}`}>
                                    <span>{quest.title}</span>
                                    <div className="flex gap-2">
                                        {quest.status === 'active' && (
                                            <button onClick={() => updateQuest(quest.id, { status: 'completed' })} className="text-fantasy-muted hover:text-green-400">
                                                <Leaf size={14} />
                                            </button>
                                        )}
                                        <button onClick={() => updateQuest(quest.id, { status: quest.status === 'active' ? 'completed' : 'active' })} className="text-xs uppercase font-bold opacity-50">
                                            {quest.status}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>                      </div>
                {/* Right Column: Preview */}
                <div className="lg:col-span-2">
                    <div className="sticky top-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-fantasy-muted">Live Map & Table</h2>
                            <button
                                onClick={async () => {
                                    if (confirm("Overwrite Cloud Database with Local Player File?")) {
                                        seedDatabase();
                                    }
                                }}
                                className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900/50 hover:bg-red-900/50"
                            >
                                Force Sync Data
                            </button>
                        </div>
                        <MapComponent />
                    </div>
                </div>
            </main>
        </div>
    );
}

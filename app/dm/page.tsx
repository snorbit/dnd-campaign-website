"use client";

import React, { useState } from "react";
import { useCampaign } from "@/context/CampaignContext";
import WorldCounter from "@/components/WorldCounter";
import MapComponent from "@/components/MapComponent";
import { Copy, Plus, Minus, Send, Sparkles, Skull, X, Leaf, ScrollText, Trash2 } from "lucide-react";
import { lookupMonster } from "@/utils/bestiary";

export default function DMPage() {
    const { world, map, players, encounters, quests, updateWorld, updateMap, setMapQueue, nextMap, updatePlayer, addEncounter, removeEncounter, updateEncounter, addQuest, updateQuest, seedDatabase, resetMap, clearQuests } = useCampaign();
    const [mapInput, setMapInput] = useState("");
    const [sessionNote, setSessionNote] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [newQuestTitle, setNewQuestTitle] = useState("");
    const [generationProgress, setGenerationProgress] = useState<{ current: number, total: number } | null>(null);

    const [availableSessions, setAvailableSessions] = useState<string[]>([]);
    const [selectedSession, setSelectedSession] = useState<string>("");

    // AI Configuration State
    const [aiProvider, setAiProvider] = useState<'openai' | 'local' | 'lightx' | 'nanobanana'>('nanobanana');
    const [apiKey, setApiKey] = useState(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");
    const [customUrl, setCustomUrl] = useState("http://127.0.0.1:7860");

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

    // Helper: Generate Image based on Provider
    const generateImage = async (prompt: string): Promise<string> => {
        const cleanPrompt = prompt.slice(0, 1000).replace(/[^\\w\\s,.]/gi, '');

        if (aiProvider === 'openai') {
            if (!apiKey) throw new Error("Missing OpenAI API Key");
            const res = await fetch("https://api.openai.com/v1/images/generations", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
                body: JSON.stringify({ model: "dall-e-3", prompt: `D&D battlemap, top down, ${cleanPrompt}`, n: 1, size: "1024x1024" })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error.message);
            return data.data[0].url;
        }

        if (aiProvider === 'lightx') {
            if (!apiKey) throw new Error("Missing LightX API Key");
            const res = await fetch("https://api.lightxeditor.com/external/api/v1/text2image", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-api-key": apiKey },
                body: JSON.stringify({ textPrompt: `D&D battlemap, top down, ${cleanPrompt}` })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "LightX API Error");
            if (data.body && data.body.imageURL) return data.body.imageURL;
            if (data.imageURL) return data.imageURL;
            if (data.url) return data.url;

            console.error("LightX Unknown Response:", data);
            throw new Error("LightX did not return an image URL.");
        }

        if (aiProvider === 'nanobanana') {
            if (!apiKey) throw new Error("Missing Gemini API Key");
            // Using Google's Gemini 2.5 Flash Image model (official REST format)
            const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Generate a high-quality D&D top-down battlemap for this scene: ${cleanPrompt}. The map should be suitable for tabletop RPG gameplay with clear terrain features.`
                        }]
                    }]
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error?.message || "Nano Banana API Error");

            // Gemini returns images in the response candidates
            if (data.candidates && data.candidates[0]?.content?.parts) {
                const imagePart = data.candidates[0].content.parts.find((part: any) => part.inlineData);
                if (imagePart?.inlineData?.data) {
                    return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
                }
            }
            throw new Error("Nano Banana did not return an image.");
        }

        if (aiProvider === 'local') {
            // Compatible with Automatic1111 API
            try {
                const res = await fetch(`${customUrl}/sdapi/v1/txt2img`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        prompt: `(top down battlemap:1.4), ${cleanPrompt}`,
                        steps: 20, width: 1024, height: 1024
                    })
                });
                if (!res.ok) throw new Error(`Status: ${res.statusText}`);
                const data = await res.json();
                if (!data.images) throw new Error("No images returned from Local SD");
                return `data:image/png;base64,${data.images[0]}`;
            } catch (err: any) {
                if (err.message.includes("Failed to fetch")) {
                    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                    if (isLocal) {
                        throw new Error(`Connection Failed! Is Local SD running at ${customUrl}? Check your terminal.`);
                    } else {
                        throw new Error("Connection Failed! Vercel (HTTPS) cannot talk to your PC (HTTP). Please run the website locally using 'npm run dev'.");
                    }
                }
                throw err;
            }
        }

        throw new Error("No valid AI Provider selected.");
    };

    const handleLoadScript = async (filenameOverride?: string) => {
        const targetSession = filenameOverride || selectedSession;
        if (!targetSession) return;

        setIsGenerating(true);
        try {
            const { loadSessionScript } = await import("@/app/actions");
            const locations = await loadSessionScript(targetSession);

            if (locations.length > 0) {
                // Auto-generate maps for all locations
                setGenerationProgress({ current: 0, total: locations.length });
                const queue = [];

                for (let i = 0; i < locations.length; i++) {
                    const loc = locations[i];
                    setGenerationProgress({ current: i + 1, total: locations.length });

                    try {
                        const url = await generateImage(loc.description);
                        queue.push({ title: loc.title, description: loc.description, url });
                    } catch (err) {
                        console.error(`Failed to generate map for ${loc.title}:`, err);
                        // Use a placeholder/fallback
                        queue.push({
                            title: loc.title,
                            description: loc.description,
                            url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1024' height='1024'%3E%3Crect fill='%23111' width='1024' height='1024'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='serif' font-size='24'%3EMap Generation Failed%3C/text%3E%3C/svg%3E"
                        });
                    }
                }

                setMapQueue(queue);
                setGenerationProgress(null);
                alert(`Generated ${queue.length} maps from ${targetSession}!`);
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

        // 1. Parse for Monsters
        const words = sessionNote.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
        const foundMonsters = new Set<string>();

        words.forEach(word => {
            const monster = lookupMonster(word, "enc");
            if (monster.type !== "Unknown") {
                if (!foundMonsters.has(monster.name)) {
                    addEncounter(monster);
                    foundMonsters.add(monster.name);
                }
            }
        });

        try {
            // MODE A: Full Script Parsing
            if (sessionNote.includes("## ") || sessionNote.includes("**Read Aloud")) {
                const { parseScript } = await import("@/utils/scriptParser");
                const locations = parseScript(sessionNote);

                if (locations.length > 0) {
                    const queue = [];
                    for (const loc of locations) {
                        try {
                            const url = await generateImage(loc.description);
                            queue.push({ title: loc.title, description: loc.description, url });
                        } catch (err) {
                            console.error(`Failed to generate map for ${loc.title}:`, err);
                            // Fallback to placeholder or skip
                        }
                    }

                    if (queue.length > 0) {
                        setMapQueue(queue);
                        alert(`Generated ${queue.length} maps using ${aiProvider.toUpperCase()}!`);
                        setSessionNote("");
                        setIsGenerating(false);
                        return;
                    }
                }
            }

            // MODE B: Single Map
            const url = await generateImage(sessionNote);
            if (url) updateMap(url);

        } catch (e: any) {
            console.error("Generation failed:", e);
            alert(`Error: ${e.message || e}`);
        } finally {
            setIsGenerating(false);
        }
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

                        {/* AI Settings */}
                        <div className="mb-4 p-3 bg-black/20 rounded border border-white/5">
                            <label className="text-[10px] text-fantasy-muted uppercase tracking-wider mb-2 block font-bold">AI Generation: Nano Banana 🍌</label>
                            <input type="password" placeholder="Paste Google AI API Key (from aistudio.google.com/apikey)" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-black/40 text-xs p-2 rounded border border-white/10 text-white focus:border-fantasy-gold outline-none" />
                            {process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
                                <p className="text-[10px] text-green-400 mt-1">✓ API key loaded from .env.local</p>
                            )}
                            {!process.env.NEXT_PUBLIC_GEMINI_API_KEY && !apiKey && (
                                <p className="text-[10px] text-fantasy-muted mt-1">Add NEXT_PUBLIC_GEMINI_API_KEY to .env.local or paste above</p>
                            )}
                        </div>

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
                            {generationProgress && (
                                <div className="mb-3 flex items-center justify-center gap-2 bg-fantasy-gold/10 border border-fantasy-gold/30 rounded p-2 text-xs text-fantasy-gold animate-pulse">
                                    <Sparkles size={14} className="animate-spin" />
                                    Generating map {generationProgress.current}/{generationProgress.total}...
                                </div>
                            )}
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
                        <div className="flex gap-2">
                            <button
                                onClick={() => updateMap(map.url)}
                                className="flex-1 rounded border border-fantasy-gold/30 bg-fantasy-gold/10 py-1 text-xs text-fantasy-gold hover:bg-fantasy-gold hover:text-black transition-colors"
                            >
                                📡 Broadcast Map
                            </button>
                            <button
                                onClick={() => { if (confirm("Clear map and queue?")) resetMap(); }}
                                className="rounded border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                                title="Reset Map"
                            >
                                <X size={16} />
                            </button>
                        </div>
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
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="mb-0 text-xl font-bold text-fantasy-gold flex items-center gap-2">
                                <ScrollText size={20} /> Quest Giver
                            </h2>
                            <button onClick={() => { if (confirm("Delete all quests?")) clearQuests(); }} className="text-xs text-fantasy-muted hover:text-red-500 flex items-center gap-1 border border-transparent hover:border-red-500/20 px-2 py-1 rounded">
                                <Trash2 size={12} /> Clear
                            </button>
                        </div>
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
                            <h2 className="text-xl font-bold text-fantasy-muted text-nowrap mr-4">Live Map & Table</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (confirm("Overwrite Cloud Database with Local Player File?")) {
                                            seedDatabase();
                                        }
                                    }}
                                    className="text-xs bg-red-900/30 text-red-400 px-2 py-1 rounded border border-red-900/50 hover:bg-red-900/50"
                                >
                                    Force Sync
                                </button>
                                <div className="flex items-center gap-1 text-[10px] text-zinc-500 bg-black/40 px-2 rounded border border-white/5">
                                    <div className={`w-2 h-2 rounded-full ${players.length > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
                                    {players.length > 0 ? 'Connected' : 'Offline'}
                                </div>
                            </div>
                        </div>

                        {/* Queue Controls */}
                        {map.queue?.length > 0 && (
                            <div className="flex items-center justify-between bg-black/40 p-2 rounded border border-fantasy-gold/20">
                                <button
                                    onClick={() => updateMap(map.queue[Math.max(0, map.currentIndex - 1)].url)}
                                    // Note: We need a prevMap function in context ideally, but manually setting URL for now works if we don't track index strictly backwards or if we add that later. 
                                    // Actually, let's just show current index.
                                    disabled={map.currentIndex === 0}
                                    className="text-fantasy-gold disabled:opacity-30 hover:bg-white/10 p-1 rounded"
                                >
                                    <Minus size={16} />
                                </button>
                                <div className="text-center">
                                    <div className="text-xs text-fantasy-muted uppercase tracking-widest">Current Scene</div>
                                    <div className="text-sm font-bold text-white">
                                        {map.currentIndex + 1} / {map.queue.length}
                                    </div>
                                    <div className="text-[10px] text-fantasy-muted truncate max-w-[200px]">
                                        {map.queue[map.currentIndex]?.title || "Unknown"}
                                    </div>
                                </div>
                                <button
                                    onClick={nextMap}
                                    disabled={map.currentIndex >= map.queue.length - 1}
                                    className="text-fantasy-gold disabled:opacity-30 hover:bg-white/10 p-1 rounded"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        )}

                        <MapComponent />
                    </div>
                </div>
            </main>
        </div>
    );
}

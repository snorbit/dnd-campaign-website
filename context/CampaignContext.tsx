"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CampaignState, Player, WorldState, MapData, Monster, Quest } from '@/types';
import localPlayers from '@/data/players.json'; // Direct import as fallback
import { supabase } from '@/lib/supabase';

// Default / Fallback Data
const defaultWorld: WorldState = { day: 1, time: "08:00 AM", session: 1 };
const defaultMap: MapData = { url: "", queue: [], currentIndex: 0 };

const CampaignContext = createContext<CampaignState | undefined>(undefined);

export const CampaignProvider = ({ children, initialPlayers }: { children: ReactNode, initialPlayers?: Player[] }) => {
    // Initialize state with defaults or props, falling back to local import
    const [players, setPlayers] = useState<Player[]>(
        (initialPlayers && initialPlayers.length > 0) ? initialPlayers : (localPlayers as unknown as Player[])
    );
    const [world, setWorld] = useState<WorldState>(defaultWorld);
    const [map, setMap] = useState<MapData>(defaultMap);
    const [encounters, setEncounters] = useState<Monster[]>([]);
    const [quests, setQuests] = useState<Quest[]>([]);
    const [dbId, setDbId] = useState<number>(1); // Default to row 1
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
    const [lastError, setLastError] = useState<string | null>(null);

    // 1. Initial Fetch & Auto-Seed

    // 1. Initial Fetch & Auto-Seed

    useEffect(() => {
        const fetchData = async () => {
            console.log("CampaignContext: Fetching data from Supabase...");
            // Fetch ANY single row (assuming single campaign app)
            const { data, error } = await supabase
                .from('campaign')
                .select('*')
                .limit(1)
                .single();

            if (data) {
                console.log("CampaignContext: Supabase data received:", data);
                setDbId(data.id); // Store the actual ID

                // Only overwrite if DB has valid data
                if (data.players && data.players.length > 0) {
                    setPlayers(data.players);
                } else {
                    console.log("CampaignContext: Auto-seeding database from local JSON...");
                    await supabase.from('campaign').update({ players: localPlayers }).eq('id', data.id);
                }

                if (data.world) setWorld(data.world);
                if (data.encounters) setEncounters(data.encounters);
                if (data.quests) setQuests(data.quests);

                if (data.map) {
                    setMap({
                        url: data.map.url || "",
                        queue: data.map.queue || [],
                        currentIndex: data.map.currentIndex || 0
                    });
                }
            } else {
                console.warn("CampaignContext: Supabase empty/failed, attempting auto-initialization...");

                // Insert a new row. We rely on DB to generate ID (identity)
                // We pass explicit values for JSON columns
                const { data: insertData, error: insertError } = await supabase.from('campaign').insert([{
                    players: (initialPlayers && initialPlayers.length > 0) ? initialPlayers : localPlayers,
                    world: defaultWorld,
                    map: defaultMap,
                    encounters: [],
                    quests: []
                }]).select().single();

                if (insertError) {
                    console.error("CampaignContext: Auto-init failed:", insertError);
                    // Fallback to local only
                    if (players.length === 0) setPlayers(localPlayers as unknown as Player[]);
                } else if (insertData) {
                    console.log(`CampaignContext: Database initialized with new ID ${insertData.id}.`);
                    setDbId(insertData.id);
                    // Set state from inserted data
                    setPlayers(insertData.players);
                    setWorld(insertData.world);
                    setMap(insertData.map);
                }
            }
        };
        fetchData();
    }, [initialPlayers]);

    // 2. Real-Time Subscription
    useEffect(() => {
        if (!dbId) return; // Wait for ID

        console.log(`CampaignContext: Subscribing to updates for info ID ${dbId}...`);
        const channel = supabase
            .channel('campaign_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'campaign',
                    filter: `id=eq.${dbId}`
                },
                (payload: any) => {
                    console.log("CampaignContext: Realtime update received!", payload);
                    const newData = payload.new;
                    if (newData.players) setPlayers(newData.players);
                    if (newData.world) setWorld(newData.world);
                    if (newData.map) setMap({
                        url: newData.map.url || "",
                        queue: newData.map.queue || [],
                        currentIndex: newData.map.currentIndex || 0
                    });
                    if (newData.encounters) setEncounters(newData.encounters);
                    if (newData.quests) setQuests(newData.quests);
                }
            )
            .subscribe((status: string) => {
                console.log("CampaignContext: Subscription status:", status);
                if (status === 'SUBSCRIBED') setConnectionStatus('connected');
                if (status === 'CHANNEL_ERROR') {
                    setConnectionStatus('error');
                    setLastError("Realtime Channel Error");
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [dbId]);

    // 3. Database Updates (Optimistic UI + DB Push)

    // Helper to push changes
    const pushUpdate = async (column: string, data: any) => {
        if (!dbId) {
            console.error("Cannot push update: No DB ID resolving yet.");
            return;
        }
        console.log(`[CampaignContext] Pushing update to ${column} (ID: ${dbId}):`, data);
        const { error } = await supabase.from('campaign').update({ [column]: data }).eq('id', dbId);
        if (error) {
            console.error(`[CampaignContext] Push failed for ${column}:`, error);
            setLastError(error.message);
            setConnectionStatus('error');
        } else {
            setConnectionStatus('connected');
        }
    };

    const updatePlayer = (id: string, updates: Partial<Player>) => {
        setPlayers((prev: Player[]) => {
            const newPlayers = prev.map(p => p.id === id ? { ...p, ...updates } : p);
            pushUpdate('players', newPlayers);
            return newPlayers;
        });
    };

    const updatePlayerPosition = (id: string, x: number, y: number) => {
        setPlayers((prev: Player[]) => {
            const newPlayers = prev.map(p => p.id === id ? { ...p, position: { x, y } } : p);
            pushUpdate('players', newPlayers);
            return newPlayers;
        });
    };

    const updateWorld = (updates: Partial<WorldState>) => {
        setWorld((prev: WorldState) => {
            const newWorld = { ...prev, ...updates };
            pushUpdate('world', newWorld);
            return newWorld;
        });
    };

    const updateMap = (url: string) => {
        const newMap = { ...map, url: url }; // Use current state as base
        console.log("Setting Map URL to:", url);
        setMap(newMap);
        pushUpdate('map', newMap);
    };

    const setMapQueue = (queue: { title: string; url: string; description: string }[]) => {
        setMap(prev => {
            const startUrl = queue.length > 0 ? queue[0].url : prev.url;
            const newMap = { ...prev, queue, currentIndex: 0, url: startUrl };
            pushUpdate('map', newMap);
            return newMap;
        });
    };

    const nextMap = () => {
        if (map.currentIndex + 1 < map.queue.length) {
            const nextIndex = map.currentIndex + 1;
            const nextUrl = map.queue[nextIndex].url;
            console.log("Advancing to map:", nextUrl);
            const newMap = { ...map, currentIndex: nextIndex, url: nextUrl };

            setMap(newMap);
            pushUpdate('map', newMap);
        }
    };

    const addEncounter = (monster: Monster) => {
        setEncounters((prev: Monster[]) => {
            const newEncounters = [...prev, monster];
            pushUpdate('encounters', newEncounters);
            return newEncounters;
        });
    };

    const removeEncounter = (id: string) => {
        setEncounters((prev: Monster[]) => {
            const newEncounters = prev.filter(m => m.id !== id);
            pushUpdate('encounters', newEncounters);
            return newEncounters;
        });
    };

    const updateEncounter = (id: string, updates: Partial<Monster>) => {
        setEncounters((prev: Monster[]) => {
            const newEncounters = prev.map(m => m.id === id ? { ...m, ...updates } : m);
            pushUpdate('encounters', newEncounters);
            return newEncounters;
        });
    };

    const addQuest = (quest: Quest) => {
        setQuests((prev: Quest[]) => {
            const newQuests = [...prev, quest];
            pushUpdate('quests', newQuests);
            return newQuests;
        });
    };

    const updateQuest = (id: string, updates: Partial<Quest>) => {
        setQuests((prev: Quest[]) => {
            const newQuests = prev.map(q => q.id === id ? { ...q, ...updates } : q);
            pushUpdate('quests', newQuests);
            return newQuests;
        });
    };

    const seedDatabase = async () => {
        if (!initialPlayers) return;
        setPlayers(initialPlayers);
        await pushUpdate('players', initialPlayers);
        // Also potentially reset others if needed, but primary issue is players
    };

    return (
        <CampaignContext.Provider value={{
            id: dbId,
            players, world, map, encounters, quests,
            updatePlayer, updateWorld, updateMap,
            setMapQueue, nextMap,
            addEncounter, removeEncounter, updateEncounter,
            addQuest, updateQuest, updatePlayerPosition,
            seedDatabase,
            connectionStatus, lastError,
            resetMap: () => {
                const resetState = { url: "", queue: [], currentIndex: 0 };
                setMap(resetState);
                pushUpdate('map', resetState);
            },
            clearQuests: () => {
                setQuests([]);
                pushUpdate('quests', []);
            }
        }}>
            {children}
        </CampaignContext.Provider>
    );
};

export const useCampaign = () => {
    const context = useContext(CampaignContext);
    if (!context) throw new Error('useCampaign must be used within a CampaignProvider');
    return context;
};

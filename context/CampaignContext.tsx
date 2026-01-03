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

    // 1. Initial Fetch & Auto-Seed
    useEffect(() => {
        const fetchData = async () => {
            console.log("CampaignContext: Fetching data from Supabase...");
            const { data, error } = await supabase
                .from('campaign')
                .select('*')
                .eq('id', 1)
                .single();

            if (data) {
                console.log("CampaignContext: Supabase data received:", data);
                // Only overwrite if DB has valid data
                if (data.players && data.players.length > 0) {
                    console.log("CampaignContext: Using Supabase players");
                    setPlayers(data.players);
                } else {
                    // DB is empty/stale, but we have local JSON. Auto-push local to DB.
                    console.log("CampaignContext: Auto-seeding database from local JSON...");
                    await supabase.from('campaign').update({ players: localPlayers }).eq('id', 1);
                }

                if (data.world) setWorld(data.world);
                if (data.encounters) setEncounters(data.encounters);
                if (data.quests) setQuests(data.quests);

                // Map restoration: Ensure we have valid default structure if DB is partial
                if (data.map) {
                    setMap({
                        url: data.map.url || "",
                        queue: data.map.queue || [],
                        currentIndex: data.map.currentIndex || 0
                    });
                }
            } else {
                console.warn("CampaignContext: Supabase empty/failed, using local fallback");
                // Already set in initial state, but ensuring it here
                if (players.length === 0) {
                    setPlayers(localPlayers as unknown as Player[]);
                }
            }
        };
        fetchData();
    }, [initialPlayers]);

    // 2. Real-Time Subscription
    useEffect(() => {
        const channel = supabase
            .channel('campaign_updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'campaign',
                    filter: 'id=eq.1'
                },
                (payload: any) => {
                    const newData = payload.new;
                    if (newData.players) setPlayers(newData.players);
                    if (newData.world) setWorld(newData.world);
                    if (newData.map) setMap(newData.map);
                    if (newData.encounters) setEncounters(newData.encounters);
                    if (newData.quests) setQuests(newData.quests);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // 3. Database Updates (Optimistic UI + DB Push)
    // We update local state immediately (UI feels fast), then push to DB.

    // Helper to push changes
    const pushUpdate = async (column: string, data: any) => {
        await supabase.from('campaign').update({ [column]: data }).eq('id', 1);
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
            players, world, map, encounters, quests,
            updatePlayer, updateWorld, updateMap,
            setMapQueue, nextMap,
            addEncounter, removeEncounter, updateEncounter,
            addQuest, updateQuest, updatePlayerPosition,
            seedDatabase
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

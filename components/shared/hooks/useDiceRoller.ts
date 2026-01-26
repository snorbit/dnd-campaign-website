import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";

export type DieType = 4 | 6 | 8 | 10 | 12 | 20 | 100;
export type RollType = "normal" | "advantage" | "disadvantage";

export interface RollHistoryEntry {
    id: string;
    formula: string;
    rolls: number[];
    modifier: number;
    total: number;
    timestamp: number;
    isPublic: boolean;
    type: RollType;
    sides: number;
    rolledBy?: string;
}

export const useDiceRoller = (campaignId?: number, playerName?: string) => {
    const [history, setHistory] = useState<RollHistoryEntry[]>([]);
    const [lastRoll, setLastRoll] = useState<RollHistoryEntry | null>(null);
    const channelRef = useRef<any>(null);

    // Real-time subscription
    useEffect(() => {
        if (!campaignId) return;

        const channelName = `campaign:${campaignId}:dice`;
        console.log(`Subscribing to dice channel: ${channelName}`);

        const channel = supabase.channel(channelName)
            .on('broadcast', { event: 'roll' }, ({ payload }) => {
                console.log('Received remote roll:', payload);
                const entry = payload as RollHistoryEntry;
                // Don't add if it's our own roll (though broadcast should exclude sender by default)
                // But we handle local state immediately, so this is for others
                setHistory(prev => [entry, ...prev].slice(0, 50));
                setLastRoll(entry);
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    const roll = useCallback((
        sides: DieType,
        quantity: number = 1,
        modifier: number = 0,
        type: RollType = "normal",
        isPublic: boolean = true,
        manualRolls?: number[]
    ) => {
        let rolls: number[] = [];

        if (manualRolls && manualRolls.length > 0) {
            rolls = [...manualRolls];
        } else {
            const actualQuantity = type !== "normal" && sides === 20 ? 2 : quantity;
            for (let i = 0; i < actualQuantity; i++) {
                rolls.push(Math.floor(Math.random() * sides) + 1);
            }
        }

        let resultBase = 0;
        if (sides === 20) {
            if (type === "advantage" && rolls.length >= 2) {
                resultBase = Math.max(rolls[0], rolls[1]);
            } else if (type === "disadvantage" && rolls.length >= 2) {
                resultBase = Math.min(rolls[0], rolls[1]);
            } else {
                resultBase = rolls.reduce((a, b) => a + b, 0);
            }
        } else {
            resultBase = rolls.reduce((a, b) => a + b, 0);
        }

        const total = resultBase + modifier;

        // Create formula string
        let formula = `${quantity}d${sides}`;
        if (sides === 20 && type !== "normal") {
            formula = `d20 (${type})`;
        }
        if (modifier !== 0) {
            formula += modifier > 0 ? ` + ${modifier}` : ` - ${Math.abs(modifier)}`;
        }

        const entry: RollHistoryEntry = {
            id: Math.random().toString(36).substring(2, 9),
            formula,
            rolls,
            modifier,
            total,
            timestamp: Date.now(),
            isPublic,
            type,
            sides,
            rolledBy: playerName || "Mysterious Traveler"
        };

        setLastRoll(entry);
        setHistory(prev => [entry, ...prev].slice(0, 50));

        // Broadcast if public and channel exists
        if (isPublic && channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'roll',
                payload: entry
            });
        }

        return entry;
    }, [playerName]);

    const parseAndRoll = useCallback((formula: string, isPublic: boolean = true) => {
        // Basic parser for "XdY+Z"
        const regex = /^(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?$/i;
        const match = formula.trim().match(regex);

        if (!match) return null;

        const quantity = match[1] ? parseInt(match[1]) : 1;
        const sides = parseInt(match[2]) as DieType;
        const sign = match[3] === "-" ? -1 : 1;
        const modifierValue = match[4] ? parseInt(match[4]) * sign : 0;

        if (![4, 6, 8, 10, 12, 20, 100].includes(sides)) return null;

        return roll(sides, Math.min(Math.max(quantity, 1), 20), modifierValue, "normal", isPublic);
    }, [roll]);

    const clearHistory = useCallback(() => {
        setHistory([]);
        setLastRoll(null);
    }, []);

    return {
        roll,
        parseAndRoll,
        history,
        lastRoll,
        clearHistory
    };
};

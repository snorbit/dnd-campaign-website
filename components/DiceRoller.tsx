"use client";

import { useState, useRef, useEffect } from "react";
import { Dices, X, ChevronUp, ChevronDown, History, Trash2 } from "lucide-react";

const DIE_TYPES = [4, 6, 8, 10, 12, 20];

type RollType = "normal" | "advantage" | "disadvantage";

export default function DiceRoller() {
    const [isOpen, setIsOpen] = useState(false);
    const [modifier, setModifier] = useState(0);
    const [rollType, setRollType] = useState<RollType>("normal");
    const [history, setHistory] = useState<{ die: number, result: number | string, timestamp: number, type: RollType, mod: number }[]>([]);
    const [isRolling, setIsRolling] = useState(false);

    // Audio refs (would need real files, simulating for now)

    const roll = (sides: number) => {
        setIsRolling(true);

        // Simulate roll delay
        setTimeout(() => {
            const r1 = Math.floor(Math.random() * sides) + 1;
            const r2 = Math.floor(Math.random() * sides) + 1;

            let finalResult = r1;
            let displayResult = `${r1}`;

            if (rollType === "advantage") {
                finalResult = Math.max(r1, r2);
                displayResult = `[${r1}, ${r2}] ➔ ${finalResult}`;
            } else if (rollType === "disadvantage") {
                finalResult = Math.min(r1, r2);
                displayResult = `[${r1}, ${r2}] ➔ ${finalResult}`;
            }

            const total = finalResult + modifier;
            const historyEntry = {
                die: sides,
                result: `${displayResult} ${modifier !== 0 ? (modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`) : ''} = ${total}`,
                timestamp: Date.now(),
                type: rollType,
                mod: modifier
            };

            setHistory(prev => [historyEntry, ...prev].slice(0, 20));
            setIsRolling(false);
        }, 300); // 300ms animation
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 rounded-full bg-fantasy-gold p-4 text-black shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:scale-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-300"
            >
                <Dices size={28} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Main Tray */}
            <div className="w-80 glass rounded-xl border border-fantasy-gold/20 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/10 bg-black/40">
                    <h3 className="font-serif font-bold text-fantasy-gold flex items-center gap-2">
                        <Dices size={18} /> Fate Weaver
                    </h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setHistory([])}
                            className="p-1 text-fantasy-muted hover:text-red-400 transition-colors"
                            title="Clear History"
                        >
                            <Trash2 size={16} />
                        </button>
                        <button onClick={() => setIsOpen(false)} className="text-fantasy-muted hover:text-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-4 space-y-4">
                    {/* Modifiers & Type */}
                    <div className="flex items-center justify-between gap-2">
                        {/* Modifier */}
                        <div className="flex items-center bg-black/40 rounded-lg border border-fantasy-muted/20">
                            <button
                                onClick={() => setModifier(m => m - 1)}
                                className="px-3 py-2 text-fantasy-muted hover:text-fantasy-red transition-colors"
                            >
                                <ChevronDown size={14} />
                            </button>
                            <span className="w-8 text-center font-mono text-sm font-bold text-fantasy-accent">
                                {modifier > 0 ? `+${modifier}` : modifier}
                            </span>
                            <button
                                onClick={() => setModifier(m => m + 1)}
                                className="px-3 py-2 text-fantasy-muted hover:text-green-400 transition-colors"
                            >
                                <ChevronUp size={14} />
                            </button>
                        </div>

                        {/* Roll Type Toggles */}
                        <div className="flex bg-black/40 rounded-lg border border-fantasy-muted/20 p-1">
                            <button
                                onClick={() => setRollType("disadvantage")}
                                className={`px-2 py-1 rounded text-xs font-bold transition-all ${rollType === 'disadvantage' ? 'bg-fantasy-red text-black' : 'text-fantasy-muted hover:text-fantasy-red'}`}
                            >
                                DIS
                            </button>
                            <button
                                onClick={() => setRollType("normal")}
                                className={`px-2 py-1 rounded text-xs font-bold transition-all ${rollType === 'normal' ? 'bg-fantasy-muted/50 text-white' : 'text-fantasy-muted hover:text-white'}`}
                            >
                                -
                            </button>
                            <button
                                onClick={() => setRollType("advantage")}
                                className={`px-2 py-1 rounded text-xs font-bold transition-all ${rollType === 'advantage' ? 'bg-green-500 text-black' : 'text-fantasy-muted hover:text-green-400'}`}
                            >
                                ADV
                            </button>
                        </div>
                    </div>

                    {/* Dice Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        {DIE_TYPES.map(sides => (
                            <button
                                key={sides}
                                onClick={() => roll(sides)}
                                disabled={isRolling}
                                className={`
                                    relative flex flex-col items-center justify-center p-3 rounded-lg border border-fantasy-muted/20 
                                    bg-gradient-to-br from-fantasy-bg to-black 
                                    hover:border-fantasy-gold/50 hover:shadow-[0_0_15px_rgba(212,175,55,0.15)] 
                                    active:scale-95 transition-all group
                                    ${isRolling ? 'opacity-50 cursor-wait' : ''}
                                `}
                            >
                                <span className="text-2xl font-serif font-bold text-fantasy-text group-hover:text-fantasy-gold transition-colors">
                                    d{sides}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* History Log - Compact */}
                <div className="bg-black/60 border-t border-white/5 max-h-40 overflow-y-auto custom-scrollbar">
                    {history.length === 0 ? (
                        <div className="p-4 text-center text-xs text-fantasy-muted italic opacity-50">
                            The dice recognize no master...
                        </div>
                    ) : (
                        <div className="flex flex-col p-2 space-y-1">
                            {history.map(entry => (
                                <div key={entry.timestamp} className="flex items-center justify-between text-xs p-2 rounded hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-1 h-1 rounded-full ${entry.type === 'normal' ? 'bg-fantasy-muted' : entry.type === 'advantage' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className="font-bold text-fantasy-muted">d{entry.die}</span>
                                    </div>
                                    <span className="font-mono text-fantasy-text">{entry.result}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

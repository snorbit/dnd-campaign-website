"use client";

import { useState } from "react";
import { Dices, X } from "lucide-react";

const DIE_TYPES = [4, 6, 8, 10, 12, 20];

export default function DiceRoller() {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<{ die: number, result: number, timestamp: number }[]>([]);

    const roll = (sides: number) => {
        const result = Math.floor(Math.random() * sides) + 1;
        setHistory(prev => [{ die: sides, result, timestamp: Date.now() }, ...prev].slice(0, 10));
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 rounded-full bg-fantasy-gold p-4 text-fantasy-dark shadow-2xl hover:scale-110 transition-transform"
            >
                <Dices size={24} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
            <div className="w-64 rounded-lg border border-fantasy-muted/20 bg-fantasy-bg p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-10 fade-in">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-bold text-fantasy-gold flex items-center gap-2">
                        <Dices size={16} /> Dice Belt
                    </h3>
                    <button onClick={() => setIsOpen(false)} className="text-fantasy-muted hover:text-white">
                        <X size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                    {DIE_TYPES.map(sides => (
                        <button
                            key={sides}
                            onClick={() => roll(sides)}
                            className="flex flex-col items-center justify-center rounded bg-black/40 p-2 hover:bg-fantasy-accent hover:text-fantasy-dark transition-colors"
                        >
                            <span className="text-xs font-bold opacity-50">d{sides}</span>
                        </button>
                    ))}
                </div>

                {/* History */}
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                    {history.length === 0 ? (
                        <p className="text-center text-xs italic text-fantasy-muted">No rolls yet.</p>
                    ) : (
                        history.map(roll => (
                            <div key={roll.timestamp} className="flex items-center justify-between text-xs rounded bg-white/5 p-1 px-2">
                                <span className="text-fantasy-muted">d{roll.die}</span>
                                <span className={`font-bold ${roll.result === roll.die ? "text-green-400" : roll.result === 1 ? "text-red-400" : "text-white"}`}>
                                    {roll.result}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <button
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-fantasy-muted/20 p-2 text-fantasy-muted hover:bg-red-500 hover:text-white"
            >
                <X size={20} />
            </button>
        </div>
    );
}

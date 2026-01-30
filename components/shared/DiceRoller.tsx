"use client";

import { useState, useRef, useEffect } from "react";
import {
    X,
    ChevronUp,
    ChevronDown,
    History,
    Eye,
    EyeOff,
    Trash2,
    ShieldAlert,
    Zap,
    Clock,
    User
} from "lucide-react";
import { useDiceRoller, DieType, RollType } from "./hooks/useDiceRoller";
import { useCampaign } from "@/context/CampaignContext";
import { toast } from "sonner";
import styles from "./DiceRoller.module.css";
import { Dice3D } from "./Dice3D";
import { DiceBoxComponent } from "./DiceBox";

const DIE_OPTIONS: DieType[] = [4, 6, 8, 10, 12, 20, 100];

export const DiceRoller = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [modifier, setModifier] = useState(0);
    const [rollType, setRollType] = useState<RollType>("normal");
    const [isPublic, setIsPublic] = useState(true);
    const [isRolling, setIsRolling] = useState(false);
    const [currentSides, setCurrentSides] = useState<number>(20);

    const { id: campaignId, players } = useCampaign();

    // Try to find current player name from localStorage (matching login logic)
    const [playerName, setPlayerName] = useState("Mysterious Traveler");

    useEffect(() => {
        if (players && players.length > 0) {
            const activePlayer = players.find(p => localStorage.getItem(`auth-${p.id}`) === "true");
            if (activePlayer) {
                setPlayerName(activePlayer.name);
            }
        }
    }, [players]);

    const { roll, history, lastRoll, clearHistory } = useDiceRoller(campaignId, playerName);
    const historyEndRef = useRef<HTMLDivElement>(null);
    const rollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const prevLastRollId = useRef<string | null>(null);

    const scrollToBottom = () => {
        historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (history.length > 0) {
            scrollToBottom();
        }
    }, [history]);

    // Handle incoming rolls from others via toasts
    useEffect(() => {
        if (lastRoll && lastRoll.id !== prevLastRollId.current) {
            if (lastRoll.rolledBy !== playerName) {
                toast.info(`${lastRoll.rolledBy} rolled ${lastRoll.formula}`, {
                    description: `Result: ${lastRoll.total}`,
                    icon: <img src="/fantasy-d20.png" alt="" className="w-10 h-10 object-contain" />,
                });
            }
            prevLastRollId.current = lastRoll.id;
        }
    }, [lastRoll, playerName]);

    const handleRoll = (sides: DieType) => {
        if (isRolling) return;

        setCurrentSides(sides);
        setIsRolling(true);

        if (rollingTimeoutRef.current) clearTimeout(rollingTimeoutRef.current);

        // For standard dice (d4-d100), DiceBox handles the animation and we wait for its callback
        // We set a safety timeout in case something goes wrong
        rollingTimeoutRef.current = setTimeout(() => {
            // Safety fallback - if DiceBox didn't complete in 5 seconds
            if (isRolling) {
                roll(sides, quantity, modifier, rollType, isPublic);
                setIsRolling(false);
            }
        }, 5000);
    };

    const handleDiceBoxComplete = (results: any) => {
        // DiceBox completed its animation
        if (rollingTimeoutRef.current) clearTimeout(rollingTimeoutRef.current);

        // Extract individual die values from DiceBox results
        const manualRolls = Array.isArray(results) ? results.map((r: any) => r.value) : [];

        // Complete the roll using our hook with the physical results
        roll(currentSides as DieType, quantity, modifier, rollType, isPublic, manualRolls);
        setIsRolling(false);
    };

    const incrementQty = () => setQuantity(prev => Math.min(prev + 1, 20));
    const decrementQty = () => setQuantity(prev => Math.max(prev - 1, 1));

    const isCritSuccess = lastRoll?.sides === 20 && lastRoll.rolls.includes(20);
    const isCritFail = lastRoll?.sides === 20 && lastRoll.rolls.includes(1);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 rounded-full bg-black/80 p-2 border-2 border-fantasy-gold/50 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:scale-110 hover:shadow-[0_0_30px_rgba(212,175,55,0.7)] transition-all duration-300 group overflow-hidden"
                aria-label="Open Dice Roller"
            >
                <img
                    src="/fantasy-d20.png"
                    alt="Dice Roller"
                    className="w-12 h-12 object-contain group-hover:rotate-12 transition-transform"
                />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Main Container */}
            <div className="w-80 glass rounded-2xl border border-fantasy-gold/30 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/60">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-fantasy-gold/10 ${isRolling ? styles.rolling : ""}`}>
                            <img src="/fantasy-d20.png" alt="" className="w-6 h-6 object-contain" />
                        </div>
                        <h3 className="font-serif font-bold text-fantasy-gold tracking-wide">
                            Fate Weaver
                        </h3>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 text-fantasy-muted hover:text-white hover:bg-white/10 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Unified Controls Tray */}
                <div className="p-6 space-y-8">

                    {/* Top Controls Row */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Quantity Control */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-fantasy-muted font-bold block ml-1">Quantity</label>
                            <div className="flex items-center bg-black/40 rounded-xl border border-white/10 group focus-within:border-fantasy-gold/50 transition-colors">
                                <button
                                    onClick={decrementQty}
                                    className="p-2.5 text-fantasy-muted hover:text-fantasy-gold transition-colors"
                                >
                                    <ChevronDown size={16} />
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 20))}
                                    className="w-full bg-transparent text-center font-mono font-bold text-fantasy-accent outline-none"
                                />
                                <button
                                    onClick={incrementQty}
                                    className="p-2.5 text-fantasy-muted hover:text-fantasy-gold transition-colors"
                                >
                                    <ChevronUp size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Modifier Control */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-fantasy-muted font-bold block ml-1">Modifier</label>
                            <div className="flex items-center bg-black/40 rounded-xl border border-white/10 group focus-within:border-fantasy-gold/50 transition-colors">
                                <button
                                    onClick={() => setModifier(m => m - 1)}
                                    className="p-2.5 text-fantasy-muted hover:text-fantasy-red transition-colors"
                                >
                                    <ChevronDown size={16} />
                                </button>
                                <span className={`w-full text-center font-mono font-bold ${modifier === 0 ? 'text-fantasy-muted' : modifier > 0 ? 'text-green-400' : 'text-fantasy-red'}`}>
                                    {modifier > 0 ? `+${modifier}` : modifier}
                                </span>
                                <button
                                    onClick={() => setModifier(m => m + 1)}
                                    className="p-2.5 text-fantasy-muted hover:text-green-400 transition-colors"
                                >
                                    <ChevronUp size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* D20 Special Rules & Privacy */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex bg-black/40 rounded-xl border border-white/10 p-1 flex-1">
                            <button
                                onClick={() => setRollType("disadvantage")}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-tight transition-all ${rollType === 'disadvantage' ? 'bg-fantasy-red/20 text-fantasy-red border border-fantasy-red/30' : 'text-fantasy-muted hover:text-white'}`}
                            >
                                DIS
                            </button>
                            <button
                                onClick={() => setRollType("normal")}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-tight transition-all ${rollType === 'normal' ? 'bg-white/10 text-white' : 'text-fantasy-muted hover:text-white'}`}
                            >
                                STD
                            </button>
                            <button
                                onClick={() => setRollType("advantage")}
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-tight transition-all ${rollType === 'advantage' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'text-fantasy-muted hover:text-white'}`}
                            >
                                ADV
                            </button>
                        </div>

                        <button
                            onClick={() => setIsPublic(!isPublic)}
                            className={`p-2.5 rounded-xl border transition-all ${isPublic ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}
                            title={isPublic ? "Public Roll" : "Secret Roll"}
                        >
                            {isPublic ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {DIE_OPTIONS.map(sides => (
                            <button
                                key={sides}
                                onClick={() => handleRoll(sides)}
                                disabled={isRolling}
                                className={`
                  relative flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 
                  bg-gradient-to-br from-white/5 to-transparent 
                  hover:border-fantasy-gold/40 hover:from-white/10 hover:shadow-[0_0_15px_rgba(212,175,55,0.1)] 
                  active:scale-95 transition-all group
                  ${sides === 20 ? 'col-span-2 bg-fantasy-gold/5 border-fantasy-gold/20' : ''}
                  ${isRolling ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                            >
                                <span className={`font-serif font-black ${sides === 20 ? 'text-xl text-fantasy-gold' : 'text-lg text-fantasy-text group-hover:text-fantasy-gold'} transition-colors`}>
                                    d{sides}
                                </span>
                                <div className="absolute inset-0 rounded-xl bg-fantasy-gold/0 group-hover:bg-fantasy-gold/5 transition-colors pointer-events-none" />
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mx-5 mb-5 min-h-[280px] flex items-center justify-center relative">
                    <div className="w-full h-full min-h-[280px] absolute inset-0">
                        {/* Use DiceBox for standard dice d4-d100 */}
                        <DiceBoxComponent
                            rolling={isRolling}
                            sides={currentSides}
                            quantity={(rollType !== "normal" && currentSides === 20) ? 2 : quantity}
                            modifier={modifier}
                            onRollComplete={handleDiceBoxComplete}
                        />
                    </div>
                    {!isRolling && lastRoll ? (
                        <div className={`w-full p-4 bg-fantasy-gold/10 border border-fantasy-gold/30 rounded-2xl ${styles.resultBounce}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-fantasy-gold/70">{lastRoll.formula}</span>
                                    <div className="flex items-center gap-1 text-[8px] text-fantasy-muted">
                                        <User size={8} />
                                        <span>{lastRoll.rolledBy}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-mono text-fantasy-muted">
                                    <Clock size={10} />
                                    {new Date(lastRoll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </div>
                            </div>
                            <div className="flex items-center justify-end">
                                <div className="flex flex-col items-end">
                                    <span className={`text-3xl font-serif font-black drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] 
                    ${isCritSuccess ? styles.critSuccess : isCritFail ? styles.critFail : 'text-fantasy-accent'}`}>
                                        {lastRoll.total}
                                    </span>
                                    {isCritSuccess && <span className="text-[8px] font-bold text-green-400 uppercase tracking-tighter">Critical!</span>}
                                    {isCritFail && <span className="text-[8px] font-bold text-fantasy-red uppercase tracking-tighter">Fumble!</span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-fantasy-muted/20 flex flex-col items-center gap-2">
                            <Zap size={32} />
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-center">Awaiting the weave of fate</span>
                        </div>
                    )}
                </div>

                {/* History Log */}
                <div className="flex-1 min-h-0 flex flex-col bg-black/40 border-t border-white/10">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2 text-fantasy-muted">
                            <History size={14} />
                            <span className="text-[10px] uppercase font-black tracking-widest">Chronicle of Fate</span>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="text-fantasy-muted hover:text-fantasy-red transition-colors p-1"
                                title="Clear History"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    <div className={`overflow-y-auto ${styles.scrollArea} p-2 space-y-1 max-h-48`}>
                        {history.length === 0 ? (
                            <div className="py-8 text-center flex flex-col items-center gap-2 opacity-30">
                                <ShieldAlert size={24} className="text-fantasy-muted" />
                                <p className="text-[10px] italic font-serif">The void whispers no results...</p>
                            </div>
                        ) : (
                            [...history].reverse().map((entry, idx) => (
                                <div
                                    key={entry.id}
                                    className={`${styles.historyItem} group relative flex items-center justify-between p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all`}
                                >
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-1.5 h-1.5 rounded-full ${entry.type === 'normal' ? 'bg-fantasy-muted/50' : entry.type === 'advantage' ? 'bg-green-500' : 'bg-fantasy-red'}`} />
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-fantasy-muted tracking-tight">{entry.formula}</span>
                                                <span className="text-[8px] text-white/20 font-mono">{entry.rolledBy} • {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 mt-1 pl-3">
                                            {entry.rolls.map((r, i) => (
                                                <span key={i} className={`text-[9px] font-mono ${r === entry.sides ? 'text-green-500/50' : r === 1 ? 'text-fantasy-red/50' : 'text-white/30'}`}>
                                                    {r}{i < entry.rolls.length - 1 ? ',' : ''}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-sm font-serif font-bold group-hover:scale-110 transition-transform
                       ${entry.sides === 20 && entry.rolls.includes(20) ? 'text-green-400' :
                                                entry.sides === 20 && entry.rolls.includes(1) ? 'text-fantasy-red' :
                                                    'text-fantasy-accent/80 group-hover:text-fantasy-accent'}`}>
                                            {entry.total}
                                        </span>
                                        {!entry.isPublic && <EyeOff size={10} className="text-orange-500/50" />}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={historyEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};

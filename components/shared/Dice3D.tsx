"use client";

import React, { useEffect, useState } from "react";

// This component acts as a fallback or for special dice like d100
// Standard polyhedral dice (d4-d20) are handled by the DiceBox physics engine
export const Dice3D = ({ sides, rolling }: { sides: number; rolling: boolean }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!rolling || !mounted) return null;

    // Special handling for d100
    if (sides === 100) {
        return (
            <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="animate-bounce text-7xl drop-shadow-[0_0_20px_rgba(212,175,55,0.6)] filter brightness-125">
                    💯
                </div>
            </div>
        );
    }

    // Fallback for other counts if they end up here (should be rare as DiceBox covers them)
    return (
        <div className="w-full h-full absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="animate-pulse text-4xl font-serif font-black text-fantasy-gold">
                d{sides}
            </div>
        </div>
    );
};

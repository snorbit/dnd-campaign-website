"use client";

import React, { useEffect, useRef, useState } from 'react';
import DiceBox from '@3d-dice/dice-box';

interface DiceBoxComponentProps {
    onRollComplete?: (results: any) => void;
    rolling: boolean;
    sides: number;
    quantity: number;
    modifier: number;
}

export const DiceBoxComponent = ({
    onRollComplete,
    rolling,
    sides,
    quantity,
    modifier
}: DiceBoxComponentProps) => {
    const diceBoxRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [initError, setInitError] = useState<string | null>(null);
    const prevRollingRef = useRef(false);

    useEffect(() => {
        // Only initialize once when the component mounts
        if (!diceBoxRef.current && containerRef.current) {
            console.log("Initializing DiceBox...");

            // Create new DiceBox instance following official docs
            // The constructor takes a config object with assetPath as REQUIRED
            diceBoxRef.current = new DiceBox({
                assetPath: '/assets/dice-box/', // Must include trailing slash
                container: '#dice-box-container',
                theme: 'default',
                themeColor: '#4a3728', // Dark bronze/brown for better text visibility
                scale: 16, // 30% larger than original (12 * 1.3 ≈ 16)
                gravity: 2,
                mass: 1,
                friction: 0.8,
                restitution: 0.5,
                spinForce: 5,
                throwForce: 5,
                startingHeight: 10,
                settleTimeout: 5000,
                offscreen: true, // Use web workers for better performance
                delay: 10,
                lightIntensity: 1,
                enableShadows: true,
                shadowTransparency: 0.8,
            });

            diceBoxRef.current.init()
                .then(() => {
                    console.log("DiceBox initialized successfully");
                    setIsInitialized(true);
                })
                .catch((err: any) => {
                    console.error("DiceBox initialization failed:", err);
                    setInitError(err?.message || 'Failed to initialize');
                });
        }

        return () => {
            // Cleanup on unmount
            if (diceBoxRef.current) {
                try {
                    diceBoxRef.current.clear();
                } catch (e) {
                    // Ignore cleanup errors
                }
            }
        };
    }, []);

    // Handle rolling state changes
    useEffect(() => {
        // Detect rising edge of rolling (false -> true)
        if (rolling && !prevRollingRef.current && isInitialized && diceBoxRef.current) {
            console.log(`Rolling ${quantity}d${sides}`);

            // Clear previous dice first
            diceBoxRef.current.clear();

            // Build notation string (e.g., "2d20" or "1d6+3")
            const notation = `${quantity}d${sides}`;

            // Roll the dice
            diceBoxRef.current.roll(notation)
                .then((results: any) => {
                    console.log("DiceBox roll results:", results);
                    if (onRollComplete) {
                        onRollComplete(results);
                    }
                })
                .catch((err: any) => {
                    console.error("Roll failed:", err);
                });
        }

        prevRollingRef.current = rolling;
    }, [rolling, isInitialized, sides, quantity, modifier, onRollComplete]);

    if (initError) {
        return (
            <div className="w-full h-full flex items-center justify-center text-red-400 text-sm">
                3D Dice Error: {initError}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full absolute inset-0"
            style={{ minHeight: '280px' }}
        >
            {/* DiceBox will inject its canvas into this container */}
            <div
                id="dice-box-container"
                className="w-full h-full"
                style={{
                    minWidth: '280px',
                    minHeight: '280px',
                    position: 'relative'
                }}
            />
            {!isInitialized && (
                <div className="absolute inset-0 flex items-center justify-center text-fantasy-gold/50 text-sm">
                    Loading 3D dice...
                </div>
            )}
        </div>
    );
};

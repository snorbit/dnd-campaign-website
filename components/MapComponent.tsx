"use client";

import { useCampaign } from "@/context/CampaignContext";
import React, { useState } from "react";

export default function MapComponent() {
    const { map, players, updatePlayerPosition, nextMap, updatePlayer } = useCampaign();
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

    // Reset loading states when map URL changes
    React.useEffect(() => {
        if (map.url) {
            setImageLoaded(false);
            setImageError(false);
        }
    }, [map.url]);

    if (!map.url) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center rounded-lg border-2 border-dashed border-fantasy-muted/20 bg-black/40">
                <div className="text-center">
                    <p className="text-fantasy-muted text-sm mb-2">No map currently displayed by the DM.</p>
                    <p className="text-fantasy-muted/50 text-xs">Waiting for the adventure to begin...</p>
                </div>
            </div>
        );
    }

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // If no token is selected, do nothing on empty map click
        if (!selectedTokenId) return;

        // VTT Move Logic:
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Move the selected token to this spot
        updatePlayerPosition(selectedTokenId, x, y);

        // Edge Transition Logic
        if (x > 95) {
            // Small delay to let the move animation start/register
            setTimeout(() => {
                if (window.confirm("Travel to the next area?")) {
                    nextMap();
                    // Reset to left side (Entrance)
                    updatePlayerPosition(selectedTokenId, 5, 50);
                }
            }, 100);
        }
    };

    const handleTokenClick = (e: React.MouseEvent, playerId: string) => {
        e.stopPropagation(); // Prevent map click triggering
        if (selectedTokenId === playerId) {
            setSelectedTokenId(null); // Deselect if clicking same
        } else {
            setSelectedTokenId(playerId); // Select new
        }
    };

    return (
        <div
            className={`relative h-[60vh] w-full overflow-hidden rounded-lg border border-fantasy-muted/20 bg-black shadow-2xl ${selectedTokenId ? 'cursor-crosshair' : 'cursor-default'}`}
            onClick={handleMapClick}
        >
            {/* Map Image */}
            {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fantasy-gold mx-auto mb-4"></div>
                        <p className="text-fantasy-muted text-sm">Loading map...</p>
                    </div>
                </div>
            )}
            {imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <div className="text-center p-6">
                        <p className="text-red-400 text-sm mb-2">Failed to load map</p>
                        <p className="text-fantasy-muted text-xs">The map image could not be displayed</p>
                    </div>
                </div>
            )}
            <img
                src={map.url}
                alt="Campaign Map"
                className={`h-full w-full object-cover scale-[1.02] origin-top select-none pointer-events-auto transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
            />

            {/* Instruction Overlay if token selected */}
            {selectedTokenId && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-[10px] text-white pointer-events-none animate-pulse z-20 border border-white/20">
                    Click anywhere to move
                </div>
            )}

            {/* Tokens Layer */}
            {players.map(player => (
                player.position && (
                    <div
                        key={player.id}
                        onClick={(e) => handleTokenClick(e, player.id)}
                        className={`absolute h-8 w-8 -ml-4 -mt-4 rounded-full border-2 shadow-lg flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300 cursor-pointer hover:scale-110
                            ${selectedTokenId === player.id ? 'border-fantasy-gold ring-2 ring-fantasy-gold ring-offset-2 ring-offset-black scale-110 z-10' : 'border-white'}
                        `}
                        style={{
                            left: `${player.position.x}%`,
                            top: `${player.position.y}%`,
                            backgroundColor: player.token ? 'transparent' : (player.id === '1' ? '#ef4444' : '#3b82f6')
                        }}
                    >
                        {player.token ? (
                            <img src={player.token} alt={player.name} className="h-full w-full rounded-full object-cover pointer-events-none" />
                        ) : (
                            userInitials(player.name)
                        )}
                    </div>
                )
            ))}
        </div>
    );
}

function userInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
}

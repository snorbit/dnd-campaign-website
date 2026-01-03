"use client";

import { useCampaign } from "@/context/CampaignContext";
import React, { useState } from "react";

export default function MapComponent() {
    const { map, players, updatePlayerPosition, nextMap, updatePlayer } = useCampaign();

    if (!map.url) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center rounded-lg border-2 border-dashed border-fantasy-muted/20 bg-black/40">
                <p className="text-fantasy-muted text-sm">No map currently displayed by the DM.</p>
            </div>
        );
    }

    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // If no token is selected, do nothing on empty map click
        if (!selectedTokenId) return;

        // VTT Move Logic:
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Move the selected token to this spot
        updatePlayerPosition(selectedTokenId, x, y);

        // Optional: Deselect after move? Or keep selected for rapid movement?
        // Let's keep selected for now, makes dragging easier mentally.
        // setSelectedTokenId(null);
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
            <img
                src={map.url}
                alt="Campaign Map"
                className="h-full w-full object-cover scale-[1.02] origin-top select-none pointer-events-none"
            />

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

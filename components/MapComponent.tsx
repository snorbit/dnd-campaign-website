"use client";

import { useCampaign } from "@/context/CampaignContext";

export default function MapComponent() {
    const { map, players, updatePlayerPosition } = useCampaign();

    if (!map.url) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center rounded-lg border-2 border-dashed border-fantasy-muted/20 bg-black/40">
                <p className="text-fantasy-muted text-sm">No map currently displayed by the DM.</p>
            </div>
        );
    }

    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Simple VTT Logic:
        // 1. Get click percentages relative to the container
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // 2. Identify who is clicking (For now, we just move Player 1 as a demo, or current user if auth was strict)
        // In a real app, we'd check `currentUser.id`. 
        // Let's prompt or just move the first player for simplicity of this demo?
        // Actually, let's look for a generic "me" or just move Player 1 (Valeros) for testing.
        // User asked for "Easy to use".
        // Better Idea: Move the player that matches the currently logged in user (from Context maybe? Or just hardcode ID 1 for now).
        updatePlayerPosition("1", x, y);
    };

    return (
        <div
            className="relative h-[60vh] w-full overflow-hidden rounded-lg border border-fantasy-muted/20 bg-black shadow-2xl cursor-crosshair"
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
                        className="absolute h-8 w-8 -ml-4 -mt-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300"
                        style={{
                            left: `${player.position.x}%`,
                            top: `${player.position.y}%`,
                            backgroundColor: player.id === '1' ? '#ef4444' : '#3b82f6' // Red for P1, Blue for others
                        }}
                    >
                        {userInitials(player.name)}
                    </div>
                )
            ))}
        </div>
    );
}

function userInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
}

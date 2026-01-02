"use client";

import { useCampaign } from "@/context/CampaignContext";

export default function WorldCounter() {
    const { world } = useCampaign();

    return (
        <div className="flex w-full items-center justify-between border-b border-fantasy-muted/20 bg-fantasy-bg/90 p-4 text-fantasy-text shadow-lg backdrop-blur">
            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-widest text-fantasy-muted">Day</span>
                    <span className="text-xl font-bold text-fantasy-gold">{world.day}</span>
                </div>
                <div className="h-8 w-px bg-fantasy-muted/20"></div>
                <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-widest text-fantasy-muted">Time</span>
                    <span className="text-xl font-bold">{world.time}</span>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <span className="text-xs uppercase tracking-widest text-fantasy-muted">Session</span>
                <span className="text-xl font-bold text-fantasy-accent">{world.session}</span>
            </div>
        </div>
    );
}

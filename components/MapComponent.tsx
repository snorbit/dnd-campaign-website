"use client";

import { useCampaign } from "@/context/CampaignContext";

export default function MapComponent() {
    const { map } = useCampaign();

    if (!map.url) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center rounded-lg border-2 border-dashed border-fantasy-muted/20 bg-black/40">
                <p className="text-fantasy-muted">No map currently displayed by the DM.</p>
            </div>
        );
    }

    return (
        <div className="relative h-[60vh] w-full overflow-hidden rounded-lg border border-fantasy-muted/20 bg-black shadow-2xl">
            {/* 
        Using standard img tag here for simplicity with arbitrary external URLs.
        In a production app with known domains, Next.js <Image> would be better.
      */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            className="h-full w-full object-cover scale-[1.02] origin-top"
            />
            {/* Optional: Vignette overlay to hide edges if needed, but scale/cover usually enough for bottom watermark */}
        </div>
    );
}

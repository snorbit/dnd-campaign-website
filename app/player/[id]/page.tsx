"use client";

import { useCampaign } from "@/context/CampaignContext";
import WorldCounter from "@/components/WorldCounter";
import MapComponent from "@/components/MapComponent";
import Tabs from "@/components/Tabs";
import { Shield, Backpack, Users, Skull, Scroll, ScrollText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PlayerPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { players, world, encounters, quests } = useCampaign();
    const player = players.find(p => p.id === params.id);
    const otherPlayers = players.filter(p => p.id !== params.id);

    // Auth Check
    useEffect(() => {
        // If we have no players loaded yet (context init), skip
        if (players.length > 0 && player) {
            // If player has password, check local storage
            if (player.password) {
                const isAuth = localStorage.getItem(`auth-${player.id}`);
                if (!isAuth) {
                    router.push('/login');
                }
            }
        }
    }, [player, players, router]);

    if (!player) {
        return (
            <div className="flex min-h-screen items-center justify-center text-fantasy-muted">
                Player not found...
            </div>
        );
    }

    const StatsTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-fantasy-bg p-4 text-center border border-fantasy-muted/10">
                    <div className="mb-1 text-xs uppercase text-fantasy-muted">Hit Points</div>
                    <div className="text-3xl font-bold text-fantasy-gold">{player.hp.current} <span className="text-sm text-fantasy-muted">/ {player.hp.max}</span></div>
                </div>
                <div className="rounded-lg bg-fantasy-bg p-4 text-center border border-fantasy-muted/10">
                    <div className="mb-1 text-xs uppercase text-fantasy-muted">Temp HP</div>
                    <div className="text-3xl font-bold text-blue-400">{player.hp.temp}</div>
                </div>
            </div>

            <div className="rounded-lg bg-fantasy-bg p-4 border border-fantasy-muted/10">
                <h3 className="mb-3 text-sm font-bold uppercase text-fantasy-muted">Ability Scores</h3>
                <div className="grid grid-cols-3 gap-2">
                    {Object.entries(player.stats).map(([stat, value]) => (
                        <div key={stat} className="flex flex-col items-center rounded bg-black/20 p-2">
                            <span className="text-xs uppercase text-fantasy-muted">{stat}</span>
                            <span className="font-bold">{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const InventoryTab = () => (
        <div className="space-y-6">
            <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-fantasy-muted">
                    <Backpack size={16} /> Equipment
                </h3>
                <ul className="space-y-1">
                    {player.equipment.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 rounded bg-fantasy-bg p-2 text-sm border border-fantasy-muted/10">
                            <div className="h-1.5 w-1.5 rounded-full bg-fantasy-accent"></div>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-fantasy-muted">
                    <Scroll size={16} /> Spells
                </h3>
                {player.spells.length === 0 ? (
                    <p className="text-sm italic text-fantasy-muted">No spells known.</p>
                ) : (
                    <ul className="space-y-1">
                        {player.spells.map((spell, i) => (
                            <li key={i} className="rounded bg-fantasy-bg p-2 text-sm border border-fantasy-muted/10">{spell}</li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );

    const PartyTab = () => (
        <div className="space-y-6">
            <div className="space-y-3">
                <h3 className="mb-2 text-sm font-bold uppercase text-fantasy-muted text-center">Allies</h3>
                {otherPlayers.map(p => (
                    <div key={p.id} className="flex items-center justify-between rounded bg-fantasy-bg p-3 border border-fantasy-muted/10">
                        <div>
                            <div className="font-bold">{p.name}</div>
                            <div className="text-xs text-fantasy-muted">{p.race} {p.class}</div>
                        </div>
                        <div className={`text-sm font-bold ${p.hp.current < p.hp.max / 2 ? 'text-red-500' : 'text-green-500'}`}>
                            {p.hp.current}/{p.hp.max} HP
                        </div>
                    </div>
                ))}
            </div>

            {encounters.length > 0 && (
                <div className="space-y-3">
                    <h3 className="mb-2 text-sm font-bold uppercase text-red-400 text-center flex items-center justify-center gap-2">
                        <Skull size={16} /> Threats
                    </h3>
                    {encounters.map(monster => (
                        <div key={monster.id} className="flex items-center justify-between rounded bg-black/20 p-3 border-l-2 border-red-500">
                            <div>
                                <div className="font-bold">{monster.name}</div>
                                <div className="text-xs text-fantasy-muted">{monster.type}</div>
                            </div>
                            {/* Players usually don't see exact HP of monsters, just status? But for this dashboard let's show exact for simplicity as requested 'Real-time Data Sync to track Hit Points' */}
                            <div className="text-sm font-bold text-red-400">
                                {monster.hp.current} HP
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-fantasy-dark">
            <WorldCounter />

            <main className="flex flex-1 flex-col lg:flex-row overflow-hidden">
                {/* Mobile: Map on top (collapsible? sticky?), Desktop: Map on left */}
                <div className="flex-1 overflow-auto bg-black p-4 lg:w-2/3">
                    <div className="sticky top-0 z-10 mb-4 bg-fantasy-dark/80 p-2 backdrop-blur lg:hidden text-center text-xs text-fantasy-accent">
                        Scroll down for Map
                    </div>

                    <div className="mb-6 lg:mb-0">
                        <div className="mb-2 flex items-center gap-2 lg:hidden">
                            <span className="h-8 w-8 rounded-full bg-fantasy-gold flex items-center justify-center text-fantasy-dark font-bold">{player.id}</span>
                            <h1 className="text-xl font-bold">{player.name}</h1>
                        </div>

                        {/* Character Sheet Area for Mobile/Desktop */}
                        <div className="h-auto lg:h-full flex flex-col gap-4">
                            {/* On desktop, we want map on left, sheet on right? User asked for layout. 
                   Let's put map in center/left and sheet on right sidebar.
               */}
                            <MapComponent />
                        </div>
                    </div>
                </div>

  const QuestTab = () => (
                <div className="space-y-4">
                    <h3 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase text-fantasy-muted">
                        <ScrollText size={16} /> Active Quests
                    </h3>
                    {quests.length === 0 ? (
                        <p className="text-sm italic text-fantasy-muted">No active quests.</p>
                    ) : (
                        <div className="space-y-2">
                            {quests.map(quest => (
                                <div key={quest.id} className={`rounded bg-fantasy-bg p-3 border border-fantasy-muted/10 ${quest.status === 'completed' ? 'border-green-500/30' : ''}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`font-bold ${quest.status === 'completed' ? 'text-green-400 line-through' : 'text-fantasy-gold'}`}>{quest.title}</span>
                                        {quest.status === 'completed' && <span className="text-xs bg-green-900/30 text-green-400 px-2 rounded">Complete</span>}
                                    </div>
                                    <p className="text-xs text-fantasy-muted">{quest.description}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                );

                return (
                <div className="flex h-screen flex-col overflow-hidden bg-fantasy-dark">
                    <WorldCounter />

                    <main className="flex flex-1 flex-col lg:flex-row overflow-hidden">
                        {/* Mobile: Map on top (collapsible? sticky?), Desktop: Map on left */}
                        <div className="flex-1 overflow-auto bg-black p-4 lg:w-2/3">
                            <div className="sticky top-0 z-10 mb-4 bg-fantasy-dark/80 p-2 backdrop-blur lg:hidden text-center text-xs text-fantasy-accent">
                                Scroll down for Map
                            </div>

                            <div className="mb-6 lg:mb-0">
                                <div className="mb-2 flex items-center gap-2 lg:hidden">
                                    <span className="h-8 w-8 rounded-full bg-fantasy-gold flex items-center justify-center text-fantasy-dark font-bold">{player.id}</span>
                                    <h1 className="text-xl font-bold">{player.name}</h1>
                                </div>

                                {/* Character Sheet Area for Mobile/Desktop */}
                                <div className="h-auto lg:h-full flex flex-col gap-4">
                                    {/* On desktop, we want map on left, sheet on right? User asked for layout. 
                   Let's put map in center/left and sheet on right sidebar.
               */}
                                    <MapComponent />
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar: Character Sheet */}
                        <div className="flex w-full flex-col border-l border-fantasy-muted/20 bg-fantasy-bg/50 backdrop-blur lg:w-[400px]">
                            <div className="hidden border-b border-fantasy-muted/20 p-4 lg:flex items-center gap-3 bg-fantasy-bg">
                                <span className="h-10 w-10 rounded-full bg-fantasy-gold flex items-center justify-center text-fantasy-dark font-bold text-lg">{player.id}</span>
                                <div>
                                    <h1 className="text-xl font-bold leading-tight">{player.name}</h1>
                                    <p className="text-xs text-fantasy-muted">{player.race} {player.class} • Lvl {player.level}</p>
                                </div>
                            </div>

                            <Tabs
                                tabs={[
                                    { label: "Stats", content: <StatsTab /> },
                                    { label: "Inv", content: <InventoryTab /> },
                                    { label: "Party", content: <PartyTab /> },
                                    { label: "Quests", content: <QuestTab /> },
                                ]}
                            />
                        </div>
                    </main>
                </div>
                );
}

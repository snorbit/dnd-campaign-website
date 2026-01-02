"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCampaign } from '@/context/CampaignContext';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { players } = useCampaign();
    const [selectedPlayerId, setSelectedPlayerId] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const player = players.find(p => p.id === selectedPlayerId);

        if (!player) {
            setError("Please select a player.");
            return;
        }

        if (player.password && player.password !== password) {
            setError("Incorrect password.");
            return;
        }

        // Success - store auth in localStorage/Cookie
        // For simplicity, just store "auth-playerId"
        localStorage.setItem(`auth-${selectedPlayerId}`, "true");
        router.push(`/player/${selectedPlayerId}`);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-fantasy-dark p-4">
            <div className="w-full max-w-md rounded-lg border border-fantasy-muted/20 bg-fantasy-bg p-8 shadow-2xl">
                <h1 className="mb-6 text-center text-3xl font-bold text-fantasy-gold flex items-center justify-center gap-2">
                    <Lock size={28} />
                    Player Login
                </h1>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-fantasy-muted">Select Hero</label>
                        <div className="grid grid-cols-2 gap-2">
                            {players.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSelectedPlayerId(p.id)}
                                    className={`rounded border px-4 py-2 text-sm font-bold transition-colors ${selectedPlayerId === p.id
                                            ? "border-fantasy-gold bg-fantasy-gold text-fantasy-dark"
                                            : "border-fantasy-muted/20 bg-black/40 text-fantasy-muted hover:text-fantasy-text"
                                        }`}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedPlayerId && (
                        <div>
                            <label className="mb-2 block text-sm font-bold text-fantasy-muted">Password / PIN</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded border border-fantasy-muted/20 bg-black/40 px-4 py-3 text-center text-xl tracking-widest focus:border-fantasy-gold focus:outline-none"
                                placeholder="****"
                            />
                        </div>
                    )}

                    {error && <p className="text-center text-sm text-red-500">{error}</p>}

                    <button
                        type="submit"
                        disabled={!selectedPlayerId}
                        className="w-full rounded bg-fantasy-accent py-3 font-bold text-fantasy-dark hover:brightness-110 disabled:opacity-50"
                    >
                        Enter Campaign
                    </button>
                </form>
            </div>
        </div>
    );
}

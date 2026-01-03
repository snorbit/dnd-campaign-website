import fs from 'fs';
import path from 'path';

async function getPlayers() {
    try {
        // Read directly from the file system at build/runtime
        const filePath = path.join(process.cwd(), 'data', 'players.json');
        if (!fs.existsSync(filePath)) return [];
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (e) {
        console.error("Error reading players.json", e);
        return [];
    }
}

export default async function Home() {
    // Dynamic import of players
    const players = await getPlayers();

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center bg-fantasy-dark relative overflow-hidden">
            {/* Background ambiance */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" />

            <div className="z-10 bg-black/40 p-12 rounded-xl backdrop-blur-md border border-fantasy-gold/20 shadow-2xl">
                <h1 className="text-5xl font-serif font-bold mb-2 text-fantasy-gold">Campaign Portal</h1>
                <p className="text-fantasy-muted mb-8 italic">Choose your destiny or guide the fate of others.</p>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* DM Portal */}
                    <div className="flex-1 flex flex-col gap-4 w-full">
                        <span className="text-xs text-fantasy-gold uppercase tracking-[0.2em] border-b border-fantasy-gold/20 pb-2 mb-2">Dungeon Master</span>
                        <a href="/dm" className="group relative overflow-hidden rounded-lg bg-fantasy-gold/10 border border-fantasy-gold/50 px-8 py-6 font-bold text-fantasy-gold hover:bg-fantasy-gold hover:text-black transition-all duration-300">
                            <span className="relative z-10 font-serif text-xl">Enter as DM</span>
                            <div className="absolute inset-0 bg-fantasy-gold/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </a>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px bg-fantasy-muted/20 self-stretch mx-4" />

                    {/* Players Portal */}
                    <div className="flex flex-col gap-4 w-full md:min-w-[300px]">
                        <span className="text-xs text-fantasy-muted uppercase tracking-[0.2em] border-b border-fantasy-muted/20 pb-2 mb-2">Player Characters</span>

                        {players.length === 0 ? (
                            <div className="text-red-400 text-sm italic">No players found in database.</div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {players.map((p: any) => (
                                    <a key={p.id} href={`/player/${p.id}`} className="group flex items-center justify-between rounded-lg bg-black/40 border border-white/5 px-4 py-3 hover:border-fantasy-gold/50 hover:bg-white/5 transition-all">
                                        <div className="flex flex-col items-start">
                                            <span className="font-serif font-bold text-fantasy-text group-hover:text-fantasy-gold transition-colors">{p.name}</span>
                                            <span className="text-[10px] text-fantasy-muted uppercase">{p.race} {p.class}</span>
                                        </div>
                                        <div className="h-2 w-2 rounded-full bg-fantasy-muted group-hover:bg-green-400 transition-colors shadow-lg shadow-green-400/0 group-hover:shadow-green-400/50" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

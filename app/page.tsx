export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
            <h1 className="text-4xl font-bold mb-8 text-fantasy-accent">D&D Campaign Portal</h1>
            <div className="flex gap-4">
                <a href="/dm" className="rounded-lg bg-fantasy-gold px-8 py-4 font-bold text-fantasy-dark hover:brightness-110">
                    Enter as DM
                </a>
                <div className="flex flex-col gap-2">
                    <span className="text-sm text-fantasy-muted uppercase tracking-widest">Players</span>
                    <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((id) => (
                            <a key={id} href={`/player/${id}`} className="rounded-lg border border-fantasy-muted px-4 py-2 hover:border-fantasy-accent hover:text-fantasy-accent">
                                Player {id}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}

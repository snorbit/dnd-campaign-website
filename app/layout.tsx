import type { Metadata } from 'next';
import { Inter, Cinzel } from 'next/font/google';
import './globals.css';
import { CampaignProvider } from '@/context/CampaignContext';
import fs from 'fs';
import path from 'path';
import DiceRoller from '@/components/DiceRoller';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' });

export const metadata: Metadata = {
    title: 'D&D Campaign Architect',
    description: 'Real-time D&D Campaign Dashboard',
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

async function getPlayers() {
    // Try to load from data/players.json
    // Fallback to empty array if fails
    try {
        const filePath = path.join(process.cwd(), 'data', 'players.json');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(fileContents);
    } catch (error) {
        console.warn("Could not load players.json:", error);
        return [];
    }
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const players = await getPlayers();

    return (
        <html lang="en">
            <body className={`${inter.variable} ${cinzel.variable} font-sans bg-fantasy-dark text-fantasy-text`}>
                <CampaignProvider initialPlayers={players}>
                    {children}
                    <DiceRoller />
                </CampaignProvider>
            </body>
        </html>
    );
}

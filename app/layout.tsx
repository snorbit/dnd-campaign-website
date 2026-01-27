import type { Metadata, Viewport } from 'next';
import { Inter, Cinzel } from 'next/font/google';
import './globals.css';
import { CampaignProvider } from '@/context/CampaignContext';
import fs from 'fs';
import path from 'path';
import { DiceRoller } from '@/components/shared/DiceRoller';
import { ToastProvider } from '@/components/shared/ui/ToastProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' });

export const metadata: Metadata = {
    title: 'SessionForge - D&D Campaign Manager',
    description: 'The Ultimate D&D Campaign Platform',
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/favicon.ico', sizes: '32x32' },
            { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
        ],
        apple: '/apple-touch-icon.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'SessionForge',
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
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
                    <ToastProvider />
                </CampaignProvider>
            </body>
        </html>
    );
}

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/shared/ui/ToastProvider';

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

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="font-sans bg-fantasy-dark text-fantasy-text">
                {children}
                <ToastProvider />
            </body>
        </html>
    );
}

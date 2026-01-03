import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./context/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-inter)'],
                serif: ['var(--font-cinzel)'],
            },
            colors: {
                fantasy: {
                    dark: "#0a0a0f", // Deep Void
                    bg: "#1a1a24",   // Lighter Void
                    accent: "#ffd700", // Gold
                    text: "#eaeaea",
                    muted: "#6b7280",
                    gold: "#d4af37", // Metallic Gold
                    red: "#ef4444",
                    blue: "#3b82f6",
                }
            },
        },
    },
    plugins: [],
};
export default config;

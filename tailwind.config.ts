import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./context/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                fantasy: {
                    dark: "#0f0e17",
                    bg: "#2b2c34",
                    accent: "#ff8906",
                    text: "#fffffe",
                    muted: "#a7a9be",
                    gold: "#f25f4c",
                }
            },
        },
    },
    plugins: [],
};
export default config;

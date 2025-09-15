// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
    theme: {
        container: { center: true, padding: "1rem" },
        extend: {
            colors: {
                brand: {
                    50: "#f5f8ff",
                    100: "#e9f0ff",
                    200: "#d6e2ff",
                    300: "#b3c8ff",
                    400: "#7fa0ff",
                    500: "#4c78ff", // primary
                    600: "#365cee",
                    700: "#2b49c2",
                    800: "#233a98",
                    900: "#1d3177",
                },
                ink: {
                    50: "#fafafa",
                    100: "#f5f5f5",
                    200: "#e5e7eb",
                    300: "#d1d5db",
                    400: "#9ca3af",
                    500: "#6b7280",
                    600: "#4b5563",
                    700: "#374151",
                    800: "#1f2937",
                    900: "#111827",
                },
            },
            borderRadius: {
                xl: "0.75rem",
                "2xl": "1rem",
            },
            boxShadow: {
                card:
                    "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.12)",
            },
        },
    },
    plugins: [],
};

export default config;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        accent: "#10b981",
        background: "#f3f4f6",
        foreground: "#1f2937",
        card: "#ffffff",
        muted: "#f9fafb",
        mutedForeground: "#6b7280",
        destructive: "#ef4444",
        border: "#e5e7eb",
      },
    },
  },
  plugins: [],
}
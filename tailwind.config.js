/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        // Symmetric glow (no vertical offset) to avoid "shadow band" between sections
        glow: "0 0 0 1px rgba(88,176,255,0.30), 0 0 42px rgba(88,176,255,0.18)",
        glowStrong:
          "0 0 0 1px rgba(88,176,255,0.38), 0 0 70px rgba(88,176,255,0.24)",
      },
      colors: {
        ink: "#0B0A10",
        accent: "#58B0FF",
      },
      fontFamily: {
        bounded: ["Bounded", "system-ui", "sans-serif"],
        sans: [
          "Montserrat",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "tarot-radial":
          "radial-gradient(1200px circle at 20% 10%, rgba(88,176,255,0.14), transparent 50%), radial-gradient(900px circle at 80% 30%, rgba(88,176,255,0.10), transparent 55%), radial-gradient(700px circle at 50% 85%, rgba(88,176,255,0.08), transparent 55%)",
      },
    },
  },
  plugins: [],
};



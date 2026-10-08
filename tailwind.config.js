/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        movi: {
          yellow: {
            DEFAULT: "#FFD600",
            hover: "#F0C800",
            active: "#E0BB00",
            light: "#FFFCE6",
            muted: "#FFF8CC",
          },
          graphite: {
            DEFAULT: "#111111",
            hover: "#1A1A1A",
            active: "#222222",
            subtle: "#161616",
            border: "#262626",
          },
          white: "#FFFFFF",
          neutral: "#E7E7E7",
        },
        bg: {
          main: "#F7F7F5",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F3F3F1",
          hover: "#EFEFEA",
        },
        border: {
          DEFAULT: "#E8E8E6",
          strong: "#D4D4D0",
          graphite: "#2A2A2A",
        },
        text: {
          primary: "#111111",
          secondary: "#737373",
          muted: "#9CA3AF",
          inverse: "#FFFFFF",
        },
        status: {
          success: {
            DEFAULT: "#16834A",
            bg: "#E8F5E9",
            border: "#A7E8BD",
          },
          warning: {
            DEFAULT: "#D97706",
            bg: "#FFFBEB",
            border: "#FDE68A",
          },
          danger: {
            DEFAULT: "#DC2626",
            bg: "#FEF2F2",
            border: "#FECACA",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Poppins", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)",
        dropdown: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
        yellowGlow: "0 0 16px -2px rgba(255, 214, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

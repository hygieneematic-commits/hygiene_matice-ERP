/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4338ca",
          700: "#3730a3",
          800: "#312e81",
          900: "#1e1b4b",
        },
        aqua: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
        },
        surface: {
          bg: "#F7F9FC",
          card: "#FFFFFF",
          border: "#E7EAF3",
          borderStrong: "#D8DCEC",
        },
        ink: {
          900: "#0F172A",
          700: "#334155",
          500: "#64748B",
          400: "#94A3B8",
        },
        success: {
          50: "#ecfdf5",
          500: "#10B981",
          600: "#059669",
        },
        warning: {
          50: "#fffbeb",
          500: "#F59E0B",
          600: "#D97706",
        },
        danger: {
          50: "#fff1f2",
          500: "#E11D48",
          600: "#BE123C",
        },
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)",
        card: "0 2px 4px rgba(15, 23, 42, 0.03), 0 8px 24px rgba(15, 23, 42, 0.05)",
        cardHover: "0 4px 10px rgba(15, 23, 42, 0.05), 0 16px 36px rgba(76, 61, 220, 0.10)",
        glow: "0 0 0 1px rgba(99, 102, 241, 0.08), 0 8px 30px rgba(67, 56, 202, 0.15)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #4338CA 0%, #6366F1 45%, #06B6D4 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgba(67,56,202,0.08) 0%, rgba(6,182,212,0.08) 100%)",
        "mesh-light": "radial-gradient(at 0% 0%, rgba(99,102,241,0.10) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(6,182,212,0.10) 0px, transparent 50%)",
      },
      borderRadius: {
        xl2: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        "liquid-fill": "liquidFill 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideUp: { "0%": { opacity: 0, transform: "translateY(8px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        liquidFill: { "0%": { transform: "scaleY(0)" }, "100%": { transform: "scaleY(1)" } },
      },
    },
  },
  plugins: [],
};

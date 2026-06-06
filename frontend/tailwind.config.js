/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darkBg: "#F8FAFC", // Slate-50: clean medical-grade off-white background
          glassBg: "#FFFFFF", // Pure white for card surfaces
          glassBorder: "#E2E8F0", // Slate-200: subtle divider borders
          glassHighlight: "#F1F5F9", // Slate-100: interactive hover background
          neonBlue: "#1E3A8A", // Surgical Blue: primary branding and CTAs
          neonPurple: "#4F46E5", // Indigo-600: secondary action/focus
          neonCyan: "#0EA5E9", // Sky-500: telemetry secondary indicators
          danger: "#EF4444", // Red-500: critical semantic errors
          warning: "#F59E0B", // Amber-500: warning/alert
          success: "#10B981" // Emerald-500: safe status
        }
      },
      boxShadow: {
        glass: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)", // Subtle micro drop shadow
        glowBlue: "0 0 0 1px rgba(30, 58, 138, 0.1)", // Flat borders instead of glows
        glowRed: "0 0 0 1px rgba(239, 68, 68, 0.1)",
        glowGreen: "0 0 0 1px rgba(16, 185, 129, 0.1)"
      },
      backdropBlur: {
        glass: "12px"
      }
    },
  },
  plugins: [],
}

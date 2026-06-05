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
          darkBg: "#0B0F19",
          glassBg: "rgba(17, 25, 40, 0.75)",
          glassBorder: "rgba(255, 255, 255, 0.08)",
          glassHighlight: "rgba(255, 255, 255, 0.03)",
          neonBlue: "#00E5FF",
          neonPurple: "#7B1FA2",
          neonCyan: "#00F2FE",
          danger: "#FF4646",
          warning: "#FFAF00",
          success: "#00E676"
        }
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glowBlue: "0 0 15px rgba(0, 229, 255, 0.4)",
        glowRed: "0 0 15px rgba(255, 70, 70, 0.4)",
        glowGreen: "0 0 15px rgba(0, 230, 118, 0.4)"
      },
      backdropBlur: {
        glass: "12px"
      }
    },
  },
  plugins: [],
}

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
          darkBg: "#F8FAFC", // Sterile off-white base background
          panel: "#FFFFFF", // Flat panel base
          border: "#E2E8F0", // Slate-200 subtle divider
          accent: "#0284c7", // Restrained steel blue accent
          muted: "#64748B", // Desaturated slate gray for labels
          danger: "#EF4444", // Reserved for critical thermal errors
          warning: "#F59E0B", // Reserved for warnings/alerts
          success: "#10B981" // Reserved for stable/normal states
        }
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '4px',
        'lg': '4px',
      },
      boxShadow: {
        flat: "none",
        glass: "none",
        glowBlue: "none",
        glowRed: "none",
        glowGreen: "none"
      }
    },
  },
  plugins: [],
}

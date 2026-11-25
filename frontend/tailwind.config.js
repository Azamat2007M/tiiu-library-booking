/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          bg: "#FDFBF7",
          card: "#FFFFFF",
          border: "#EFEAE1",
          borderDark: "#E2DBD0",
        },
        oak: {
          950: "#141210",
          900: "#1C1917",
          850: "#24201D",
          800: "#292524",
          700: "#44403C",
          600: "#57534E",
          500: "#78716C",
          300: "#D6D3D1",
          200: "#E7E5E4",
          100: "#F5F5F4",
        },
        amber: {
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
      },
      boxShadow: {
        paper: "0 2px 8px rgba(28, 25, 23, 0.04)",
        card: "0 4px 16px rgba(28, 25, 23, 0.06)",
      },
    },
  },
  plugins: [],
};

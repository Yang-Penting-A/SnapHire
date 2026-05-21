import type { Config } from "tailwindcss";

const config: Config = {
  // Memberitahu Tailwind di mana saja letak kode HTML/React kita
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#F0F4FC',  // Warna background kotak icon
          500: '#2670E8', // Biru medium (untuk logo di footer)
          600: '#1E62D0', // Warna utama (Tombol, Teks, dll)
          700: '#154A9E', // Warna saat tombol di-hover
        }
      }
    },
  },
  plugins: [],
};

export default config;
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  server: {
    host: true,
    allowedHosts: true,
  },

  preview: {
    host: true,
    allowedHosts: "all",
  },
  server: {
    proxy: {
      "/buckets": "http://localhost:3000"
    },
  },
});

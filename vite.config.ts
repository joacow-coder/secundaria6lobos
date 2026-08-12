import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  base: "/",
  plugins: [
    tsconfigPaths(),
    TanStackRouterVite({
      autoCodeSplitting: true,
      target: "react", // Forzar renderizado de cliente
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
  define: {
    // Evita errores si alguna librería busca variables globales de Node
    "process.env": {},
  },
});

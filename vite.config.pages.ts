import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Static build for GitHub Pages (project page served under /first-teaching/).
// This config is intentionally separate from vite.config.ts (used by Vercel)
// so the two deployments never interfere. The base path can be overridden via
// PAGES_BASE for forks/renames.
const base = process.env.PAGES_BASE ?? "/first-teaching/";

export default defineConfig({
  base,
  define: {
    "import.meta.env.VITE_STATIC_BUILD": JSON.stringify("true"),
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/pages"),
    emptyOutDir: true,
  },
});

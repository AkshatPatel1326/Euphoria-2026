import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

import fs from "fs";

// Plugin to serve assets from public/assets with full URL-decoding, legacy aliases, and case-insensitive fallback
function assetServingPlugin() {
  const legacyAliases: Record<string, string> = {
    "/assets/Arm_Wrestling_2.jpg": "Arm wresteling.jpg",
    "/assets/Arm_Wresteling_2.jpg": "Arm wresteling.jpg",
    "/assets/Arm_Wresteling.jpg": "Arm wresteling.jpg",
    "/assets/Arm_Wrestling.jpg": "Arm wresteling.jpg",
    "/assets/Arm Wrestling.png": "Arm wresteling.jpg",
    "/assets/Arm Wresteling.png": "Arm wresteling.jpg",
    "/assets/Badminton_Female_2.jpg": "Badminton Female.jpg",
    "/assets/Badminton_Female.jpg": "Badminton Female.jpg",
    "/assets/Badminton_Womens.jpg": "Badminton Female.jpg",
    "/assets/Badminton FM.png": "Badminton Female.jpg",
    "/assets/Badminton Female.png": "Badminton Female.jpg",
    "/assets/Badminton_Male_2.jpg": "badminton male.jpg",
    "/assets/Badminton_Male.jpg": "badminton male.jpg",
    "/assets/Badminton_Mens.jpg": "badminton male.jpg",
    "/assets/Badminton M.png": "badminton male.jpg",
    "/assets/Badminton Male.png": "badminton male.jpg",
    "/assets/Badminton Male.jpg": "badminton male.jpg",
    "/assets/Carrom_2.jpg": "Carrom.jpg",
    "/assets/Carrom.png": "Carrom.jpg",
    "/assets/Chess_2.jpg": "Chess.jpg",
    "/assets/Chess.png": "Chess.jpg",
    "/assets/Cricket_2.jpg": "Cricket.jpg",
    "/assets/Cricket.png": "Cricket.jpg",
    "/assets/Football_2.jpg": "Footaball.jpg",
    "/assets/Footbal.png": "Footaball.jpg",
    "/assets/Football.png": "Footaball.jpg",
    "/assets/Football.jpg": "Footaball.jpg",
    "/assets/Kabaddi_2.jpg": "Kabbadi.jpg",
    "/assets/Kabbadi_2.jpg": "Kabbadi.jpg",
    "/assets/Kabaddi.jpg": "Kabbadi.jpg",
    "/assets/Kabaddi.png": "Kabbadi.jpg",
    "/assets/Kabbadi.png": "Kabbadi.jpg",
    "/assets/Power_Lifting_2.jpg": "Power lifting.jpg",
    "/assets/Power_Lifting.jpg": "Power lifting.jpg",
    "/assets/Power Lifting.png": "Power lifting.jpg",
    "/assets/Tabble_Tennis_2.jpg": "Table tennis.jpg",
    "/assets/Table_Tennis_2.jpg": "Table tennis.jpg",
    "/assets/Table_Tennis.jpg": "Table tennis.jpg",
    "/assets/Table Tennis.png": "Table tennis.jpg",
    "/assets/Volleyball_2.jpg": "Volleyball.jpg",
    "/assets/Volleyball.png": "Volleyball.jpg",
  };

  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".gif": "image/gif",
  };

  return {
    name: "asset-serving-plugin",
    configureServer(server: any) {
      const publicAssetsDir = path.resolve(__dirname, "public/assets");

      server.middlewares.use((req: any, res: any, next: any) => {
        if (!req.url || !req.url.startsWith("/assets/")) {
          return next();
        }

        try {
          const rawPath = req.url.split("?")[0];
          const decodedPath = decodeURIComponent(rawPath);

          // 1. Check legacy alias map
          let targetFilename = legacyAliases[decodedPath] || legacyAliases[rawPath];

          // 2. If no legacy alias, extract filename
          if (!targetFilename) {
            targetFilename = decodedPath.replace(/^\/assets\//, "");
          }

          let filePath = path.join(publicAssetsDir, targetFilename);

          // 3. If exact file doesn't exist, try case-insensitive disk lookup
          if (!fs.existsSync(filePath)) {
            const diskFiles = fs.readdirSync(publicAssetsDir);
            const lowerTarget = targetFilename.toLowerCase();
            const matched = diskFiles.find((f) => f.toLowerCase() === lowerTarget);
            if (matched) {
              filePath = path.join(publicAssetsDir, matched);
            }
          }

          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = mimeTypes[ext] || "application/octet-stream";
            res.setHeader("Content-Type", contentType);
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            const stream = fs.createReadStream(filePath);
            return stream.pipe(res);
          }
        } catch {
          // If any error, pass through to next middleware
        }

        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), assetServingPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force a single copy of React across all packages.
    dedupe: ["react", "react/jsx-runtime", "react-dom", "react-dom/client"],
  },
  build: {
    // Enable source maps for better debugging (disable in production if needed)
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and lazy loading
        manualChunks: {
          // Vendor chunks for large libraries
          'react-vendor': ['react', 'react-dom', 'react-router'],
          // Large UI library chunks
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-tooltip',
          ],
          // Heavy optional libraries - separate chunks for better lazy loading
          'framer-motion': ['framer-motion'],
          'charts': ['recharts'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
        // Optimize chunk size
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit for better chunking
    chunkSizeWarningLimit: 1000,
    // Target modern browsers for better optimization
    target: 'esnext',
    // Minify options - using esbuild (faster than terser)
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    // Only scan the app entry HTML; avoids crawling unrelated *.html files
    // if a legacy snapshot accidentally contains leaked package folders.
    entries: ['index.html'],
    include: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router',
      'framer-motion',
    ],
  },
  // Performance hints
  server: {
    // Bind to all interfaces so WebContainer's server-ready event fires.
    host: true,
    port: 5173,
    // Keep HMR on, but disable full-screen error overlay
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});

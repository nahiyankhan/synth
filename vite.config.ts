import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { copyFileSync, mkdirSync } from "fs";

// Plugin to copy data files from data/ to public/data/
function copyDataPlugin() {
  let isProcessing = false; // Debounce flag
  
  return {
    name: "copy-data",
    buildStart() {
      // Ensure public/data directory exists
      mkdirSync("public/data", { recursive: true });

      // Copy the design system file
      copyFileSync(
        "data/design-system.json",
        "public/data/design-system.json"
      );
      console.log("✓ Copied design-system.json to public/data/");
    },
    configureServer(server) {
      // Watch the source file and trigger copy + reload on changes
      server.watcher.add("data/design-system.json");
      server.watcher.on("change", (file) => {
        // Only process source file changes, ignore public directory
        if (file.includes("data/design-system.json") && 
            !file.includes("public/data") &&
            !isProcessing) {
          isProcessing = true;
          
          copyFileSync(
            "data/design-system.json",
            "public/data/design-system.json"
          );
          console.log("✓ Re-copied design-system.json");
          server.ws.send({ type: "full-reload" });
          
          // Reset flag after a short delay
          setTimeout(() => {
            isProcessing = false;
          }, 100);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      // Proxy API requests to the Hono server in development
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
    plugins: [
      copyDataPlugin(),
      react(),
      tailwindcss(),
    ],
    // No API keys exposed to client - keys are passed via headers from localStorage
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

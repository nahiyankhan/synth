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
  
  // Set environment variables for server-side code (middleware)
  if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY;
  if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      copyDataPlugin(),
      react(),
      tailwindcss(),
      {
        name: 'api-middleware',
        async configureServer(server) {
          // Import and register API middleware
          const { createApiMiddleware } = await import('./src/server/api.ts');
          server.middlewares.use(createApiMiddleware());
        },
      },
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.OPENAI_API_KEY": JSON.stringify(env.OPENAI_API_KEY),
      "process.env.ANTHROPIC_API_KEY": JSON.stringify(env.ANTHROPIC_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

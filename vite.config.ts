import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig({
  plugins: [
    // Must come before react() so Start can transform server functions and routes.
    tanstackStart({
      // Use `src/server.ts` as the server entry (our SSR error wrapper).
      server: { entry: "server" },
    }),
    react(),
    tsconfigPaths(),
    tailwindcss(),
    nitro({
      compressPublicAssets: true,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom")) return "react-dom";
          if (id.includes("node_modules/react/")) return "react";
          if (id.includes("node_modules/@tanstack/react-router")) return "tanstack-router";
          if (id.includes("node_modules/@tanstack/react-query")) return "tanstack-query";
          if (id.includes("node_modules/embla-carousel")) return "embla";
          if (id.includes("node_modules/react-day-picker") || id.includes("node_modules/date-fns")) {
            return "calendar";
          }
          if (id.includes("node_modules/@radix-ui")) return "radix";
        },
      },
    },
  },
});

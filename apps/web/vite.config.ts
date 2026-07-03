import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // 相対パスが嫌なので、 "@/..." で src 以下を参照できるようにする
      // tsconfig.json にも書いてるけど、それだけだと vite で動かないのでこっちにも必要
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    license: true,
    // @asb-ts/core が大きいのでごまかす
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "@asb-ts/core",
              test: /node_modules/,
            },
          ],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5174,
    watch: {
      // devcontainer内で動かすときはファイル変更を監視するために必要
      usePolling: true,
    },
  },
});

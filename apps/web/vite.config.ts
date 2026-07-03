import path from "node:path";
import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import license from "rollup-plugin-license";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/ASB-web/",
  resolve: {
    alias: {
      // 相対パスが嫌なので、 "@/..." で src 以下を参照できるようにする
      // tsconfig.json にも書いてるけど、それだけだと vite で動かないのでこっちにも必要
      "@": path.resolve(__dirname, "./src"),
      "asb-wasm": path.resolve(__dirname, "../asb-wasm"),
    },
  },
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react({
      plugins: [["@lingui/swc-plugin", {}]],
    }),
    lingui(),
    tailwindcss(),
    license({
      sourcemap: true,
      thirdParty: {
        includePrivate: true,
        multipleVersions: true,
        output: {
          file: path.join(__dirname, "dist", "license.txt"),
          encoding: "utf-8",
        },
      },
    }),
  ],
  build: {
    // asb-ts が大きいのでごまかす
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "asb-ts",
              test: "asb-ts",
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

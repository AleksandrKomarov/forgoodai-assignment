import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { mockApiPlugin } from "./src/mock/api-plugin";

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});

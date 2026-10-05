import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { canonicalTestFilesForInvocation } from "./src/test/canonical-test-files";
import { editorialEngineRoot } from "./src/test/editorial-engine-root";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: canonicalTestFilesForInvocation(__dirname, process.argv.slice(2)),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@editorial-engine/core": path.join(editorialEngineRoot(__dirname), "packages/core/src/index.mjs"),
    },
  },
});

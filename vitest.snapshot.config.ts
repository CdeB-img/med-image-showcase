import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";

const root = process.cwd();
export default defineConfig({
  root,
  plugins: [react()],
  resolve: { alias: { "@": path.join(root, "src") } },
  test: { environment: "jsdom", globals: true, setupFiles: [path.join(root, "src/test/setup.ts")],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"] },
});

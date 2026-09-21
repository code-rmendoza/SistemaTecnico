import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["e2e/**", "**/node_modules/**", ".opencode/**", ".claude/**", ".agents/**"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/modules/**"],
      exclude: ["e2e/**", "src/app/**", "prisma/**"],
      thresholds: { lines: 80, functions: 80 }
    }
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") }
  }
});

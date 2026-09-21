import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 5"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } }
  ]
});

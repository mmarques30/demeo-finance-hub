import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30000,
  use: {
    baseURL: process.env.APP_URL || "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
  },
  reporter: [["list"], ["html", { outputFolder: "tests/e2e/report", open: "never" }]],
});

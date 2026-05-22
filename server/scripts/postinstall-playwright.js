import { execSync } from "child_process";

// Skip Chromium download on Render (uses HTTP fetch scraper instead).
if (process.env.RENDER === "true" || process.env.SKIP_PLAYWRIGHT === "true") {
    console.log("[postinstall] Skipping Playwright browser install (RENDER or SKIP_PLAYWRIGHT set).");
    process.exit(0);
}

console.log("[postinstall] Installing Playwright Chromium...");
execSync("npx playwright install chromium", { stdio: "inherit" });

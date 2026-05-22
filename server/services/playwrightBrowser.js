import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FINGERPRINTS = [
    {
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        secChUa: '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
        viewport: { width: 1920, height: 1080 },
        screen: { width: 1920, height: 1080 },
    },
    {
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        secChUa: '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
        viewport: { width: 1536, height: 864 },
        screen: { width: 1536, height: 864 },
    },
    {
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        secChUa: '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        viewport: { width: 1366, height: 768 },
        screen: { width: 1366, height: 768 },
    },
];

const CHROME_ARGS = [
    "--disable-blink-features=AutomationControlled",
    "--disable-features=IsolateOrigins,site-per-process,AutomationControlled",
    "--disable-infobars",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-sandbox",
    "--disable-dev-shm-usage",
];

function pickFingerprint() {
    const base = FINGERPRINTS[Math.floor(Math.random() * FINGERPRINTS.length)];
    return {
        ...base,
        locale: "en-US",
        timezoneId: "America/New_York",
        languages: ["en-US", "en"],
        acceptLanguage: "en-US,en;q=0.9",
        platform: "Win32",
        hardwareConcurrency: 8,
        deviceMemory: 8,
        maxTouchPoints: 0,
        deviceScaleFactor: 1,
        colorScheme: "light",
    };
}

function resolveChromeChannel() {
    if (process.env.PLAYWRIGHT_CHANNEL) return process.env.PLAYWRIGHT_CHANNEL;
    if (process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === "true") return "chrome";
    return undefined;
}

async function applyStealthScripts(context, fingerprint) {
    await context.addInitScript((fp) => {
        Object.defineProperty(navigator, "webdriver", { get: () => undefined });

        if (!window.chrome) {
            window.chrome = { runtime: {}, loadTimes: () => ({}), csi: () => ({}) };
        }

        Object.defineProperty(navigator, "languages", { get: () => fp.languages, configurable: true });
        Object.defineProperty(navigator, "platform", { get: () => fp.platform, configurable: true });
        Object.defineProperty(navigator, "hardwareConcurrency", { get: () => fp.hardwareConcurrency, configurable: true });
        Object.defineProperty(navigator, "deviceMemory", { get: () => fp.deviceMemory, configurable: true });
        Object.defineProperty(navigator, "maxTouchPoints", { get: () => fp.maxTouchPoints, configurable: true });

        const pluginData = [
            { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer", description: "Portable Document Format" },
            { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai", description: "" },
        ];
        const pluginArray = Object.create(PluginArray.prototype);
        pluginData.forEach((p, i) => {
            const plugin = Object.create(Plugin.prototype);
            Object.defineProperties(plugin, {
                name: { value: p.name },
                filename: { value: p.filename },
                description: { value: p.description },
                length: { value: 0 },
            });
            pluginArray[i] = plugin;
        });
        Object.defineProperty(pluginArray, "length", { value: pluginData.length });
        Object.defineProperty(navigator, "plugins", { get: () => pluginArray, configurable: true });
    }, fingerprint);
}

/** Random delay mimicking human pacing (ms). */
export function humanDelay(minMs = 300, maxMs = 900) {
    const ms = Math.floor(minMs + Math.random() * (maxMs - minMs + 1));
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Headless Chromium session for SEO page scraping. */
export async function acquireEphemeralScraperPage() {
    const fingerprint = pickFingerprint();
    const launchOptions = {
        headless: process.env.PLAYWRIGHT_HEADLESS !== "false",
        args: [...CHROME_ARGS, `--window-size=${fingerprint.viewport.width},${fingerprint.viewport.height}`],
        ignoreDefaultArgs: ["--enable-automation"],
    };

    const executablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE;
    if (executablePath) launchOptions.executablePath = executablePath;

    const channel = resolveChromeChannel();
    if (channel && !executablePath) launchOptions.channel = channel;

    const browser = await chromium.launch(launchOptions);
    const context = await browser.newContext({
        userAgent: fingerprint.userAgent,
        viewport: fingerprint.viewport,
        screen: fingerprint.screen,
        locale: fingerprint.locale,
        timezoneId: fingerprint.timezoneId,
        deviceScaleFactor: fingerprint.deviceScaleFactor,
        colorScheme: fingerprint.colorScheme,
        extraHTTPHeaders: {
            "Accept-Language": fingerprint.acceptLanguage,
            "Sec-CH-UA": fingerprint.secChUa,
            "Sec-CH-UA-Mobile": "?0",
            "Sec-CH-UA-Platform": '"Windows"',
        },
    });

    await applyStealthScripts(context, fingerprint);
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(20000);

    return { page, browser, context };
}

export async function releaseEphemeralScraperPage(session) {
    if (!session) return;
    await session.page?.close().catch(() => {});
    await session.context?.close().catch(() => {});
    await session.browser?.close().catch(() => {});
}

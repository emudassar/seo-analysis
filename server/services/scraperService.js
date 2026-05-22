import {
    acquireEphemeralScraperPage,
    releaseEphemeralScraperPage,
    humanDelay,
} from "./playwrightBrowser.js";

/** In-page extraction script (shared by single + parallel scrapes). */
export function getPageExtractionScript() {
    return () => {
        const getMeta = (name) => {
            const el =
                document.querySelector(`meta[name="${name}"]`) ||
                document.querySelector(`meta[property="${name}"]`);
            return el ? el.getAttribute("content") || "" : "";
        };

        const title = document.title || "";
        const description = getMeta("description");
        const metaKeywords = getMeta("keywords");
        const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
        const robots = getMeta("robots");
        const ogTitle = getMeta("og:title");
        const ogDescription = getMeta("og:description");
        const ogImage = getMeta("og:image");
        const twitterCard = getMeta("twitter:card");
        const viewport = getMeta("viewport");
        const charsetMeta = document.querySelector("meta[charset]");
        const charset = charsetMeta ? charsetMeta.getAttribute("charset") || "" : "";

        const hasJsonLd = !!document.querySelector('script[type="application/ld+json"]');

        const h1Elements = document.querySelectorAll("h1");
        const h1Texts = Array.from(h1Elements).map((el) => el.textContent?.trim() || "");
        const headings = {
            h1: document.querySelectorAll("h1").length,
            h2: document.querySelectorAll("h2").length,
            h3: document.querySelectorAll("h3").length,
            h4: document.querySelectorAll("h4").length,
            h5: document.querySelectorAll("h5").length,
            h6: document.querySelectorAll("h6").length,
            h1Texts,
        };

        const allLinks = Array.from(document.querySelectorAll("a[href]"));
        const currentHost = window.location.hostname;
        let internalLinks = 0;
        let externalLinks = 0;
        allLinks.forEach((link) => {
            try {
                const href = link.href;
                if (href.startsWith("mailto:") || href.startsWith("tel:")) return;
                const linkUrl = new URL(href);
                if (linkUrl.hostname === currentHost) internalLinks++;
                else externalLinks++;
            } catch {
                // skip invalid href
            }
        });

        const allImages = Array.from(document.querySelectorAll("img"));
        const missingAlt = allImages.filter((img) => !img.alt || img.alt.trim() === "").length;

        const bodyText = document.body?.innerText || "";
        const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 0).length;
        const pageSize = document.documentElement.outerHTML.length;

        return {
            metaData: {
                title,
                description,
                metaKeywords,
                canonical,
                robots,
                ogTitle,
                ogDescription,
                ogImage,
                twitterCard,
                viewport,
                charset,
            },
            headings,
            links: { internal: internalLinks, external: externalLinks, total: allLinks.length },
            images: { total: allImages.length, missingAlt, withAlt: allImages.length - missingAlt },
            hasJsonLd,
            wordCount,
            pageSize,
            bodyText: bodyText.substring(0, 3000),
        };
    };
}

async function scrapeWithPage(page, url) {
    const startTime = Date.now();
    await humanDelay(200, 500);
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const loadTime = Date.now() - startTime;
    await humanDelay(500, 1000);

    const scrapedData = await page.evaluate(getPageExtractionScript());
    const statusCode = response?.status() || 0;

    return {
        ...scrapedData,
        loadTime,
        statusCode,
        url,
    };
}

export async function scrapeUrl(url) {
    let session;
    try {
        session = await acquireEphemeralScraperPage();
        const data = await scrapeWithPage(session.page, url);
        await releaseEphemeralScraperPage(session);
        return { success: true, data };
    } catch (error) {
        console.error("[SCRAPER] Playwright session failed:", error.message);
        if (session) await releaseEphemeralScraperPage(session).catch(() => {});
        return { success: false, error: error.message };
    }
}

/** Scrape multiple URLs in parallel (each with its own browser session). */
export async function scrapeUrlsParallel(urlEntries) {
    const settled = await Promise.allSettled(
        urlEntries.map(async ({ url, label }) => {
            const result = await scrapeUrl(url);
            return { label, url, ...result };
        })
    );

    return settled.map((outcome, index) => {
        const base = urlEntries[index];
        if (outcome.status === "fulfilled") {
            return outcome.value;
        }
        return {
            label: base.label,
            url: base.url,
            success: false,
            error: outcome.reason?.message || "Scrape failed",
        };
    });
}

import * as cheerio from "cheerio";

function getMeta($, name) {
    let el = $(`meta[name="${name}"]`).first();
    if (!el.length) el = $(`meta[property="${name}"]`).first();
    return el.attr("content") || "";
}

function extractFromHtml(html, pageUrl, loadTime, statusCode) {
    const $ = cheerio.load(html);
    const resolvedUrl = pageUrl || "";
    let hostname = "";
    try {
        hostname = new URL(resolvedUrl).hostname;
    } catch {
        // ignore
    }

    const title = $("title").first().text().trim() || "";
    const description = getMeta($, "description");
    const metaKeywords = getMeta($, "keywords");
    const canonical = $('link[rel="canonical"]').attr("href") || "";
    const robots = getMeta($, "robots");
    const ogTitle = getMeta($, "og:title");
    const ogDescription = getMeta($, "og:description");
    const ogImage = getMeta($, "og:image");
    const twitterCard = getMeta($, "twitter:card");
    const viewport = getMeta($, "viewport");
    const charset = $("meta[charset]").attr("charset") || "";

    const hasJsonLd = $('script[type="application/ld+json"]').length > 0;

    const h1Elements = $("h1");
    const h1Texts = h1Elements
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean);

    const headings = {
        h1: $("h1").length,
        h2: $("h2").length,
        h3: $("h3").length,
        h4: $("h4").length,
        h5: $("h5").length,
        h6: $("h6").length,
        h1Texts,
    };

    let internalLinks = 0;
    let externalLinks = 0;
    $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;
        try {
            const linkUrl = new URL(href, resolvedUrl);
            if (linkUrl.hostname === hostname) internalLinks++;
            else externalLinks++;
        } catch {
            // skip invalid href
        }
    });
    const totalLinks = internalLinks + externalLinks;

    const allImages = $("img");
    let missingAlt = 0;
    allImages.each((_, el) => {
        const alt = $(el).attr("alt");
        if (!alt || !alt.trim()) missingAlt++;
    });
    const imageTotal = allImages.length;

    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(/\s+/).filter((w) => w.length > 0).length;
    const pageSize = html.length;

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
        links: { internal: internalLinks, external: externalLinks, total: totalLinks },
        images: { total: imageTotal, missingAlt, withAlt: imageTotal - missingAlt },
        hasJsonLd,
        wordCount,
        pageSize,
        bodyText: bodyText.substring(0, 3000),
        loadTime,
        statusCode,
        url: resolvedUrl,
        scrapeMethod: "fetch",
    };
}

/** Lightweight HTTP scrape — works on Render without Playwright/Chromium. */
export async function scrapeWithFetch(url) {
    const startTime = Date.now();
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
            redirect: "follow",
            signal: AbortSignal.timeout(30000),
        });

        const loadTime = Date.now() - startTime;
        const pageUrl = res.url || url;

        if (!res.ok) {
            return { success: false, error: `HTTP ${res.status} for ${pageUrl}` };
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
            return { success: false, error: `Not an HTML page (${contentType || "unknown type"})` };
        }

        const html = await res.text();
        if (!html?.trim()) {
            return { success: false, error: "Empty page response" };
        }

        const data = extractFromHtml(html, pageUrl, loadTime, res.status);
        return { success: true, data };
    } catch (error) {
        console.error("[FETCH-SCRAPER] Failed:", error.message);
        return { success: false, error: error.message };
    }
}

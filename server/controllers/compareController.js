import { scrapeUrlsParallel } from "../services/scraperService.js";
import { compareCompetitorSites } from "../services/geminiService.js";

function normalizeUrl(input) {
    const href = input.startsWith("http") ? input : `https://${input}`;
    return new URL(href).href;
}

export const compareCompetitors = async (req, res) => {
    try {
        const { ownUrl, competitors = [] } = req.body;

        if (!ownUrl?.trim()) {
            return res.status(400).json({ success: false, message: "Your site URL is required" });
        }

        let ownHref;
        try {
            ownHref = normalizeUrl(ownUrl.trim());
        } catch {
            return res.status(400).json({ success: false, message: "Invalid URL for your site" });
        }

        const competitorUrls = competitors
            .filter((u) => typeof u === "string" && u.trim())
            .slice(0, 3)
            .map((u) => u.trim());

        const entries = [
            { url: ownHref, label: "Your Site" },
            ...competitorUrls.map((url, i) => {
                try {
                    return { url: normalizeUrl(url), label: `Competitor ${i + 1}` };
                } catch {
                    return null;
                }
            }).filter(Boolean),
        ];

        if (entries.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Add at least one valid competitor URL to compare",
            });
        }

        const scrapeResults = await scrapeUrlsParallel(entries);

        const successfulScrapes = scrapeResults.filter((r) => r.success && r.data);
        if (!scrapeResults.find((r) => r.label === "Your Site" && r.success)) {
            return res.status(400).json({
                success: false,
                message: "Could not scrape your site. Check the URL and try again.",
                scrapeResults,
            });
        }

        if (successfulScrapes.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Need at least two successfully scraped sites to compare",
                scrapeResults,
            });
        }

        const compareResult = await compareCompetitorSites(scrapeResults);

        if (!compareResult.success) {
            return res.status(502).json({
                success: false,
                message: compareResult.error || "AI comparison failed",
                scrapeResults,
            });
        }

        return res.json({
            success: true,
            comparison: compareResult.data,
            scrapeResults,
        });
    } catch (error) {
        console.error("[COMPARE] Error:", error.message);
        return res.status(500).json({ success: false, message: "Server error during comparison" });
    }
};

import { GoogleGenAI, Type } from "@google/genai";

const DEFAULT_MODELS = ["gemma-4-26b-a4b-it", "gemma-4-31b-it", "gemini-2.5-flash", "gemini-flash-latest"];

const seoAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.INTEGER },
        categories: {
            type: Type.OBJECT,
            properties: {
                seo: { type: Type.INTEGER },
                performance: { type: Type.INTEGER },
                accessibility: { type: Type.INTEGER },
                bestPractices: { type: Type.INTEGER },
            },
            required: ["seo", "performance", "accessibility", "bestPractices"],
        },
        keywords: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    count: { type: Type.INTEGER },
                    density: { type: Type.NUMBER },
                },
                required: ["word", "count", "density"],
            },
        },
        issues: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    severity: {
                        type: Type.STRING,
                        format: "enum",
                        enum: ["critical", "warning", "info"],
                    },
                    category: { type: Type.STRING },
                    message: { type: Type.STRING },
                    recommendation: { type: Type.STRING },
                },
                required: ["severity", "category", "message", "recommendation"],
            },
        },
    },
    required: ["overallScore", "categories", "keywords", "issues"],
};

function getModelCandidates() {
    const fromEnv = process.env.GEMINI_MODEL?.trim();
    if (fromEnv) return [fromEnv, ...DEFAULT_MODELS.filter((m) => m !== fromEnv)];
    return DEFAULT_MODELS;
}

function parseApiError(error) {
    if (!error?.message) return "AI analysis request failed";
    try {
        const parsed = JSON.parse(error.message);
        return parsed?.error?.message || error.message;
    } catch {
        return error.message;
    }
}

function extractResponseText(response) {
    if (response?.text) return response.text;
    const parts = response?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
        return parts.map((p) => p.text || "").join("");
    }
    return "";
}

function buildPrompt(scrapedData) {
    const meta = scrapedData.metaData || {};
    const headings = scrapedData.headings || {};
    const links = scrapedData.links || {};
    const images = scrapedData.images || {};

    return `You are an expert SEO analyst. Analyze the following website data and provide a comprehensive SEO audit.

Website URL: ${scrapedData.url}
Load Time: ${scrapedData.loadTime}ms
Status Code: ${scrapedData.statusCode}
Page Size: ${Math.round((scrapedData.pageSize || 0) / 1024)}KB
Word Count: ${scrapedData.wordCount}

META DATA:
- Title: "${meta.title || ""}" (${(meta.title || "").length} chars)
- Description: "${meta.description || ""}" (${(meta.description || "").length} chars)
- Canonical: "${meta.canonical || ""}"
- Robots: "${meta.robots || ""}"
- OG Title: "${meta.ogTitle || ""}"
- OG Description: "${meta.ogDescription || ""}"
- OG Image: "${meta.ogImage || ""}"
- Twitter Card: "${meta.twitterCard || ""}"
- Viewport: "${meta.viewport || ""}"
- Charset: "${meta.charset || ""}"

HEADINGS:
- H1: ${headings.h1 || 0} (texts: ${JSON.stringify(headings.h1Texts || [])})
- H2: ${headings.h2 || 0}
- H3: ${headings.h3 || 0}
- H4: ${headings.h4 || 0}
- H5: ${headings.h5 || 0}
- H6: ${headings.h6 || 0}

LINKS:
- Internal: ${links.internal || 0}
- External: ${links.external || 0}
- Total: ${links.total || 0}

IMAGES:
- Total: ${images.total || 0}
- Missing Alt Text: ${images.missingAlt || 0}
- With Alt Text: ${images.withAlt || 0}

PAGE CONTENT (first 3000 chars):
${scrapedData.bodyText || ""}

Scoring guidelines:
- Title: 50-60 chars optimal, must exist
- Description: 150-160 chars optimal, must exist
- H1: exactly 1 is ideal
- Images: all should have alt text
- Load time: <3s good, <5s ok, >5s poor
- Page size: <3MB good
- Must have viewport meta, charset, canonical
- OG tags and Twitter cards are important
- Internal linking is good for SEO
- Word count: >300 words for content pages
- Check heading hierarchy

Severity levels must be exactly one of: "critical", "warning", or "info".
Provide 5-15 issues sorted by severity (critical first). Be specific and actionable with recommendations.
Extract top 10 keywords by frequency from the page content.`;
}

export async function analyzeSeoData(scrapedData) {
    if (!process.env.GEMINI_API_KEY?.trim()) {
        return { success: false, error: "GEMINI_API_KEY is not configured in server/.env" };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = buildPrompt(scrapedData);
    const models = getModelCandidates();
    let lastError = "AI analysis failed";

    for (const model of models) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: seoAnalysisSchema,
                    },
                });

                const raw = extractResponseText(response);
                if (!raw) throw new Error("Empty response from AI model");

                const analysis = JSON.parse(raw);
                console.log(`[GEMINI] Analysis OK via ${model} (attempt ${attempt})`);
                return { success: true, data: analysis };
            } catch (error) {
                lastError = parseApiError(error);
                console.error(`[GEMINI] ${model} attempt ${attempt} failed:`, lastError);

                const retryable = /429|500|503|high demand|internal error|quota/i.test(lastError);
                if (!retryable) break;
                if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * attempt));
            }
        }
    }

    return { success: false, error: lastError };
}

const competitorCompareSchema = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        sites: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    url: { type: Type.STRING },
                    label: { type: Type.STRING },
                    scores: {
                        type: Type.OBJECT,
                        properties: {
                            onPageSeo: { type: Type.INTEGER },
                            contentDepth: { type: Type.INTEGER },
                            technicalSeo: { type: Type.INTEGER },
                            performance: { type: Type.INTEGER },
                            accessibility: { type: Type.INTEGER },
                        },
                        required: ["onPageSeo", "contentDepth", "technicalSeo", "performance", "accessibility"],
                    },
                    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["url", "label", "scores", "strengths", "weaknesses"],
            },
        },
        gaps: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    metric: { type: Type.STRING },
                    yourValue: { type: Type.STRING },
                    bestCompetitorValue: { type: Type.STRING },
                    bestCompetitorUrl: { type: Type.STRING },
                    impact: { type: Type.STRING, format: "enum", enum: ["high", "medium", "low"] },
                    fix: { type: Type.STRING },
                },
                required: ["metric", "yourValue", "bestCompetitorValue", "bestCompetitorUrl", "impact", "fix"],
            },
        },
        winner: { type: Type.STRING },
        prioritizedFixes: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ["summary", "sites", "gaps", "winner", "prioritizedFixes"],
};

function formatSiteForComparison(entry) {
    if (!entry.success || !entry.data) {
        return { label: entry.label, url: entry.url, scrapeFailed: true, error: entry.error };
    }
    const d = entry.data;
    const m = d.metaData || {};
    return {
        label: entry.label,
        url: d.url || entry.url,
        loadTimeMs: d.loadTime,
        statusCode: d.statusCode,
        pageSizeKb: Math.round((d.pageSize || 0) / 1024),
        title: m.title,
        titleLength: (m.title || "").length,
        metaDescription: m.description,
        metaDescriptionLength: (m.description || "").length,
        metaKeywords: m.metaKeywords,
        canonical: m.canonical,
        ogTitle: m.ogTitle,
        ogDescription: m.ogDescription,
        h1Count: d.headings?.h1,
        h1Texts: d.headings?.h1Texts,
        h2Count: d.headings?.h2,
        wordCount: d.wordCount,
        imagesMissingAlt: d.images?.missingAlt,
        imagesTotal: d.images?.total,
        internalLinks: d.links?.internal,
        externalLinks: d.links?.external,
        hasJsonLd: d.hasJsonLd,
        hasOgTags: !!(m.ogTitle || m.ogDescription),
    };
}

export async function compareCompetitorSites(scrapeResults) {
    if (!process.env.GEMINI_API_KEY?.trim()) {
        return { success: false, error: "GEMINI_API_KEY is not configured in server/.env" };
    }

    const payload = scrapeResults.map(formatSiteForComparison);
    const prompt = `You are an expert SEO analyst. I have scraped the following websites. Analyze and compare them fairly using only the data provided. Score each site 0-100 on: onPageSeo, contentDepth, technicalSeo, performance, accessibility.

Return a JSON object with: summary (2-3 sentences), sites (with url, label, scores, strengths array, weaknesses array), gaps (metric comparisons vs the site labeled "Your Site"), winner (best overall url), prioritizedFixes (actionable list for "Your Site").

For gaps: only include metrics where a competitor beats "Your Site". impact must be high, medium, or low.

Scraped data:
${JSON.stringify(payload)}`;

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const models = getModelCandidates();
    let lastError = "Competitor comparison failed";

    for (const model of models) {
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const response = await ai.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: prompt }] }],
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: competitorCompareSchema,
                    },
                });

                const raw = extractResponseText(response);
                if (!raw) throw new Error("Empty response from AI model");

                const comparison = JSON.parse(raw);
                console.log(`[GEMINI] Competitor compare OK via ${model}`);
                return { success: true, data: comparison };
            } catch (error) {
                lastError = parseApiError(error);
                console.error(`[GEMINI] Compare ${model} attempt ${attempt} failed:`, lastError);
                const retryable = /429|500|503|high demand|internal error|quota/i.test(lastError);
                if (!retryable) break;
                if (attempt < 2) await new Promise((r) => setTimeout(r, 1500 * attempt));
            }
        }
    }

    return { success: false, error: lastError };
}

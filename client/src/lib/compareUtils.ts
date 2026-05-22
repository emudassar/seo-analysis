export const SITE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#10b981"];

export interface ScrapeMeta {
    title?: string;
    description?: string;
    metaKeywords?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
}

export interface ScrapeData {
    url: string;
    loadTime?: number;
    metaData?: ScrapeMeta;
    headings?: { h1?: number; h2?: number; h1Texts?: string[] };
    links?: { internal?: number; external?: number };
    images?: { missingAlt?: number; total?: number };
    hasJsonLd?: boolean;
    wordCount?: number;
}

export interface ScrapeResult {
    label: string;
    url: string;
    success: boolean;
    error?: string;
    data?: ScrapeData;
}

export interface CompareScores {
    onPageSeo: number;
    contentDepth: number;
    technicalSeo: number;
    performance: number;
    accessibility: number;
}

export interface CompareSite {
    url: string;
    label: string;
    scores: CompareScores;
    strengths: string[];
    weaknesses: string[];
}

export interface CompareGap {
    metric: string;
    yourValue: string;
    bestCompetitorValue: string;
    bestCompetitorUrl: string;
    impact: "high" | "medium" | "low";
    fix: string;
}

export interface ComparisonData {
    summary: string;
    sites: CompareSite[];
    gaps: CompareGap[];
    winner: string;
    prioritizedFixes: string[];
}

export function domainFromUrl(url: string) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return url;
    }
}

export function avgScore(scores: CompareScores) {
    const v = scores.onPageSeo + scores.contentDepth + scores.technicalSeo + scores.performance + scores.accessibility;
    return Math.round(v / 5);
}

export function scoreColor(score: number) {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
}

export function scoreRingColor(score: number) {
    if (score >= 80) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
}

export type MetricRow = {
    key: string;
    label: string;
    /** lower is better for load time, missing alt */
    lowerIsBetter?: boolean;
    format: (d: ScrapeData | undefined, failed: boolean) => string;
    numeric?: (d: ScrapeData | undefined) => number | null;
};

export const METRIC_ROWS: MetricRow[] = [
    {
        key: "titleLen",
        label: "Title length",
        format: (d, f) => (f ? "—" : `${(d?.metaData?.title || "").length} chars`),
        numeric: (d) => (d ? (d.metaData?.title || "").length : null),
    },
    {
        key: "desc",
        label: "Meta description",
        format: (d, f) => (f ? "—" : (d?.metaData?.description ? `${d.metaData.description.length} chars` : "Missing")),
        numeric: (d) => (d?.metaData?.description ? d.metaData.description.length : 0),
    },
    {
        key: "words",
        label: "Word count",
        format: (d, f) => (f ? "—" : String(d?.wordCount ?? 0)),
        numeric: (d) => d?.wordCount ?? null,
    },
    {
        key: "h1",
        label: "H1 present",
        format: (d, f) => (f ? "—" : (d?.headings?.h1 ? "Yes" : "No")),
        numeric: (d) => (d?.headings?.h1 ? 1 : 0),
    },
    {
        key: "schema",
        label: "Schema markup",
        format: (d, f) => (f ? "—" : d?.hasJsonLd ? "Yes" : "No"),
        numeric: (d) => (d?.hasJsonLd ? 1 : 0),
    },
    {
        key: "canonical",
        label: "Canonical tag",
        format: (d, f) => (f ? "—" : d?.metaData?.canonical ? "Yes" : "No"),
        numeric: (d) => (d?.metaData?.canonical ? 1 : 0),
    },
    {
        key: "og",
        label: "OG tags",
        format: (d, f) => (f ? "—" : d?.metaData?.ogTitle || d?.metaData?.ogDescription ? "Yes" : "No"),
        numeric: (d) => (d?.metaData?.ogTitle || d?.metaData?.ogDescription ? 1 : 0),
    },
    {
        key: "alt",
        label: "Images missing alt",
        lowerIsBetter: true,
        format: (d, f) => (f ? "—" : String(d?.images?.missingAlt ?? 0)),
        numeric: (d) => d?.images?.missingAlt ?? null,
    },
    {
        key: "internal",
        label: "Internal links",
        format: (d, f) => (f ? "—" : String(d?.links?.internal ?? 0)),
        numeric: (d) => d?.links?.internal ?? null,
    },
    {
        key: "external",
        label: "External links",
        format: (d, f) => (f ? "—" : String(d?.links?.external ?? 0)),
        numeric: (d) => d?.links?.external ?? null,
    },
    {
        key: "load",
        label: "Page load time",
        lowerIsBetter: true,
        format: (d, f) => (f ? "—" : `${((d?.loadTime ?? 0) / 1000).toFixed(2)}s`),
        numeric: (d) => d?.loadTime ?? null,
    },
];

export function cellRank(values: ({ value: number | null; index: number } | null)[], lowerIsBetter?: boolean) {
    const valid = values.filter((v): v is { value: number; index: number } => v !== null && v.value !== null);
    if (valid.length < 2) return values.map(() => "neutral" as const);

    const sorted = [...valid].sort((a, b) => (lowerIsBetter ? a.value - b.value : b.value - a.value));
    const bestVal = sorted[0].value;
    const worstVal = sorted[sorted.length - 1].value;

    return values.map((v) => {
        if (!v || v.value === null) return "neutral" as const;
        if (v.value === bestVal && bestVal !== worstVal) return "best" as const;
        if (v.value === worstVal && bestVal !== worstVal) return "worst" as const;
        return "neutral" as const;
    });
}

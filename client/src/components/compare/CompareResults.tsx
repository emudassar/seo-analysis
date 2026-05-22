/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Legend,
} from "recharts";
import { Crown, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import ScoreGauge from "../ScoreGauge";
import {
    SITE_COLORS,
    type ComparisonData,
    type ScrapeResult,
    domainFromUrl,
    avgScore,
    METRIC_ROWS,
    cellRank,
} from "../../lib/compareUtils";

const SCORE_KEYS = [
    { key: "onPageSeo", label: "On-Page SEO" },
    { key: "contentDepth", label: "Content" },
    { key: "technicalSeo", label: "Technical" },
    { key: "performance", label: "Performance" },
    { key: "accessibility", label: "Accessibility" },
] as const;

interface Props {
    comparison: ComparisonData;
    scrapeResults: ScrapeResult[];
}

export default function CompareResults({ comparison, scrapeResults }: Props) {
    const radarData = SCORE_KEYS.map(({ key, label }) => {
        const row: Record<string, string | number> = { dimension: label };
        comparison.sites.forEach((site) => {
            row[site.label] = site.scores[key as keyof typeof site.scores];
        });
        return row;
    });

    const scrapeByLabel = Object.fromEntries(scrapeResults.map((s) => [s.label, s]));
    const winnerDomain = domainFromUrl(comparison.winner);

    const sortedGaps = [...comparison.gaps].sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.impact] - order[b.impact];
    });

    return (
        <div className="space-y-12 animate-slide-up">
            <div className="glass-strong rounded-2xl p-6 sm:p-8 border border-primary/20">
                <p className="text-lg text-foreground leading-relaxed">{comparison.summary}</p>
                <p className="text-sm text-muted-foreground mt-3">
                    Overall winner: <span className="text-primary font-medium">{winnerDomain}</span>
                </p>
            </div>

            {/* Section A — Radar */}
            <section>
                <h2 className="text-xl font-semibold text-foreground mb-1">Score comparison</h2>
                <p className="text-sm text-muted-foreground mb-6">Five dimensions across all sites — your site highlighted in blue</p>
                <div className="glass rounded-2xl p-4 sm:p-6 border border-border">
                    <div className="h-[340px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                                <PolarGrid stroke="var(--border)" />
                                <PolarAngleAxis dataKey="dimension" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} />
                                {comparison.sites.map((site, i) => (
                                    <Radar
                                        key={site.url}
                                        name={site.label}
                                        dataKey={site.label}
                                        stroke={SITE_COLORS[i % SITE_COLORS.length]}
                                        fill={SITE_COLORS[i % SITE_COLORS.length]}
                                        fillOpacity={site.label === "Your Site" ? 0.35 : 0.12}
                                        strokeWidth={site.label === "Your Site" ? 2.5 : 1.5}
                                    />
                                ))}
                                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* Section B — Score cards */}
            <section>
                <h2 className="text-xl font-semibold text-foreground mb-6">Site scores</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {comparison.sites.map((site, siteIdx) => {
                        const overall = avgScore(site.scores);
                        const isYours = site.label === "Your Site";
                        const scrape = scrapeByLabel[site.label];
                        const failed = scrape && !scrape.success;

                        return (
                            <div
                                key={site.url}
                                className={`rounded-2xl p-5 flex flex-col ${
                                    isYours ? "glass-strong border-2 border-primary/40 ring-1 ring-primary/20" : "glass border border-border"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-2 mb-4">
                                    <div className="min-w-0">
                                        <p className="text-xs text-primary font-medium uppercase tracking-wide">{site.label}</p>
                                        <p className="text-sm font-semibold text-foreground truncate mt-0.5">{domainFromUrl(site.url)}</p>
                                    </div>
                                    {failed && (
                                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-amber-600 border border-warning/30">
                                            Unreachable
                                        </span>
                                    )}
                                </div>

                                <div className="flex justify-center mb-4">
                                    <ScoreGauge score={overall} size={100} strokeWidth={8} />
                                </div>

                                <ul className="space-y-1.5 mb-3 flex-1">
                                    {site.strengths.slice(0, 3).map((s) => (
                                        <li key={s} className="text-xs text-emerald-600 dark:text-emerald-400 flex gap-1.5">
                                            <CheckCircle2 size={12} className="shrink-0 mt-0.5" />
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                                <ul className="space-y-1.5">
                                    {site.weaknesses.slice(0, 3).map((w) => (
                                        <li key={w} className="text-xs text-red-500 flex gap-1.5">
                                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                                            <span>{w}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div
                                    className="mt-3 h-1 rounded-full"
                                    style={{ background: SITE_COLORS[siteIdx % SITE_COLORS.length], opacity: 0.6 }}
                                />
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Section C — Metric table */}
            <section>
                <h2 className="text-xl font-semibold text-foreground mb-6">Metric breakdown</h2>
                <div className="glass rounded-2xl border border-border overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                <th className="text-left p-4 font-medium text-muted-foreground">Metric</th>
                                {comparison.sites.map((site) => (
                                    <th key={site.url} className={`p-4 text-center font-medium ${site.label === "Your Site" ? "text-primary" : "text-foreground"}`}>
                                        {domainFromUrl(site.url)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {METRIC_ROWS.map((row) => {
                                const cells = comparison.sites.map((site, colIdx) => {
                                    const scrape = scrapeByLabel[site.label];
                                    const failed = !scrape?.success;
                                    const data = scrape?.data;
                                    const num = row.numeric?.(data);
                                    return num !== null && num !== undefined && !failed ? { value: num, index: colIdx } : null;
                                });

                                const ranks = cellRank(cells, row.lowerIsBetter);

                                return (
                                    <tr key={row.key} className="border-b border-border/50 hover:bg-muted/20">
                                        <td className="p-4 text-muted-foreground font-medium">{row.label}</td>
                                        {comparison.sites.map((site, colIdx) => {
                                            const scrape = scrapeByLabel[site.label];
                                            const failed = !scrape?.success;
                                            const rank = ranks[colIdx];
                                            const bg =
                                                rank === "best"
                                                    ? "bg-emerald-500/15"
                                                    : rank === "worst"
                                                      ? "bg-red-500/10"
                                                      : "";

                                            return (
                                                <td key={site.url} className={`p-4 text-center text-foreground ${bg}`}>
                                                    <span className="inline-flex items-center gap-1 justify-center">
                                                        {rank === "best" && <Crown size={14} className="text-amber-500" />}
                                                        {failed ? (
                                                            <span className="text-xs text-amber-600">Could not access</span>
                                                        ) : (
                                                            row.format(scrape?.data, false)
                                                        )}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Section D — Gaps */}
            <section>
                <h2 className="text-xl font-semibold text-foreground mb-6">Gap analysis</h2>
                {sortedGaps.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No significant gaps detected — you lead on tracked metrics.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {sortedGaps.map((gap) => (
                            <div key={gap.metric + gap.fix} className="glass rounded-xl p-5 border border-border hover:border-primary/20 transition-colors">
                                <div className="flex items-start justify-between gap-2 mb-3">
                                    <h3 className="font-medium text-foreground">{gap.metric}</h3>
                                    <span
                                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                            gap.impact === "high"
                                                ? "bg-red-500/15 text-red-500 border border-red-500/30"
                                                : gap.impact === "medium"
                                                  ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                                  : "bg-muted text-muted-foreground border border-border"
                                        }`}
                                    >
                                        {gap.impact}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                    <div className="rounded-lg bg-muted/50 p-2">
                                        <p className="text-muted-foreground mb-0.5">You</p>
                                        <p className="font-medium text-foreground">{gap.yourValue}</p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-500/10 p-2">
                                        <p className="text-muted-foreground mb-0.5">Best competitor</p>
                                        <p className="font-medium text-foreground">{gap.bestCompetitorValue}</p>
                                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{domainFromUrl(gap.bestCompetitorUrl)}</p>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    <span className="text-primary font-medium">Fix: </span>
                                    {gap.fix}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Section E — Priority fixes */}
            <section>
                <h2 className="text-xl font-semibold text-foreground mb-2">Priority action plan</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    Fix these {comparison.prioritizedFixes.length} issues to close the gap with{" "}
                    <span className="text-foreground font-medium">{winnerDomain}</span>
                </p>
                <div className="space-y-3">
                    {comparison.prioritizedFixes.map((fix, i) => (
                        <div key={fix} className="glass rounded-xl p-4 flex items-start gap-4 border border-border hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
                                    {i + 1}
                                </span>
                                <Circle size={18} className="text-muted-foreground/50" />
                            </div>
                            <p className="text-sm text-foreground pt-1.5">{fix}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

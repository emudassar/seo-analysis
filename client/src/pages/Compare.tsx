/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Plus, X, Loader2, AlertCircle, Users, Sparkles, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import CompareResults from "../components/compare/CompareResults";
import type { ComparisonData, ScrapeResult } from "../lib/compareUtils";

const LOADING_MESSAGES = [
    "Scraping your site...",
    "Scraping competitors...",
    "Running AI analysis...",
    "Building comparison report...",
];

export default function Compare() {
    const { api } = useApp();
    const [searchParams] = useSearchParams();

    const [ownUrl, setOwnUrl] = useState(searchParams.get("own") || searchParams.get("url") || "");
    const [competitors, setCompetitors] = useState<string[]>([""]);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
    const [error, setError] = useState("");
    const [comparison, setComparison] = useState<ComparisonData | null>(null);
    const [scrapeResults, setScrapeResults] = useState<ScrapeResult[] | null>(null);
    const msgIndex = useRef(0);

    useEffect(() => {
        if (!loading) return;
        const id = setInterval(() => {
            msgIndex.current = (msgIndex.current + 1) % LOADING_MESSAGES.length;
            setLoadingMsg(LOADING_MESSAGES[msgIndex.current]);
        }, 2800);
        return () => clearInterval(id);
    }, [loading]);

    const addCompetitor = () => {
        if (competitors.length < 3) setCompetitors([...competitors, ""]);
    };

    const removeCompetitor = (index: number) => {
        setCompetitors(competitors.filter((_, i) => i !== index));
    };

    const updateCompetitor = (index: number, value: string) => {
        const next = [...competitors];
        next[index] = value;
        setCompetitors(next);
    };

    const handleCompare = async (e?: React.SubmitEvent) => {
        e?.preventDefault();
        if (!ownUrl.trim()) {
            setError("Enter your website URL");
            return;
        }

        const filledCompetitors = competitors.filter((c) => c.trim());
        if (filledCompetitors.length === 0) {
            setError("Add at least one competitor URL");
            return;
        }

        setError("");
        setComparison(null);
        setScrapeResults(null);
        setLoading(true);
        setLoadingMsg(LOADING_MESSAGES[0]);
        msgIndex.current = 0;

        try {
            const res = await api.post("/api/analysis/compare", {
                ownUrl: ownUrl.trim(),
                competitors: filledCompetitors,
            });

            if (res.data.success) {
                setComparison(res.data.comparison);
                setScrapeResults(res.data.scrapeResults);
            } else {
                setError(res.data.message || "Comparison failed");
                if (res.data.scrapeResults) setScrapeResults(res.data.scrapeResults);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || "Comparison request failed");
            if (err.response?.data?.scrapeResults) setScrapeResults(err.response.data.scrapeResults);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20">
                <div className="mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4 border border-primary/20">
                        <Users size={14} />
                        Competitor Intelligence
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-medium text-foreground">
                        Compare <span className="gradient-text">side by side</span>
                    </h1>
                    <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
                        Scrape your site and up to 3 competitors in parallel, then get an AI-powered gap analysis with scores, metrics, and prioritized fixes.
                    </p>
                </div>

                {!comparison && !loading && (
                    <form onSubmit={handleCompare} className="glass-strong rounded-2xl p-6 sm:p-8 border border-border mb-10 max-w-3xl">
                        <label className="block text-sm font-medium text-foreground mb-2">Your website</label>
                        <div className="relative mb-6">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={ownUrl}
                                onChange={(e) => setOwnUrl(e.target.value)}
                                placeholder="https://yoursite.com"
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:border-primary/50"
                            />
                        </div>

                        <label className="block text-sm font-medium text-foreground mb-2">Competitors (up to 3)</label>
                        <div className="space-y-3 mb-4">
                            {competitors.map((url, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => updateCompetitor(i, e.target.value)}
                                        placeholder={`Competitor ${i + 1} URL`}
                                        className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border text-foreground outline-none focus:border-primary/50 text-sm"
                                    />
                                    {competitors.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCompetitor(i)}
                                            className="p-3 rounded-xl border border-border text-muted-foreground hover:text-danger hover:border-danger/30 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {competitors.length < 3 && (
                            <button
                                type="button"
                                onClick={addCompetitor}
                                className="flex items-center gap-2 text-sm text-primary hover:underline mb-6"
                            >
                                <Plus size={16} />
                                Add competitor
                            </button>
                        )}

                        {error && (
                            <div className="mb-4 px-4 py-3 rounded-xl border border-danger/30 bg-danger/5 text-sm flex gap-2 text-danger">
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-primary font-medium text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                            style={{ color: "var(--background)" }}
                        >
                            <Sparkles size={18} />
                            Compare sites
                            <ArrowRight size={16} />
                        </button>
                    </form>
                )}

                {loading && (
                    <div className="max-w-lg mx-auto text-center py-16">
                        <div className="relative w-24 h-24 mx-auto mb-8">
                            <div className="absolute inset-0 rounded-full border-4 border-muted" />
                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                            <Loader2 className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
                        </div>
                        <h2 className="text-xl font-medium text-foreground mb-2">Analyzing competition</h2>
                        <p className="text-primary text-sm font-medium animate-pulse">{loadingMsg}</p>
                        <div className="mt-8 flex justify-center gap-1.5">
                            {LOADING_MESSAGES.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                        loadingMsg === LOADING_MESSAGES[i] ? "w-8 bg-primary" : "w-1.5 bg-muted"
                                    }`}
                                />
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-6">This usually takes 30–90 seconds depending on site count</p>
                    </div>
                )}

                {comparison && scrapeResults && !loading && (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                            <button
                                type="button"
                                onClick={() => {
                                    setComparison(null);
                                    setScrapeResults(null);
                                }}
                                className="text-sm text-primary hover:underline"
                            >
                                ← New comparison
                            </button>
                            <Link to="/analyze" className="text-sm text-muted-foreground hover:text-foreground">
                                Run single-site audit
                            </Link>
                        </div>
                        <CompareResults comparison={comparison} scrapeResults={scrapeResults} />
                    </>
                )}

                {error && !loading && !comparison && scrapeResults && (
                    <div className="mt-6 text-sm text-muted-foreground">
                        <p>Partial scrape results may be available. Adjust URLs and try again.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

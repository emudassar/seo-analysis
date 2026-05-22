/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { SearchIcon, GlobeIcon, FileSearchIcon, BrainIcon, CheckCircleIcon, AlertCircle, Loader2, ArrowRightIcon, RotateCcw, Users } from "lucide-react";
import { useApp } from "../context/AppContext";

const STEPS = [
    { icon: GlobeIcon, label: "Launch browser", desc: "Starting Playwright to render your page" },
    { icon: FileSearchIcon, label: "Scan page", desc: "Collecting meta tags, headings, links, and images" },
    { icon: BrainIcon, label: "AI analysis", desc: "Gemini is scoring SEO and generating recommendations" },
    { icon: CheckCircleIcon, label: "Complete", desc: "Opening your report" },
];

const POLL_MS = 2000;
const MAX_ATTEMPTS = 90;

export default function Analyze() {
    const { api } = useApp();
    const [url, setUrl] = useState("");
    const [analyzing, setAnalyzing] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState("");
    const [searchParams] = useSearchParams();
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const navigate = useNavigate();

    const clearPoll = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const handleAnalyze = useCallback(
        async (submitUrl?: string) => {
            const targetUrl = (submitUrl || url).trim();
            if (!targetUrl) return;

            clearPoll();
            setError("");
            setAnalyzing(true);
            setCurrentStep(0);
            setProgress(5);

            try {
                const res = await api.post("/api/analysis/analyze", {
                    url: targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`,
                });

                if (!res.data.success) {
                    throw new Error(res.data.message || "Could not start analysis");
                }

                const id = res.data.analysisId;
                setCurrentStep(1);
                setProgress(25);

                let attempts = 0;

                pollRef.current = setInterval(async () => {
                    attempts++;
                    const pct = Math.min(95, 25 + Math.floor((attempts / MAX_ATTEMPTS) * 70));
                    setProgress(pct);

                    if (attempts > MAX_ATTEMPTS) {
                        clearPoll();
                        setError("Analysis is taking longer than expected. Check History for status.");
                        setAnalyzing(false);
                        return;
                    }

                    try {
                        const check = await api.get(`/api/analysis/${id}`);
                        const analysis = check.data.analysis;

                        if (analysis.status === "completed") {
                            clearPoll();
                            setCurrentStep(3);
                            setProgress(100);
                            setTimeout(() => navigate(`/report/${id}`), 800);
                        } else if (analysis.status === "failed") {
                            clearPoll();
                            setError("Analysis failed. The site may be unreachable or the AI service is temporarily unavailable. Please try again.");
                            setAnalyzing(false);
                        } else if (attempts > 3) {
                            setCurrentStep(2);
                        }
                    } catch {
                        // keep polling on transient network errors
                    }
                }, POLL_MS);
            } catch (err: any) {
                setError(err.response?.data?.message || err.message || "Failed to start analysis");
                setAnalyzing(false);
                setProgress(0);
            }
        },
        [api, navigate, url]
    );

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        handleAnalyze();
    };

    useEffect(() => {
        const prefillUrl = searchParams.get("url");
        if (prefillUrl) {
            setUrl(prefillUrl);
            const t = setTimeout(() => handleAnalyze(prefillUrl), 400);
            return () => clearTimeout(t);
        }
        return clearPoll;
    }, []);

    return (
        <div className="min-h-screen pt-16 md:pt-24 bg-background">
            <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">
                {!analyzing ? (
                    <>
                        <div className="text-center mb-10">
                            <h1 className="text-3xl sm:text-4xl font-medium text-foreground mb-2">
                                <span className="gradient-text">Analyze</span> a website
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base">Full SEO audit with scores, keywords, and fix recommendations.</p>
                        </div>

                        {error && (
                            <div className="mb-6 px-4 py-3 rounded-xl border border-danger/30 bg-danger/5 text-sm flex items-start gap-2">
                                <AlertCircle size={18} className="shrink-0 text-danger mt-0.5" />
                                <div className="flex-1">
                                    <p>{error}</p>
                                    <button type="button" onClick={() => handleAnalyze()} className="mt-2 text-primary text-xs font-medium hover:underline inline-flex items-center gap-1">
                                        <RotateCcw size={12} /> Try again
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mb-6">
                            <div className="border border-primary/25 rounded-2xl p-2 flex items-center gap-2 bg-card shadow-sm">
                                <div className="flex items-center gap-3 flex-1 px-3 min-w-0">
                                    <SearchIcon size={20} className="text-muted-foreground shrink-0" />
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://yoursite.com"
                                        className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none text-base py-3"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-primary px-6 py-3 rounded-xl flex items-center gap-2 text-sm font-medium hover:opacity-90 shrink-0"
                                    style={{ color: "var(--background)" }}
                                >
                                    Run audit
                                    <ArrowRightIcon size={16} />
                                </button>
                            </div>
                        </form>

                        <p className="text-center text-sm text-muted-foreground mb-4">Try an example:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {["example.com", "github.com", "stripe.com"].map((ex) => (
                                <button
                                    key={ex}
                                    type="button"
                                    onClick={() => setUrl(ex)}
                                    className="px-3 py-1.5 rounded-full text-xs border border-border bg-muted/50 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link
                                to={url.trim() ? `/compare?own=${encodeURIComponent(url)}` : "/compare"}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 text-sm text-primary hover:bg-primary/5 transition-colors"
                            >
                                <Users size={16} />
                                Compare with competitors
                            </Link>
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            Typical run time: 20–45 seconds · <Link to="/history" className="text-primary hover:underline">View past reports</Link>
                        </p>
                    </>
                ) : (
                    <div className="mt-8">
                        <div className="text-center mb-8">
                            <h2 className="text-xl sm:text-2xl font-medium text-foreground">Running SEO audit</h2>
                            <p className="text-muted-foreground text-sm mt-2 truncate max-w-md mx-auto">{url}</p>
                        </div>

                        <div className="h-2 rounded-full bg-muted overflow-hidden mb-10">
                            <div className="h-full bg-primary transition-all duration-500 ease-out rounded-full" style={{ width: `${progress}%` }} />
                        </div>

                        <div className="space-y-3">
                            {STEPS.map((step, i) => {
                                const Icon = step.icon;
                                const isComplete = i < currentStep;
                                const isCurrent = i === currentStep;
                                return (
                                    <div
                                        key={step.label}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                            isCurrent ? "border-primary/40 bg-primary/5" : isComplete ? "border-border/50 opacity-70" : "border-transparent opacity-40"
                                        }`}
                                    >
                                        <div
                                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                isComplete ? "bg-emerald-500/15 text-emerald-500" : isCurrent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            }`}
                                            style={isCurrent ? { color: "var(--background)" } : {}}
                                        >
                                            {isComplete ? <CheckCircleIcon size={20} /> : <Icon size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground">{step.label}</p>
                                            <p className="text-xs text-muted-foreground">{step.desc}</p>
                                        </div>
                                        {isCurrent && <Loader2 size={18} className="animate-spin text-primary shrink-0" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

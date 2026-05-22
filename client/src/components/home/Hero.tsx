import { SearchIcon, ArrowRightIcon, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { HomeWave } from "../../assets/assets";

export default function Hero() {
    const [url, setUrl] = useState("");
    const navigate = useNavigate();
    const { user } = useApp();

    const handleQuickAnalyze = (e: React.SubmitEvent) => {
        e.preventDefault();
        if (!url.trim()) return;
        const target = `/analyze?url=${encodeURIComponent(url)}`;
        navigate(user ? target : `/register?redirect=${encodeURIComponent(target)}`);
    };

    return (
        <section className="relative max-w-3xl mx-auto px-4 py-36 sm:py-44 min-h-screen text-center flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full text-xs text-primary mb-6 border border-primary/15">
                <Sparkles size={14} />
                Playwright + Gemini AI SEO audits
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-medium leading-tight mb-6 text-foreground">
                Instant <span className="gradient-text dm-serif">SEO Analysis</span> for any site
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
                Paste a URL and get a full audit — meta tags, performance, accessibility, keywords, and prioritized fixes in one report.
            </p>

            <form onSubmit={handleQuickAnalyze} className="max-w-2xl mx-auto relative w-full">
                <div className="bg-card border border-border rounded-full px-2 py-1.5 flex items-center gap-2 shadow-sm">
                    <div className="flex items-center gap-2 flex-1 px-3 min-w-0">
                        <SearchIcon size={16} className="text-muted-foreground shrink-0" />
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="example.com"
                            className="w-full bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm py-2.5"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-primary px-5 py-2.5 rounded-full text-primary-foreground text-sm hover:opacity-90 transition-opacity shrink-0 flex items-center gap-2"
                        style={{ color: "var(--background)" }}
                    >
                        Analyze
                        <ArrowRightIcon size={14} />
                    </button>
                </div>
            </form>

            <p className="text-muted-foreground text-sm mt-6">Free plan · 5 analyses per day · No credit card</p>

            <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none -z-1">
                <HomeWave />
            </div>
        </section>
    );
}

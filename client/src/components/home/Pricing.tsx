import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function Pricing() {
    return (
        <section id="pricing" className="relative md:min-h-[80vh] flex flex-col justify-center items-center max-lg:py-24 scroll-mt-20">
            <div className="bg-dot-pattern absolute inset-0 -z-1 opacity-10"></div>
            <div className="max-w-5xl w-full mx-auto px-4">
                <div className="text-center mb-14">
                    <h2 className="text-3xl sm:text-4xl font-semibold mb-4 text-foreground">
                        Simple <span className="gradient-text">pricing</span>
                    </h2>
                    <p className="text-muted-foreground">Pay for analyses, not rank tracking you do not need.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                    <div className="bg-card border border-border rounded-2xl p-8 flex flex-col">
                        <h3 className="text-xl font-semibold mb-1 text-foreground">Free</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-foreground">$0</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {["5 analyses per day", "Full SEO report", "Keyword extraction", "Issue recommendations", "Report history"].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle size={16} className="text-primary shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Link to="/register" className="block w-full py-3 rounded-xl bg-muted text-center text-sm font-medium hover:bg-muted/80 transition-colors">
                            Start free
                        </Link>
                    </div>

                    <div className="relative rounded-2xl p-8 flex flex-col bg-card border border-primary/30">
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-xs font-medium" style={{ color: "var(--background)" }}>
                            Pro
                        </div>
                        <h3 className="text-xl font-semibold mb-1 text-foreground">Pro</h3>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-primary">$19</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                            {["Unlimited analyses", "Priority processing", "Full report history", "Export reports", "Email support"].map((item) => (
                                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CheckCircle size={16} className="text-primary shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 rounded-xl bg-primary text-center text-sm font-medium hover:opacity-90" style={{ color: "var(--background)" }}>
                            Coming soon
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
